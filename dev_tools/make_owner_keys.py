"""
OWNER-ONLY tool — generates the Ed25519 signing key pair ONCE.

Run this on YOUR private PC:
    python dev_tools/make_owner_keys.py

What it does:
  1. Creates  stealth_owner_key.pem   (PRIVATE — NEVER commit, NEVER share)
  2. Creates  stealth_owner_pub.hex   (PUBLIC backup)
  3. Automatically injects the public key into:
        - license_core.py       (Windows client verification)
        - mobile_app/www/license_core.js  (mobile client verification)
     so every build ships ONLY the public half.

If you lose stealth_owner_key.pem you can never issue new keys again.
Back it up offline (USB / encrypted drive).
"""

import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives import serialization

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PRIV_PATH = os.path.join(ROOT, "stealth_owner_key.pem")
PUB_PATH = os.path.join(ROOT, "stealth_owner_pub.hex")


def main():
    if os.path.exists(PRIV_PATH):
        print("[!] Private key already exists:", PRIV_PATH)
        print("    Reusing it (regenerating would invalidate all previously issued keys).")
        with open(PRIV_PATH, "rb") as f:
            private_key = serialization.load_pem_private_key(f.read(), password=None)
    else:
        private_key = Ed25519PrivateKey.generate()
        pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        )
        with open(PRIV_PATH, "wb") as f:
            f.write(pem)
        os.chmod(PRIV_PATH, 0o600)
        print("[+] Created PRIVATE key:", PRIV_PATH)
        print("    >>> BACK THIS FILE UP OFFLINE. It must NEVER be uploaded anywhere. <<<")

    pub_hex = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw,
    ).hex()

    with open(PUB_PATH, "w") as f:
        f.write(pub_hex)
    print("[+] Public key (safe to ship in clients):", pub_hex)

    # --- Inject into Python client module ---
    lc = os.path.join(ROOT, "license_core.py")
    src = open(lc, encoding="utf-8").read()
    src = re.sub(
        r'PUBLIC_KEY_B64 = "[^"]*"',
        f'PUBLIC_KEY_B64 = "{pub_hex}"',
        src, count=1,
    )
    open(lc, "w", encoding="utf-8").write(src)
    print("[+] Installed public key into license_core.py")

    # --- Inject into JS client module ---
    js = os.path.join(ROOT, "mobile_app", "www", "license_core.js")
    if os.path.exists(js):
        src = open(js, encoding="utf-8").read()
        src = re.sub(r'const PUBLIC_KEY_HEX = "[^"]*"', f'const PUBLIC_KEY_HEX = "{pub_hex}"', src, count=1)
        open(js, "w", encoding="utf-8").write(src)
        print("[+] Installed public key into mobile_app/www/license_core.js")

    print("\nDone. Next steps:")
    print("  1. Deploy server/worker.js to Cloudflare Workers and note your ADMIN_TOKEN.")
    print("  2. Run:  python dev_tools/key_generator.py   (one-click control panel CLI)")
    print("     or open owner_panel/index.html for the graphical panel.")


if __name__ == "__main__":
    main()
