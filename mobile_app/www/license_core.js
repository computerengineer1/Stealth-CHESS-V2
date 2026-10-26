/*
 * Stealth Chess Helper — Mobile Ed25519 license verification (PUBLIC key only)
 * ============================================================================
 * Mirrors license_core.py. The app NEVER contains a secret; it can only
 * VERIFY signatures made by the owner's private key. Forgery is impossible.
 *
 * Token format:  <KEYID-10hex>.<base64url( "SCHL1|PREFIX|EXP|NONCE|HWID" + 0x00 + sig64 )>
 *
 * Requires WebCrypto Ed25519 support:
 *   - iOS 18+ / macOS 15+ Safari & WKWebView: supported
 *   - Android WebView (Chrome 113+): supported
 * On older engines the app falls back to the SERVER verify endpoint
 * (Cloudflare Worker does the Ed25519 check remotely).
 */

const PUBLIC_KEY_HEX = "f80cfd3191b3d7cb8f6483e97236534fd0479cdb48f40c1e742fc164cf884d05";

const SCHL_VALID_PREFIXES = ["MON", "TRM", "LFT", "TRL"];
const SCHL_UNBOUND = "00000000";
const SCHL_TIERS = { MON: "Monthly", TRM: "3 Months", LFT: "Lifetime", TRL: "Trial" };

function schlHexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

function schlB64urlToBytes(b64) {
  let s = b64.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function schlNormalizeHwid(hwid) {
  const c = (hwid || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return c.length ? c : SCHL_UNBOUND;
}

async function schlSha256Prefix(str, len) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(d)).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, len).toUpperCase();
}

async function schlPublicKey() {
  const raw = schlHexToBytes(PUBLIC_KEY_HEX);
  // Import raw Ed25519 public key via JWK (works in WebCrypto)
  const jwk = {
    kty: "OKP", crv: "Ed25519", x: btoa(String.fromCharCode(...raw))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""),
  };
  return crypto.subtle.importKey("jwk", jwk, { name: "Ed25519" }, false, ["verify"]);
}

/**
 * Verify an activation token offline with the embedded public key.
 * Returns {valid, expired, tier, expiryDate, hwid, wrongDevice} or null.
 */
async function verifyTokenOffline(token, currentHwid) {
  if (!token || token.indexOf(".") === -1) return null;
  try {
    const [kidPart, b64Part] = token.split(".", 2);
    const raw = schlB64urlToBytes(b64Part);
    if (raw.length < 66) return null;
    const sig = raw.slice(raw.length - 64);
    const meta = raw.slice(0, raw.length - 65); // drop trailing 0x00
    const metaStr = new TextDecoder().decode(meta);
    const parts = metaStr.split("|");
    if (parts.length !== 5 || parts[0] !== "SCHL1") return null;
    const [, prefix, expd, nonce, hwidNorm] = parts;
    if (SCHL_VALID_PREFIXES.indexOf(prefix) === -1) return null;

    const pub = await schlPublicKey();
    const ok = await crypto.subtle.verify("Ed25519", pub, sig, new TextEncoder().encode(metaStr));
    if (!ok) return null;

    if (kidPart && kidPart.length === 10) {
      const expectedKid = await schlSha256Prefix(`SCHL1|${prefix}|${expd}|${nonce}`, 10);
      if (expectedKid !== kidPart.toUpperCase()) return null;
    }

    const bound = hwidNorm !== SCHL_UNBOUND;
    if (bound && currentHwid) {
      const cur = schlNormalizeHwid(currentHwid);
      if (cur !== hwidNorm) {
        return { valid: false, wrongDevice: true, expired: false, tier: SCHL_TIERS[prefix], expiryDate: "", hwid: hwidNorm };
      }
    }

    const epochDays = parseInt(expd, 16);
    const expiry = new Date(Date.UTC(1970, 0, 1) + epochDays * 86400000);
    const expired = new Date() > expiry;
    return {
      valid: !expired,
      expired,
      wrongDevice: false,
      tier: SCHL_TIERS[prefix] || "Unknown",
      expiryDate: expiry.toISOString().slice(0, 10),
      hwid: hwidNorm,
      nonce,
    };
  } catch (e) {
    return null; // engine without Ed25519 -> caller should use server verify
  }
}

/** Server-side verification fallback (works on any engine). */
async function verifyTokenViaServer(apiUrl, token, currentHwid) {
  const res = await fetch(apiUrl.replace(/\/$/, "") + "/api/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: token, hwid: currentHwid }),
  });
  const data = await res.json();
  if (data.ok) {
    return { valid: true, expired: false, wrongDevice: false, tier: data.tier, expiryDate: data.expiry };
  }
  return { valid: false, error: data.error };
}
