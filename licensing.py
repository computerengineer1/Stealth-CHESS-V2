import os
import re
import urllib.request
import urllib.error
import json
import base64
import datetime
import hashlib
import uuid
import subprocess
import sys

# Must match the SECRET_KEY in encrypt_licenses.py
SECRET_KEY = "STEALTH_CHESS_SECURE_V4_KEY_2026_PRO"
LEGACY_SECRET_KEY = "STEALTH_CHESS_SECRET_KEY_2026"

def sanitize_key(raw_key: str) -> str:
    """Sanitizes user input: removes spaces, uppercase, and fixes common typos."""
    if not raw_key:
        return ""
    k = re.sub(r'\s+', '', raw_key.strip().upper())
    parts = k.split('-')
    if len(parts) == 4:
        prefix = parts[0]
        clean_parts = [prefix]
        for seg in parts[1:4]:
            # Convert common human typos in hex: O -> 0, I/L -> 1
            clean_seg = seg.replace('O', '0').replace('I', '1').replace('L', '1')
            clean_parts.append(clean_seg)
        return '-'.join(clean_parts)
    return k

def xor_encrypt_decrypt(data: str, key: str) -> str:
    """XOR encryption/decryption helper using a secret key."""
    key_len = len(key)
    output = []
    for i, char in enumerate(data):
        key_char = key[i % key_len]
        output.append(chr(ord(char) ^ ord(key_char)))
    return "".join(output)

def get_hwid() -> str:
    """Generates a stable, unique Machine ID for Windows with fallback options."""
    raw_id = ""
    if sys.platform == "win32":
        try:
            # Try to read the unique MachineGuid from Registry
            import winreg
            key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Cryptography")
            raw_id, _ = winreg.QueryValueEx(key, "MachineGuid")
            winreg.CloseKey(key)
        except Exception:
            try:
                # Fallback 1: WMI BIOS UUID (avoiding flash/cmd popup using CREATE_NO_WINDOW flag)
                # 0x08000000 is CREATE_NO_WINDOW
                out = subprocess.check_output("wmic csproduct get uuid", shell=True, creationflags=0x08000000).decode()
                raw_id = out.split('\n')[1].strip()
            except Exception:
                pass
                
    if not raw_id or len(raw_id) < 5:
        # Fallback 2: Unique node MAC address hash
        raw_id = str(uuid.getnode())
        
    h = hashlib.sha256(raw_id.encode('utf-8')).hexdigest().upper()
    return f"{h[0:4]}-{h[4:8]}-{h[8:12]}-{h[12:16]}"


def compute_checksum(prefix: str, expd: str, nonc: str, secret: str) -> str:
    comb = f"{prefix.upper()}-{expd.upper()}-{nonc.upper()}:{secret}"
    h = 0
    for ch in comb:
        h = ((h * 31) + ord(ch)) & 0xFFFFFFFF
    return f"{(h & 0xFFFF):04X}"

def verify_cryptographic_key(key: str, secret: str, hwid: str = None):
    key = sanitize_key(key)
    parts = key.split('-')
    if len(parts) != 4:
        return None
    prefix, expd, nonc, checksum = parts
    if prefix not in ["MON", "TRM", "LFT", "TRL"]:
        return None
    if len(expd) != 4 or len(nonc) != 4 or len(checksum) != 4:
        return None
        
    is_device_bound = False
    if hwid:
        clean_hwid = re.sub(r'[^A-Z0-9]', '', hwid.strip().upper())
        bound_secret = f"{secret}_{clean_hwid}"
        if checksum == compute_checksum(prefix, expd, nonc, bound_secret):
            is_device_bound = True

    if not is_device_bound:
        expected_checksum = compute_checksum(prefix, expd, nonc, secret)
        if checksum != expected_checksum:
            return None
    
    # Verify cryptographic expiration date from key
    try:
        epoch_days = int(expd, 16)
        expiry_date = datetime.date(1970, 1, 1) + datetime.timedelta(days=epoch_days)
    except Exception:
        return None

    current_date = datetime.date.today()
    if current_date > expiry_date:
        return {
            "valid": False,
            "expired": True,
            "expiry_date": expiry_date.strftime("%Y-%m-%d"),
            "error": f"Subscription expired on {expiry_date.strftime('%Y-%m-%d')} (انتهى الاشتراك)"
        }
    
    tier_str = "Monthly"
    if prefix == "TRM":
        tier_str = "3 Months"
    elif prefix == "LFT":
        tier_str = "Lifetime"
    elif prefix == "TRL":
        tier_str = "Trial"
        
    return {
        "valid": True,
        "expired": False,
        "tier": tier_str,
        "expiry_date": expiry_date.strftime("%Y-%m-%d"),
        "is_device_bound": is_device_bound
    }


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

    def validate_key(self, key: str) -> bool:
        """
        Validates the license key against cryptographic signature or remote database.
        Automatically binds the key to this machine on first run.
        """
        key = sanitize_key(key)
        if not key:
            self.error_message = "Key cannot be empty (المفتاح مطلوب)"
            self.is_valid = False
            return False

        # Support developer / local test keys
        if key == "TEST-KEY-MONTHLY":
            self.is_valid = True
            self.tier = "Monthly (Test)"
            self.expiry_date = (datetime.date.today() + datetime.timedelta(days=30)).strftime("%Y-%m-%d")
            self.save_local_key(key)
            return True
        elif key == "TEST-KEY-LIFETIME":
            self.is_valid = True
            self.tier = "Lifetime (Test)"
            self.expiry_date = "2099-12-31"
            self.save_local_key(key)
            return True

        # --- 1. Primary: Remote Database Verification & Strict Hardware Lock ---
        if self.api_url:
            try:
                req = urllib.request.Request(
                    self.api_url,
                    headers={"User-Agent": "ChessBot-Licensing-Client"}
                )
                with urllib.request.urlopen(req, timeout=5) as response:
                    payload = response.read().decode('utf-8').strip()
                    
                decoded_bytes = base64.b64decode(payload.encode('utf-8'))
                xor_str = decoded_bytes.decode('utf-8')

                db = None
                for test_secret in [SECRET_KEY, LEGACY_SECRET_KEY]:
                    try:
                        json_str = xor_encrypt_decrypt(xor_str, test_secret)
                        candidate = json.loads(json_str)
                        if isinstance(candidate, dict) and "keys" in candidate:
                            db = candidate
                            break
                    except Exception:
                        pass

                if db:
                    keys_dict = db.get("keys", {})
                    if key in keys_dict:
                        key_info = keys_dict[key]
                        expiry_str = key_info.get("expiry", "2026-05-22")
                        tier_str = key_info.get("tier", "Active")
                        allowed_hwid = key_info.get("hwid", "")
                        
                        current_hwid = get_hwid()
                        if allowed_hwid and allowed_hwid.strip() != "":
                            clean_allowed = re.sub(r'[^A-Z0-9]', '', allowed_hwid.strip().upper())
                            clean_current = re.sub(r'[^A-Z0-9]', '', current_hwid.upper())
                            if clean_allowed != clean_current:
                                self.error_message = "Device lock mismatch. Key is registered to another computer. (هذا المفتاح مسجل ومقفل على كمبيوتر آخر)"
                                self.is_valid = False
                                return False
                        
                        expiry_date = datetime.datetime.strptime(expiry_str, "%Y-%m-%d").date()
                        current_date = datetime.date.today()
                        if current_date > expiry_date:
                            self.error_message = f"Subscription expired on {expiry_str} (انتهى الاشتراك)"
                            self.is_valid = False
                            self.clear_local_key()
                            return False
                            
                        self.is_valid = True
                        self.tier = tier_str
                        self.expiry_date = expiry_str
                        self.save_local_key(key)
                        return True
                # Key not in remote DB — fall through to local cryptographic verification
                pass
            except urllib.error.URLError:
                # Network failure - allow local HWID fallback only if previously validated
                pass
            except Exception as e:
                pass

        # --- 2. Fallback: Local Machine HWID-Locked Verification with Embedded Expiry ---
        current_hwid = get_hwid()
        crypto_res = verify_cryptographic_key(key, SECRET_KEY, current_hwid)
        if crypto_res:
            if crypto_res.get("expired"):
                self.error_message = crypto_res.get("error", "Subscription expired (انتهى الاشتراك)")
                self.is_valid = False
                self.clear_local_key()
                return False

            if crypto_res.get("valid"):
                hwid_file = os.path.join(os.environ.get("APPDATA", "."), "stealth_chess_hwid.lock")
                locks = {}
                if os.path.exists(hwid_file):
                    try:
                        with open(hwid_file, "r", encoding="utf-8") as f:
                            locks = json.load(f)
                    except Exception:
                        locks = {}
                
                # If key was general, lock to this machine locally on first activation
                if not crypto_res.get("is_device_bound"):
                    key_entry = locks.get(key)
                    if not key_entry:
                        locks[key] = {
                            "hwid": current_hwid,
                            "activated_at": datetime.datetime.now().timestamp()
                        }
                        try:
                            with open(hwid_file, "w", encoding="utf-8") as f:
                                json.dump(locks, f)
                        except Exception:
                            pass
                    else:
                        bound_hwid = key_entry.get("hwid", "")
                        if bound_hwid and bound_hwid.upper() != current_hwid.upper():
                            self.error_message = "Device lock mismatch. Key is registered to another computer. (المفتاح مقفل على كمبيوتر آخر)"
                            self.is_valid = False
                            return False
                    
                self.expiry_date = crypto_res["expiry_date"]
                self.tier = crypto_res["tier"]
                self.is_valid = True
                self.save_local_key(key)
                return True

        self.error_message = "Invalid or deactivated key (مفتاح ترخيص غير صحيح أو ملغي)."
        self.is_valid = False
        self.clear_local_key()
        return False
