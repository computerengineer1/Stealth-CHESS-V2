import os
import re
import urllib.request
import urllib.error
import json
import datetime
import hashlib
import uuid
import subprocess
import sys

try:
    import license_core
    _ED_OK = True
except Exception:
    _ED_OK = False

# Central licensing server (Cloudflare Worker). Set to your worker URL after deploy.
SERVER_URL = os.environ.get("STEALTH_LICENSE_SERVER", "")


def sanitize_key(raw_key: str) -> str:
    """Activation tokens are of the form <10-hex-ID>.<base64url signature blob>.
    Old hex typo-fixing is removed (it would corrupt base64 signatures)."""
    if not raw_key:
        return ""
    k = raw_key.strip()
    if "." in k:
        kid, rest = k.split(".", 1)
        return kid.upper() + "." + rest
    return k.upper()


def _persisted_install_salt() -> str:
    """Random salt created at first run so the HWID cannot be trivially predicted."""
    salt_file = os.path.join(os.environ.get("APPDATA", "."), "stealth_chess_salt.bin")
    try:
        if os.path.exists(salt_file):
            with open(salt_file, "r", encoding="utf-8") as f:
                s = f.read().strip()
                if len(s) >= 16:
                    return s
        s = uuid.uuid4().hex + uuid.uuid4().hex
        d = os.path.dirname(salt_file)
        if d and not os.path.isdir(d):
            os.makedirs(d, exist_ok=True)
        with open(salt_file, "w", encoding="utf-8") as f:
            f.write(s)
        return s
    except Exception:
        return uuid.uuid4().hex


def get_hwid() -> str:
    """Stable machine fingerprint (Windows / macOS / Linux) with fallbacks.

    Uses MachineGuid (registry) on Windows — works on Windows 11 where the
    old `wmic` tool has been removed — plus a per-install random salt so
    fingerprints cannot be guessed from public info.
    """
    raw_id = ""
    if sys.platform == "win32":
        try:
            import winreg
            key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Cryptography")
            raw_id, _ = winreg.QueryValueEx(key, "MachineGuid")
            winreg.CloseKey(key)
        except Exception:
            pass
        if not raw_id:
            try:
                cmd = ("powershell -NoProfile -Command "
                       "(Get-CimInstance -ClassName Win32_ComputerSystemProduct).UUID")
                out = subprocess.check_output(cmd, shell=True, timeout=10,
                                              creationflags=0x08000000).decode().strip()
                if len(out) >= 8:
                    raw_id = out
            except Exception:
                pass
    elif sys.platform == "darwin":
        try:
            out = subprocess.check_output(
                ["ioreg", "-rd1", "-c", "IOPlatformExpertDevice"], timeout=10).decode()
            m = re.search(r'"IOPlatformUUID"\s*=\s*"([^"]+)"', out)
            if m:
                raw_id = m.group(1)
        except Exception:
            pass
    else:  # linux
        for p in ("/etc/machine-id", "/var/lib/dbus/machine-id"):
            try:
                with open(p) as f:
                    raw_id = f.read().strip()
                if raw_id:
                    break
            except Exception:
                pass

    if not raw_id or len(raw_id) < 5:
        raw_id = str(uuid.getnode())

    raw_id += "|" + _persisted_install_salt()
    h = hashlib.sha256(raw_id.encode("utf-8")).hexdigest().upper()
    return f"{h[0:4]}-{h[4:8]}-{h[8:12]}-{h[12:16]}"


class LicenseManager:
    """
    Manages license validation for the Chess Bot.
    Fetches an encrypted license database from a remote URL (like GitHub Gist or Pastebin),
    decrypts it, and verifies the subscription key's validity and expiration.
    """
    LICENSE_FILE = "license.key"

    def __init__(self, api_url=None):
        self.api_url = api_url
        self.license_key = ""
        self.is_valid = False
        self.expiry_date = "N/A"
        self.tier = "N/A"
        self.error_message = ""

    def load_local_key(self) -> str:
        """Loads the license key from a local file if it exists."""
        if os.path.exists(self.LICENSE_FILE):
            try:
                with open(self.LICENSE_FILE, "r", encoding="utf-8") as f:
                    self.license_key = f.read().strip()
                return self.license_key
            except Exception:
                pass
        return ""

    def save_local_key(self, key: str):
        """Saves the license key to a local file."""
        self.license_key = sanitize_key(key)
        try:
            with open(self.LICENSE_FILE, "w", encoding="utf-8") as f:
                f.write(self.license_key)
        except Exception as e:
            print(f"Error saving license key: {e}")

    def clear_local_key(self):
        """Removes the local license file."""
        if os.path.exists(self.LICENSE_FILE):
            try:
                os.remove(self.LICENSE_FILE)
            except Exception:
                pass
        self.license_key = ""
        self.is_valid = False

    def _server_post(self, path: str, payload: dict, timeout: int = 8):
        """Call the central Cloudflare Worker license server."""
        url = (self.api_url or "").rstrip("/") + path
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url, data=data,
            headers={"Content-Type": "application/json",
                    "User-Agent": "StealthChess-Licensing/2.0"},
            method="POST")
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))

    def validate_key(self, key: str) -> bool:
        """
        New security model (v2.0):
          1. The key is an Ed25519-signed activation token — verified with the
             embedded PUBLIC key only. It is mathematically impossible to forge
             a token without the owner's private signing key.
          2. If the central server is reachable, it additionally checks the
             live ledger (instant revocation) and enforces the HWID device lock.
          3. No test keys, no shared secrets, no downloadable database.
        """
        key = sanitize_key(key)
        if not key:
            self.error_message = "Key cannot be empty (المفتاح مطلوب)"
            self.is_valid = False
            return False

        current_hwid = get_hwid()

        # --- 1. Offline cryptographic verification (Ed25519 public key) ---
        crypto_res = None
        if _ED_OK:
            try:
                crypto_res = license_core.verify_key(key, current_hwid)
            except Exception:
                crypto_res = None

        if crypto_res and crypto_res.get("wrong_device"):
            self.error_message = ("Device lock mismatch. This license is bound to another computer. "
                                  "(هذا المفتاح مقفل على جهاز آخر)")
            self.is_valid = False
            return False

        # --- 2. Online: live ledger check (revocation + binding) ---
        server_ok = False
        server_error = None
        if self.api_url:
            try:
                res = self._server_post("/api/verify", {"key": crypto_res["nonce"] if crypto_res else key,
                                                        "hwid": current_hwid})
                if res.get("ok"):
                    server_ok = True
                else:
                    server_error = res.get("error", "REJECTED")
            except urllib.error.HTTPError as e:
                try:
                    body = json.loads(e.read().decode())
                    server_error = body.get("error", f"HTTP {e.code}")
                except Exception:
                    server_error = f"HTTP {e.code}"
            except Exception:
                server_error = None  # network down -> fall back to offline crypto

        if server_error == "REVOKED":
            self.error_message = "This license has been revoked by the publisher. (تم إلغاء هذا المفتاح)"
            self.is_valid = False
            self.clear_local_key()
            return False
        if server_error == "DEVICE_MISMATCH":
            self.error_message = ("Device lock mismatch. This license is registered to another computer. "
                                  "(هذا المفتاح مسجل ومقفل على كمبيوتر آخر)")
            self.is_valid = False
            return False
        if server_error == "EXPIRED":
            self.error_message = "Subscription expired (انتهى الاشتراك)"
            self.is_valid = False
            self.clear_local_key()
            return False

        # --- 3. Accept when offline signature is valid (server unreachable tolerated) ---
        if crypto_res and crypto_res.get("valid"):
            self.expiry_date = crypto_res["expiry_date"]
            self.tier = crypto_res["tier"]
            self.is_valid = True
            self.save_local_key(key)
            return True

        # Server said OK but we could not parse the token (legacy key formats are no longer accepted)
        if server_ok:
            self.error_message = ("This key uses the old format and is no longer supported. "
                                  "Please contact the publisher for a new activation code.")
            self.is_valid = False
            return False

        self.error_message = "Invalid or deactivated key (مفتاح ترخيص غير صحيح أو ملغي)."
        self.is_valid = False
        self.clear_local_key()
        return False
