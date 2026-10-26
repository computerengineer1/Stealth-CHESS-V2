/**
 * Stealth Chess Helper — Central License Server (Cloudflare Worker)
 * =================================================================
 * Replaces the exposed GitHub Gist database with a real API:
 *
 *   POST /api/activate   { key, hwid }        -> binds key to device (first time)
 *   POST /api/verify     { key, hwid }        -> server-side validation + revocation check
 *   GET  /api/ping                            -> health check
 *   POST /admin/issue    (owner panel)        -> signs a NEW Ed25519 license (needs ADMIN_TOKEN)
 *   POST /admin/revoke   (owner panel)        -> kills a key instantly      (needs ADMIN_TOKEN)
 *   POST /admin/unbind   (owner panel)        -> resets a key's device lock (needs ADMIN_TOKEN)
 *   GET  /admin/list     (owner panel)        -> full ledger view           (needs ADMIN_TOKEN)
 *
 * SETUP (one time):
 *   1. npx wrangler secret put PRIVATE_KEY_HEX   <- your Ed25519 private key hex (32 bytes)
 *   2. npx wrangler secret put ADMIN_TOKEN       <- long random string ONLY you know
 *   3. npx wrangler deploy
 *   4. In the app set LICENSE_API_URL = https://<your-worker>.workers.dev
 *
 * Keys are stored in KV namespace `LEDGER` (create it and bind as LEDGER).
 * The client embeds only the PUBLIC key, so even a full copy of this worker
 * source cannot forge licenses without PRIVATE_KEY_HEX.
 */

const enc = new TextEncoder();
const dec = new TextDecoder();

// ---------- Ed25519 helpers (Web Crypto) ----------
let PRIV_KEY = null;
let PUB_JWK_THUMB = null;

async function initKeys(env) {
  if (PRIV_KEY) return PRIV_KEY;
  const hex = env.PRIVATE_KEY_HEX;
  if (!hex) throw new Error("PRIVATE_KEY_HEX secret not set");
  const raw = hexToBytes(hex);
  PRIV_KEY = await crypto.subtle.importKey(
    "pkcs8", pkcs8FromEd25519Raw(raw), { name: "ED25519" }, false, ["sign"]
  );
  return PRIV_KEY;
}

function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

// Wrap a raw 32-byte Ed25519 seed into PKCS#8 DER so WebCrypto can import it.
function pkcs8FromEd25519Raw(seed) {
  const prefix = hexToBytes("302e020100300506032b657004220420");
  const out = new Uint8Array(prefix.length + seed.length);
  out.set(prefix, 0);
  out.set(seed, prefix.length);
  return out;
}

// ---------- Canonical payload (must match license_core.py) ----------
function canonicalPayload(prefix, expd, nonce, hwidNorm) {
  return enc.encode(`SCHL1|${prefix}|${expd}|${nonce}|${hwidNorm}`);
}

function b64url(bytes) {
  let s = "";
  const bin = new Uint8Array(bytes);
  for (let i = 0; i < bin.length; i++) s += String.fromCharCode(bin[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function sha256HexPrefix(str, len) {
  // tiny sync-free helper replaced at call sites by async sha256
  return crypto.subtle.digest("SHA-256", enc.encode(str)).then(d =>
    bytesToHex(new Uint8Array(d)).slice(0, len).toUpperCase()
  );
}

function bytesToHex(buf) {
  return Array.from(buf).map(b => b.toString(16).padStart(2, "0")).join("");
}

function normalizeHwid(hwid) {
  const c = (hwid || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return c.length ? c : "00000000";
}

// ---------- Ledger storage (KV) ----------
async function ledgerGet(env, keyId) {
  const raw = await env.LEDGER.get("k:" + keyId);
  return raw ? JSON.parse(raw) : null;
}
async function ledgerPut(env, keyId, rec) {
  await env.LEDGER.put("k:" + keyId, JSON.stringify(rec));
}
async function ledgerList(env) {
  const list = await env.LEDGER.list({ prefix: "k:" });
  const out = [];
  for (const k of list.keys) {
    const raw = await env.LEDGER.get(k.name);
    if (raw) out.push(JSON.parse(raw));
  }
  return out;
}

// ---------- Handlers ----------
async function handleActivate(env, body) {
  const { key, hwid } = body;
  const rec = await ledgerGet(env, key);
  if (!rec) return json({ ok: false, error: "UNKNOWN_KEY" }, 404);
  if (rec.revoked) return json({ ok: false, error: "REVOKED" }, 403);

  const norm = normalizeHwid(hwid);
  if (norm === "00000000") return json({ ok: false, error: "HWID_REQUIRED" }, 400);

  if (!rec.hwid) {
    rec.hwid = norm;              // first activation locks the device forever
    rec.activated_at = Date.now();
    await ledgerPut(env, key, rec);
  } else if (rec.hwid !== norm) {
    return json({ ok: false, error: "DEVICE_MISMATCH" }, 403);
  }

  return json({
    ok: true, tier: rec.tier, expiry: rec.expiry, token: rec.token, hwid: rec.hwid,
  });
}

async function handleVerify(env, body) {
  const { key, hwid } = body;
  const rec = await ledgerGet(env, key);
  if (!rec) return json({ ok: false, error: "UNKNOWN_KEY" }, 404);
  if (rec.revoked) return json({ ok: false, error: "REVOKED" }, 403);
  if (rec.hwid && hwid && rec.hwid !== normalizeHwid(hwid)) {
    return json({ ok: false, error: "DEVICE_MISMATCH" }, 403);
  }
  const expired = new Date(rec.expiry + "T23:59:59Z") < new Date();
  if (expired) return json({ ok: false, error: "EXPIRED", expiry: rec.expiry }, 403);
  return json({ ok: true, tier: rec.tier, expiry: rec.expiry, token: rec.token });
}

async function requireAdmin(request, env) {
  const token = request.headers.get("X-Admin-Token") || "";
  if (!env.ADMIN_TOKEN || token !== env.ADMIN_TOKEN) {
    throw Object.assign(new Error("UNAUTHORIZED"), { status: 401 });
  }
}

async function handleIssue(env, body) {
  const tier = (body.tier || "MONTHLY").toUpperCase();
  const days = parseInt(body.days || 30, 10);
  const hwid = normalizeHwid(body.hwid || "");

  const prefixes = { MONTHLY: "MON", "3MONTHS": "TRM", LIFETIME: "LFT", TRIAL: "TRL" };
  const prefix = prefixes[tier];
  if (!prefix) return json({ ok: false, error: "BAD_TIER" }, 400);

  const expiryDate = tier === "LIFETIME"
    ? new Date(Date.UTC(2099, 11, 31))
    : new Date(Date.now() + days * 86400000);
  const epochDays = Math.floor(expiryDate.getTime() / 86400000);
  const expd = epochDays.toString(16).toUpperCase().padStart(4, "0");

  const rnd = new Uint8Array(6);
  crypto.getRandomValues(rnd);
  const nonce = bytesToHex(rnd).toUpperCase();

  const priv = await initKeys(env);
  const sig = new Uint8Array(await crypto.subtle.sign("ED25519", priv, canonicalPayload(prefix, expd, nonce, hwid)));
  const token = `${b64url(canonicalPayload(prefix, expd, nonce, hwid))}.${b64url(sig)}`;
  const keyId = (await sha256HexPrefix(`SCHL1|${prefix}|${expd}|${nonce}`, 10));

  const rec = {
    id: keyId,
    tier: prefix,
    tier_name: { MON: "Monthly", TRM: "3 Months", LFT: "Lifetime", TRL: "Trial" }[prefix],
    expiry: expiryDate.toISOString().slice(0, 10),
    hwid: hwid === "00000000" ? "" : hwid,
    token: `${keyId}.${token}`,
    revoked: false,
    created_at: Date.now(),
    label: body.label || "",
  };
  await ledgerPut(env, keyId, rec);
  return json({ ok: true, key: rec });
}

async function handleRevoke(env, body) {
  const rec = await ledgerGet(env, body.key);
  if (!rec) return json({ ok: false, error: "UNKNOWN_KEY" }, 404);
  rec.revoked = true;
  rec.revoked_at = Date.now();
  await ledgerPut(env, body.key, rec);
  return json({ ok: true });
}

async function handleUnbind(env, body) {
  const rec = await ledgerGet(env, body.key);
  if (!rec) return json({ ok: false, error: "UNKNOWN_KEY" }, 404);
  rec.hwid = "";
  await ledgerPut(env, body.key, rec);
  return json({ ok: true });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type,X-Admin-Token",
            "Access-Control-Max-Age": "86400",
          },
        });
      }
      if (url.pathname === "/api/ping") return json({ ok: true, service: "stealth-license", time: Date.now() });
      if (url.pathname === "/api/activate") return handleActivate(env, await request.json());
      if (url.pathname === "/api/verify") return handleVerify(env, await request.json());

      if (url.pathname.startsWith("/admin/")) {
        await requireAdmin(request, env);
        if (url.pathname === "/admin/issue") return handleIssue(env, await request.json());
        if (url.pathname === "/admin/revoke") return handleRevoke(env, await request.json());
        if (url.pathname === "/admin/unbind") return handleUnbind(env, await request.json());
        if (url.pathname === "/admin/list") return json({ ok: true, keys: await ledgerList(env) });
      }
      return json({ ok: false, error: "NOT_FOUND" }, 404);
    } catch (e) {
      return json({ ok: false, error: e.message || "INTERNAL" }, e.status || 500);
    }
  },
};
