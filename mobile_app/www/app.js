// Stealth Chess Assistant - Mobile Controller Logic

// Configuration & Default State
const Config = {
    LICENSE_API_URL: "https://gist.githubusercontent.com/computerengineer1/c6b0466a666549755c0c149fbff7dbdd/raw/db.txt",
    SECRET_KEY: "STEALTH_CHESS_SECURE_V4_KEY_2026_PRO",
    STOCKFISH_URL: "stockfish-18-lite-single.js"
};

// Generate or retrieve a persistent unique Device ID for this phone
function getDeviceId() {
    let deviceId = localStorage.getItem("device_id");
    if (!deviceId) {
        // Generate a random UUID-style device fingerprint
        deviceId = 'MOB-' + 'xxxx-xxxx-xxxx'.replace(/x/g, () => {
            return Math.floor(Math.random() * 16).toString(16).toUpperCase();
        });
        localStorage.setItem("device_id", deviceId);
    }
    return deviceId;
}

let appState = {
    licenseKey: "",
    isValidLicense: false,
    expiryDate: "N/A",
    tier: "N/A",
    
    // Engine Config
    gameMode: "blitz",
    engineDepth: 10,
    engineSkill: 15,
    randomizeMoves: true,
    engineThreads: 2,
    showArrows: true,
    showHud: true,
    soundEnabled: true,
    stealthScreen: true,
    fullscreenMode: true,
    
    // Active Assistant State
    isBotRunning: false
};

// Chess turn tracking
let isWhiteTurn = true;
let lastMatrix = null;
let lastFen = "";
let pendingMoves = null;
let showMovesTimeout = null;

// Stockfish Web Worker instance
let stockfishWorker = null;
let isStockfishReady = false;
let currentSearchCallback = null;

// InAppBrowser Reference
let chessWebView = null;

// Initialize app when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    loadSettings();
    initUI();
    checkStoredLicense();

    // Display Device ID on activation screen
    const deviceIdBox = document.getElementById("device-id-display");
    if (deviceIdBox) {
        const myDeviceId = getDeviceId();
        deviceIdBox.textContent = myDeviceId;
        const copyDeviceHandler = () => {
            const doFeedback = () => {
                deviceIdBox.style.borderColor = "#00ff88";
                deviceIdBox.textContent = "✅ Copied! / تم النسخ";
                setTimeout(() => {
                    deviceIdBox.textContent = myDeviceId;
                    deviceIdBox.style.borderColor = "rgba(255,165,0,0.4)";
                }, 1600);
            };
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(myDeviceId).then(doFeedback).catch(() => {
                    const ta = document.createElement("textarea");
                    ta.value = myDeviceId;
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand("copy");
                    document.body.removeChild(ta);
                    doFeedback();
                });
            } else {
                const ta = document.createElement("textarea");
                ta.value = myDeviceId;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand("copy");
                document.body.removeChild(ta);
                doFeedback();
            }
        };
        deviceIdBox.addEventListener("click", copyDeviceHandler);
        deviceIdBox.addEventListener("touchend", copyDeviceHandler);
    }

    // Beautiful Splash Screen transition logic (fade out after 2.2s)
    setTimeout(() => {
        const splash = document.getElementById("splash-screen");
        if (splash) {
            splash.classList.add("fade-out");
            setTimeout(() => splash.remove(), 600); // Clean up DOM after transition
        }
    }, 2200);
});

// Load Settings from LocalStorage
function loadSettings() {
    appState.licenseKey = localStorage.getItem("license_key") || "";
    appState.gameMode = localStorage.getItem("game_mode") || "blitz";
    appState.engineDepth = parseInt(localStorage.getItem("engine_depth")) || 10;
    appState.engineSkill = parseInt(localStorage.getItem("engine_skill")) || 15;
    appState.randomizeMoves = localStorage.getItem("randomize_moves") !== "false";
    appState.engineThreads = parseInt(localStorage.getItem("engine_threads")) || 2;
    appState.showArrows = localStorage.getItem("show_arrows") !== "false";
    appState.showHud = localStorage.getItem("show_hud") !== "false";
    appState.soundEnabled = localStorage.getItem("sound_enabled") !== "false";
    appState.stealthScreen = localStorage.getItem("stealth_screen") !== "false";
    appState.fullscreenMode = localStorage.getItem("fullscreen_mode") !== "false";
}

// Save Settings to LocalStorage
function saveSettings() {
    localStorage.setItem("game_mode", appState.gameMode);
    localStorage.setItem("engine_depth", appState.engineDepth);
    localStorage.setItem("engine_skill", appState.engineSkill);
    localStorage.setItem("randomize_moves", appState.randomizeMoves);
    localStorage.setItem("engine_threads", appState.engineThreads);
    localStorage.setItem("show_arrows", appState.showArrows);
    localStorage.setItem("show_hud", appState.showHud);
    localStorage.setItem("sound_enabled", appState.soundEnabled);
    localStorage.setItem("stealth_screen", appState.stealthScreen);
    localStorage.setItem("fullscreen_mode", appState.fullscreenMode);
}

// XOR Encryption/Decryption matching python implementation
function xorEncryptDecrypt(data, key) {
    const keyLen = key.length;
    let output = [];
    for (let i = 0; i < data.length; i++) {
        const charCode = data.charCodeAt(i) ^ key.charCodeAt(i % keyLen);
        output.push(String.fromCharCode(charCode));
    }
    return output.join("");
}

function sanitizeKey(rawKey) {
    if (!rawKey) return "";
    let k = rawKey.trim().toUpperCase().replace(/\s+/g, '');
    const parts = k.split('-');
    if (parts.length === 4) {
        const prefix = parts[0];
        const cleanParts = [prefix];
        for (let i = 1; i < 4; i++) {
            // In the hex segments, automatically convert common human typos:
            // 'O' (letter) -> '0' (digit zero)
            // 'I' or 'L' (letters) -> '1' (digit one)
            let seg = parts[i]
                .replace(/O/g, '0')
                .replace(/[IL]/g, '1');
            cleanParts.push(seg);
        }
        return cleanParts.join('-');
    }
    return k;
}

function computeChecksum(prefix, expd, nonc, secret) {
    const comb = `${prefix.toUpperCase()}-${expd.toUpperCase()}-${nonc.toUpperCase()}:${secret}`;
    let h = 0;
    for (let i = 0; i < comb.length; i++) {
        h = (Math.imul(h, 31) + comb.charCodeAt(i)) >>> 0;
    }
    return ("0000" + (h & 0xFFFF).toString(16).toUpperCase()).slice(-4);
}

// Parse expiration from 4-character hex epoch days
function parseExpiryFromHex(expd) {
    try {
        const epochDays = parseInt(expd, 16);
        if (isNaN(epochDays)) return null;
        // End of the target day (23:59:59.999 UTC)
        const expiryDate = new Date((epochDays + 1) * 86400000 - 1);
        const y = expiryDate.getUTCFullYear();
        const m = String(expiryDate.getUTCMonth() + 1).padStart(2, '0');
        const d = String(expiryDate.getUTCDate()).padStart(2, '0');
        return {
            timestamp: expiryDate.getTime(),
            dateStr: `${y}-${m}-${d}`
        };
    } catch(e) {
        return null;
    }
}

// Cryptographic Key Verification & Auto-Lock Helper (Supports hardware-bound keys and embedded expiry)
function verifyCryptographicKey(rawKey, secret) {
    const key = sanitizeKey(rawKey);
    if (!key) return null;
    const parts = key.split('-');
    if (parts.length !== 4) return null;
    const [prefix, expd, nonc, checksum] = parts.map(p => p.trim().toUpperCase());
    if (!["MON", "TRM", "LFT", "TRL"].includes(prefix)) return null;
    if (expd.length !== 4 || nonc.length !== 4 || checksum.length !== 4) return null;
    
    // Check 1: Key cryptographically bound to this phone's Device ID
    const currentDeviceId = getDeviceId();
    const cleanDevId = currentDeviceId.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const boundSecret = secret + "_" + cleanDevId;
    
    let isDeviceBound = false;
    let expectedChecksum = computeChecksum(prefix, expd, nonc, boundSecret);
    
    if (checksum === expectedChecksum) {
        isDeviceBound = true;
    } else {
        // Check 2: General promo / trial key
        expectedChecksum = computeChecksum(prefix, expd, nonc, secret);
        if (checksum !== expectedChecksum) return null; // Invalid signature
    }

    // Check 2: Embedded cryptographic expiration check
    const expiryInfo = parseExpiryFromHex(expd);
    if (!expiryInfo) return null;

    const now = Date.now();
    const isExpired = now > expiryInfo.timestamp;

    let tierStr = "Monthly";
    if (prefix === "TRM") { tierStr = "3 Months"; }
    else if (prefix === "LFT") { tierStr = "Lifetime"; }
    else if (prefix === "TRL") { tierStr = "Trial"; }

    return { 
        valid: !isExpired, 
        isExpired: isExpired, 
        tier: tierStr, 
        expiryDate: expiryInfo.dateStr, 
        isDeviceBound: isDeviceBound, 
        key: key 
    };
}

// Verify Subscription License Key
async function verifyLicense(rawKey, forceSave = true) {
    const key = sanitizeKey(rawKey);
    if (!key) {
        return { success: false, message: "Key cannot be empty (المفتاح مطلوب)" };
    }

    // --- 1. Primary: Remote Database Verification & Strict Device ID Lock ---
    try {
        const response = await fetch(Config.LICENSE_API_URL, { cache: "no-store" });
        if (response.ok) {
            const payload = await response.text();
            const decodedBytes = atob(payload.trim());
            let db = null;
            for (const testSecret of [Config.SECRET_KEY, "STEALTH_CHESS_SECRET_KEY_2026"]) {
                try {
                    const decryptedJson = xorEncryptDecrypt(decodedBytes, testSecret);
                    const candidate = JSON.parse(decryptedJson);
                    if (candidate && candidate.keys) {
                        db = candidate;
                        break;
                    }
                } catch (err) {}
            }
            const keysDict = (db && db.keys) ? db.keys : {};
            // If the key is specifically listed in the remote Gist database:
            if (keysDict && (key in keysDict)) {
                const keyInfo = keysDict[key];
                const expiryStr = keyInfo.expiry || "2026-05-22";
                const tierStr = keyInfo.tier || "Active";
                const allowedMobileHwid = keyInfo.mobile_hwid || "";

                // --- Strict Mobile Device ID Lock Check ---
                const currentDeviceId = getDeviceId();
                if (allowedMobileHwid && allowedMobileHwid.trim() !== "") {
                    if (allowedMobileHwid.trim().toUpperCase() !== currentDeviceId.toUpperCase()) {
                        return { 
                            success: false, 
                            message: "Device lock mismatch. Key is registered to another phone. (هذا المفتاح مقفل على جهاز آخر ولا يمكن استخدامه)" 
                        };
                    }
                } else {
                    const lockStorageKey = "device_lock_" + key;
                    let lockedDevice = localStorage.getItem(lockStorageKey);
                    if (!lockedDevice) {
                        localStorage.setItem(lockStorageKey, currentDeviceId);
                    } else if (lockedDevice.toUpperCase() !== currentDeviceId.toUpperCase()) {
                        return { 
                            success: false, 
                            message: "Device lock mismatch. Key is registered to another phone. (هذا المفتاح مقفل على جهاز آخر)" 
                        };
                    }
                }
                
                const expiryDate = new Date(expiryStr);
                const currentDate = new Date();
                expiryDate.setHours(23,59,59,999);

                if (currentDate > expiryDate) {
                    return { success: false, message: `Subscription expired on ${expiryStr} (انتهى الاشتراك)` };
                }

                appState.isValidLicense = true;
                appState.tier = tierStr;
                appState.expiryDate = expiryStr;
                appState.licenseKey = key;
                
                if (forceSave) localStorage.setItem("license_key", key);
                return { success: true };
            }
            // If key is not in remote Gist DB, fall through to cryptographic verification
        }
    } catch (e) {
        console.warn("Remote license verification network issue, falling back to local lock check:", e);
    }

    // --- 2. Fallback: Local & Device-Locked Cryptographic Verification with Embedded Expiry ---
    const cryptoResult = verifyCryptographicKey(key, Config.SECRET_KEY);
    if (cryptoResult) {
        if (cryptoResult.isExpired) {
            return { 
                success: false, 
                message: `Subscription expired on ${cryptoResult.expiryDate} (انتهت صلاحية المفتاح)` 
            };
        }

        // Anti-tamper clock check
        const lastSeen = parseInt(localStorage.getItem("last_seen_epoch")) || 0;
        if (Date.now() < lastSeen - (2 * 3600 * 1000)) {
            return {
                success: false,
                message: "Device clock error detected. Please correct your system time. (تم اكتشاف خطأ في توقيت الجهاز)"
            };
        }
        localStorage.setItem("last_seen_epoch", Date.now().toString());

        const currentDeviceId = getDeviceId();
        const lockStorageKey = "device_lock_" + key;

        // If key is not pre-bound, bind it to this device locally on first use
        if (!cryptoResult.isDeviceBound) {
            let lockedDevice = localStorage.getItem(lockStorageKey);
            if (!lockedDevice) {
                localStorage.setItem(lockStorageKey, currentDeviceId);
            } else if (lockedDevice.toUpperCase() !== currentDeviceId.toUpperCase()) {
                return { 
                    success: false, 
                    message: "Device lock mismatch. Key is registered to another phone. (هذا المفتاح مقفل على جهاز آخر ولا يمكن استخدامه)" 
                };
            }
        }

        appState.isValidLicense = true;
        appState.tier = cryptoResult.tier;
        appState.expiryDate = cryptoResult.expiryDate;
        appState.licenseKey = key;

        if (forceSave) localStorage.setItem("license_key", key);
        return { success: true };
    }

    return { success: false, message: "Invalid or deactivated license key (مفتاح ترخيص غير صحيح أو ملغي)" };
}

// Lock dashboard and return to activation screen
function lockDashboard() {
    const dashView = document.getElementById("dashboard-view");
    const actView = document.getElementById("activation-view");
    if (dashView) dashView.classList.add("hidden");
    if (actView) actView.classList.remove("hidden");
    if (appState.isBotRunning) {
        stopBot();
    }
}

// Auto check stored key on startup
async function checkStoredLicense() {
    if (appState.licenseKey) {
        showStatus("Verifying subscription... (جاري التحقق من الترخيص)", "info");
        const res = await verifyLicense(appState.licenseKey, false);
        if (res.success) {
            unlockDashboard();
        } else {
            showStatus(res.message || "License deactivated. Please enter a valid key.", "error");
            localStorage.removeItem("license_key");
            // Clear all old activation locks
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const k = localStorage.key(i);
                if (k && (k.startsWith("device_lock_") || k.startsWith("date_activated_"))) {
                    localStorage.removeItem(k);
                }
            }
            appState.licenseKey = "";
            appState.isValidLicense = false;
            lockDashboard();
        }
    }
}

// UI Elements & State Binding
function initUI() {
    // 1. Activation View Elements
    const keyInput = document.getElementById("license-key-input");
    const activateBtn = document.getElementById("activate-btn");
    
    if (appState.licenseKey) {
        keyInput.value = appState.licenseKey;
    }

    activateBtn.addEventListener("click", async () => {
        AppSoundFx.playClick();
        const key = keyInput.value.trim();
        activateBtn.disabled = true;
        activateBtn.style.opacity = '0.6';
        showStatus("Checking license database... (جاري التحقق)", "info");
        
        const res = await verifyLicense(key);
        if (res.success) {
            AppSoundFx.playSuccess();
            showStatus("✅ License Validated! Unlocking... (تم التفعيل بنجاح!)", "success");
            // Haptic vibration feedback (if available)
            if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
            setTimeout(() => {
                unlockDashboard();
                activateBtn.disabled = false;
                activateBtn.style.opacity = '1';
            }, 1200);
        } else {
            AppSoundFx.playError();
            showStatus(res.message, "error");
            if (navigator.vibrate) navigator.vibrate(100);
            activateBtn.disabled = false;
            activateBtn.style.opacity = '1';
        }
    });

    // 2. Change Key / Logout
    document.getElementById("change-key-btn").addEventListener("click", () => {
        localStorage.removeItem("license_key");
        appState.licenseKey = "";
        appState.isValidLicense = false;
        
        document.getElementById("dashboard-view").classList.add("hidden");
        document.getElementById("activation-view").classList.remove("hidden");
        showStatus("Please enter your activation key.", "info");
    });

    // 3. Settings controls in Dashboard
    const selectMode = document.getElementById("select-game-mode");
    selectMode.value = appState.gameMode;
    selectMode.addEventListener("change", (e) => {
        appState.gameMode = e.target.value;
        saveSettings();
    });

    const sliderDepth = document.getElementById("slider-depth");
    const valDepth = document.getElementById("val-depth");
    sliderDepth.value = appState.engineDepth;
    valDepth.textContent = appState.engineDepth;
    sliderDepth.addEventListener("input", (e) => {
        appState.engineDepth = parseInt(e.target.value);
        valDepth.textContent = appState.engineDepth;
        saveSettings();
        if (isStockfishReady) configureStockfish();
    });

    const sliderSkill = document.getElementById("slider-skill");
    const valSkill = document.getElementById("val-skill");
    sliderSkill.value = appState.engineSkill;
    valSkill.textContent = appState.engineSkill;
    sliderSkill.addEventListener("input", (e) => {
        appState.engineSkill = parseInt(e.target.value);
        valSkill.textContent = appState.engineSkill;
        updateEloDisplay();
        saveSettings();
        if (isStockfishReady) configureStockfish();
    });
    updateEloDisplay();

    const chkAntiban = document.getElementById("chk-antiban");
    chkAntiban.checked = appState.randomizeMoves;
    chkAntiban.addEventListener("change", (e) => {
        appState.randomizeMoves = e.target.checked;
        saveSettings();
    });

    const chkShowArrows = document.getElementById("chk-show-arrows");
    chkShowArrows.checked = appState.showArrows;
    chkShowArrows.addEventListener("change", (e) => {
        appState.showArrows = e.target.checked;
        saveSettings();
    });

    const chkShowHud = document.getElementById("chk-show-hud");
    chkShowHud.checked = appState.showHud;
    chkShowHud.addEventListener("change", (e) => {
        appState.showHud = e.target.checked;
        saveSettings();
    });

    const chkSound = document.getElementById("chk-sound");
    if (chkSound) {
        chkSound.checked = appState.soundEnabled;
        chkSound.addEventListener("change", (e) => {
            appState.soundEnabled = e.target.checked;
            saveSettings();
        });
    }

    const chkFullscreen = document.getElementById("chk-fullscreen");
    chkFullscreen.checked = appState.fullscreenMode;
    chkFullscreen.addEventListener("change", (e) => {
        appState.fullscreenMode = e.target.checked;
        saveSettings();
    });

    const chkStealthScreen = document.getElementById("chk-stealth-screen");
    chkStealthScreen.checked = appState.stealthScreen;
    chkStealthScreen.addEventListener("change", (e) => {
        appState.stealthScreen = e.target.checked;
        saveSettings();
    });

    const inputThreads = document.getElementById("input-threads");
    inputThreads.value = appState.engineThreads;
    
    document.getElementById("btn-spin-down").addEventListener("click", () => {
        let val = parseInt(inputThreads.value);
        if (val > 1) {
            val--;
            inputThreads.value = val;
            appState.engineThreads = val;
            saveSettings();
            if (isStockfishReady) configureStockfish();
        }
    });
    document.getElementById("btn-spin-up").addEventListener("click", () => {
        let val = parseInt(inputThreads.value);
        if (val < 16) {
            val++;
            inputThreads.value = val;
            appState.engineThreads = val;
            saveSettings();
            if (isStockfishReady) configureStockfish();
        }
    });

    // 4. Start Assistant Button
    const startBtn = document.getElementById("start-bot-btn");
    startBtn.addEventListener("click", () => {
        if (!appState.isBotRunning) {
            AppSoundFx.playStart();
            if (navigator.vibrate) navigator.vibrate([30, 20, 30]);
            startBtn.classList.add('running');
            startBtn.querySelector('span').textContent = '🟢 Assistant Running...';
            startBtn.querySelector('.btn-ar').textContent = 'المساعد يعمل الآن...';
            startBot();
        }
    });
}

const SkillToElo = {
    1: 800, 2: 900, 3: 1000, 4: 1100, 5: 1200,
    6: 1300, 7: 1400, 8: 1500, 9: 1600, 10: 1700,
    11: 1850, 12: 2000, 13: 2150, 14: 2300, 15: 2450,
    16: 2600, 17: 2750, 18: 2900, 19: 3050, 20: 3200
};

function updateEloDisplay() {
    const elo = SkillToElo[appState.engineSkill] || 2000;
    document.getElementById("val-elo").textContent = `~${elo} ELO`;
}

// Web Audio API sound effects for the main app UI
const AppSoundFx = {
    ctx: null,
    init() {
        try {
            if (!this.ctx) {
                const AC = window.AudioContext || window.webkitAudioContext;
                if (AC) this.ctx = new AC();
            }
            if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
        } catch(e) {}
    },
    playSuccess() {
        try {
            this.init(); if (!this.ctx) return;
            const now = this.ctx.currentTime;
            [523.25, 659.25, 783.99].forEach((freq, i) => {
                const t = now + i * 0.08;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.connect(gain); gain.connect(this.ctx.destination);
                osc.type = 'sine'; osc.frequency.setValueAtTime(freq, t);
                gain.gain.setValueAtTime(0.2, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
                osc.start(t); osc.stop(t + 0.2);
            });
        } catch(e) {}
    },
    playError() {
        try {
            this.init(); if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(110, now + 0.15);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            osc.start(now); osc.stop(now + 0.15);
        } catch(e) {}
    },
    playClick() {
        try {
            this.init(); if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.type = 'triangle'; osc.frequency.setValueAtTime(600, now);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
            osc.start(now); osc.stop(now + 0.04);
        } catch(e) {}
    },
    playStart() {
        try {
            this.init(); if (!this.ctx) return;
            const now = this.ctx.currentTime;
            [392, 523.25, 659.25, 783.99].forEach((freq, i) => {
                const t = now + i * 0.06;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.connect(gain); gain.connect(this.ctx.destination);
                osc.type = 'sine'; osc.frequency.setValueAtTime(freq, t);
                gain.gain.setValueAtTime(0.18, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
                osc.start(t); osc.stop(t + 0.25);
            });
        } catch(e) {}
    }
};

function showStatus(msg, type) {
    const el = document.getElementById("activation-status");
    el.textContent = msg;
    el.className = "status-msg";
    if (type === "success") {
        el.style.color = "var(--success-green)";
        const formCard = el.closest('.form-card');
        if (formCard) { formCard.classList.remove('success-bounce'); void formCard.offsetWidth; formCard.classList.add('success-bounce'); }
    } else if (type === "info") {
        el.style.color = "var(--text-muted)";
    } else {
        el.style.color = "var(--danger-red)";
        const formCard = el.closest('.form-card');
        if (formCard) { formCard.classList.remove('shake-error'); void formCard.offsetWidth; formCard.classList.add('shake-error'); }
    }
}

function addLiveLog(msg, type = "info") {
    const consoleEl = document.getElementById("live-logs-console");
    if (!consoleEl) return;
    
    const div = document.createElement("div");
    let color = "#a0aec0"; // default gray
    if (type === "success") color = "#48bb78"; // green
    else if (type === "error") color = "#f56565"; // red
    else if (type === "warning") color = "#ed8936"; // orange
    else if (type === "engine") color = "#38b2ac"; // teal
    
    div.style.color = color;
    const timeStr = new Date().toTimeString().split(' ')[0];
    div.textContent = `[${timeStr}] ${msg}`;
    consoleEl.appendChild(div);
    consoleEl.scrollTop = consoleEl.scrollHeight;
}

function unlockDashboard() {
    document.getElementById("lbl-license-status").textContent = `🟢 Subscription Active (${appState.tier.toUpperCase()})`;
    document.getElementById("lbl-expiry").textContent = `Expiration: ${appState.expiryDate}`;
    
    document.getElementById("activation-view").classList.add("hidden");
    document.getElementById("dashboard-view").classList.remove("hidden");
    
    // Initialize Stockfish WASM in background
    initStockfish();
}

// Initialize Stockfish WASM Web Worker
function initStockfish() {
    if (stockfishWorker) return;
    
    console.log("Initializing Stockfish Web Worker...");
    addLiveLog("Initializing Stockfish worker...", "info");

    function createWorker(useBlob) {
        try {
            if (useBlob) {
                addLiveLog("Attempting Blob worker creation fallback...", "warning");
                const absoluteJsUrl = new URL(Config.STOCKFISH_URL, window.location.href).href;
                const absoluteWasmUrl = new URL(Config.STOCKFISH_URL.replace(".js", ".wasm"), window.location.href).href;
                const workerBlobCode = `
                    self.Module = {
                        locateFile: function(path) {
                            if (path.endsWith('.wasm')) {
                                return "${absoluteWasmUrl}";
                            }
                            return path;
                        }
                    };
                    importScripts("${absoluteJsUrl}");
                `;
                const blob = new Blob([workerBlobCode], { type: "application/javascript" });
                stockfishWorker = new Worker(URL.createObjectURL(blob));
            } else {
                stockfishWorker = new Worker(Config.STOCKFISH_URL);
                addLiveLog("Stockfish worker created directly.", "success");
            }
            
            stockfishWorker.onmessage = (event) => {
                const line = event.data;
                if (typeof line !== 'string') return;
                // Suppress verbose output to keep console clean, but parse evaluations
                if (line.includes("info depth") && line.includes(" pv ")) {
                    parseSearchInfo(line);
                } else if (line.startsWith("bestmove")) {
                    isSearching = false;
                    if (pendingSearch) {
                        const next = pendingSearch;
                        pendingSearch = null;
                        setTimeout(() => {
                            triggerSearch(next.fen, next.isWhiteBottom, next.timeLeft);
                        }, 10);
                    } else if (currentSearchCallback) {
                        currentSearchCallback();
                    }
                } else if (line === "readyok" || line.includes("uciok")) {
                    isStockfishReady = true;
                    console.log("Stockfish is ready to calculate moves.");
                    addLiveLog("Stockfish ready to calculate.", "success");
                }
            };

            stockfishWorker.onerror = (err) => {
                console.error("Stockfish Worker Error:", err);
                addLiveLog("Stockfish worker error: " + (err.message || "Load failed"), "error");
                
                // If direct worker failed asynchronously on startup, try Blob worker fallback once!
                if (!useBlob && !isStockfishReady) {
                    addLiveLog("Direct worker failed. Switching to Blob fallback...", "warning");
                    stockfishWorker.terminate();
                    stockfishWorker = null;
                    createWorker(true);
                }
            };

            // Initialize UCI communication
            stockfishWorker.postMessage("uci");
            configureStockfish();
            stockfishWorker.postMessage("isready");

        } catch (e) {
            console.error("Worker creation exception:", e);
            addLiveLog("Worker creation failed: " + e.message, "error");
            if (!useBlob) {
                createWorker(true);
            } else {
                // Final fallback: mark as ready so user can at least open the browser
                isStockfishReady = true;
            }
        }
    }

    // Start by trying direct worker creation
    createWorker(false);

    // Fallback: If Stockfish doesn't respond within 5 seconds,
    // force-mark it as ready so the user isn't stuck forever.
    setTimeout(() => {
        if (!isStockfishReady && stockfishWorker) {
            console.warn("Stockfish readyok not received in time. Forcing ready state.");
            isStockfishReady = true;
            addLiveLog("Stockfish readyok timeout. Forced ready.", "warning");
        }
    }, 5000);
}

// Update settings inside Stockfish engine
function configureStockfish() {
    if (!stockfishWorker) return;
    // Note: Since we are using the single-threaded WebAssembly build of Stockfish 18
    // (stockfish-18-lite-single.js), configuring Threads > 1 will cause low-level memory
    // and thread desync crashes (Unreachable code should not be executed / Out of bounds call_indirect).
    // Force Threads to 1 to guarantee absolute stability.
    stockfishWorker.postMessage(`setoption name Threads value 1`);
    stockfishWorker.postMessage(`setoption name Hash value 64`);
    stockfishWorker.postMessage(`setoption name Skill Level value ${appState.engineSkill}`);
    stockfishWorker.postMessage(`setoption name MultiPV value 3`);
}

// Candidate moves variables
let parsedMoves = [];

function parseSearchInfo(line) {
    const parts = line.split(" ");
    try {
        const pvIdx = parts.indexOf("pv");
        if (pvIdx === -1) return;
        
        const move = parts[pvIdx + 1];
        
        let scoreStr = "0.00";
        if (parts.includes("cp")) {
            const cpIdx = parts.indexOf("cp");
            scoreStr = (parseInt(parts[cpIdx + 1]) / 100).toFixed(2);
        } else if (parts.includes("mate")) {
            const mateIdx = parts.indexOf("mate");
            scoreStr = "M" + parts[mateIdx + 1];
        }

        if (parts.includes("multipv")) {
            const mpvIdx = parts.indexOf("multipv");
            const rank = parseInt(parts[mpvIdx + 1]) - 1;
            
            // Populate/update the moves array
            parsedMoves[rank] = { move, score: scoreStr };
        }
    } catch (e) {
        console.error("Error parsing search info:", e);
    }
}

// Convert Board Matrix to standard FEN
function translateMatrixToFen(matrix) {
    let fenRows = [];
    for (let r = 0; r < 8; r++) {
        let emptyCount = 0;
        let fenRow = "";
        for (let c = 0; c < 8; c++) {
            let sq = matrix[r][c];
            if (sq === "") {
                emptyCount++;
            } else {
                if (emptyCount > 0) {
                    fenRow += emptyCount;
                    emptyCount = 0;
                }
                fenRow += sq;
            }
        }
        if (emptyCount > 0) {
            fenRow += emptyCount;
        }
        fenRows.push(fenRow);
    }
    const activeColor = isWhiteTurn ? "w" : "b";
    return fenRows.join("/") + ` ${activeColor} - - 0 1`;
}

// Update Turn Direction based on move changes
function updateTurnDirection(matrix) {
    if (!lastMatrix) {
        lastMatrix = matrix;
        return;
    }

    let newWhite = false;
    let newBlack = false;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const oldSq = lastMatrix[r][c];
            const newSq = matrix[r][c];
            if (oldSq !== newSq) {
                if (newSq !== "") {
                    if (newSq === newSq.toUpperCase()) {
                        newWhite = true;
                    } else {
                        newBlack = true;
                    }
                }
            }
        }
    }

    if (newWhite) {
        isWhiteTurn = false;
    } else if (newBlack) {
        isWhiteTurn = true;
    }

    lastMatrix = matrix;
}

// Anti-Ban humanization scrambling
function humanizeMoves(moves) {
    if (!appState.randomizeMoves || moves.length < 2) return moves;

    try {
        const move1 = moves[0];
        const move2 = moves[1];
        
        // Do not randomize mate threats
        if (move1.score.includes("M") || move2.score.includes("M")) {
            return moves;
        }

        const score1 = parseFloat(move1.score);
        const score2 = parseFloat(move2.score);
        
        // If 2nd option is decent (within 1.5 pawns value)
        if (Math.abs(score1 - score2) < 1.50) {
            const rand = Math.random();
            if (rand < 0.40) {
                // Swap 1st and 2nd best move
                moves[0] = move2;
                moves[1] = move1;
            } else if (rand < 0.60 && moves.length >= 3) {
                const move3 = moves[2];
                if (!move3.score.includes("M")) {
                    const score3 = parseFloat(move3.score);
                    if (Math.abs(score1 - score3) < 2.0) {
                        // Swap 1st and 3rd best move
                        moves[0] = move3;
                        moves[2] = move1;
                    }
                }
            }
        }
    } catch(e) {}
    
    return moves;
}

// Log-normal random variable (Box-Muller transform)
function lognormvariate(mu, sigma) {
    let u1 = Math.random();
    let u2 = Math.random();
    // Avoid log(0)
    if (u1 < 1e-10) u1 = 1e-10;
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return Math.exp(mu + sigma * z);
}

// Calculate thinking delay based on board evaluation and remaining time
function calculateDelay(moves, timeLeft) {
    if (moves.length === 0) return 0.5;

    let baseDelay = 0.5;
    const bestMove = moves[0];
    
    if (bestMove.score.includes("M")) {
        // Forced mate: think lognormally around 1.8s
        baseDelay = lognormvariate(0.5, 0.3);
    } else if (moves.length >= 2) {
        try {
            const score1 = parseFloat(moves[0].score);
            const score2 = parseFloat(moves[1].score);
            const diff = Math.abs(score1 - score2);
            
            if (diff > 3.0) {
                // Very obvious move (recapture, check capture)
                baseDelay = lognormvariate(-0.4, 0.25);
            } else if (diff < 0.5) {
                // Highly complex position (multiple good choices)
                baseDelay = lognormvariate(1.5, 0.45);
            } else {
                // Standard chess position
                baseDelay = lognormvariate(0.8, 0.35);
            }
        } catch (e) {
            baseDelay = lognormvariate(0.8, 0.35);
        }
    }

    // Adjust delay multiplier based on Game Mode
    let multiplier = 1.0;
    if (appState.gameMode === "bullet") {
        multiplier = 0.25;
    } else if (appState.gameMode === "blitz") {
        multiplier = 0.55;
    }

    // Time Panic multipliers
    if (timeLeft <= 15.0) {
        multiplier = 0.0; // Instantly display arrows
    } else if (timeLeft <= 30.0) {
        multiplier *= 0.15;
    } else if (timeLeft <= 60.0) {
        multiplier *= 0.40;
    } else if (timeLeft <= 120.0) {
        multiplier *= 0.70;
    }

    return baseDelay * multiplier;
}

// Start Chess Assistant & Load Webview
function startBot() {
    if (!isStockfishReady) {
        alert("Stockfish engine is still loading. Please wait! (المحرك جاري التحميل)");
        return;
    }

    appState.isBotRunning = true;
    addLiveLog("Starting study mode...", "info");
    
    const startBtn = document.getElementById("start-bot-btn");
    startBtn.textContent = "Study Mode Open (وضع الدراسة)";
    startBtn.style.background = "linear-gradient(135deg, #1b380d, #275915)";
    startBtn.style.borderColor = "var(--success-green)";
    
    // Check if Cordova is available
    if (typeof cordova === 'undefined' || !cordova.InAppBrowser) {
        console.warn("Cordova InAppBrowser plugin not found. Mocking WebView for desktop testing.");
        addLiveLog("Cordova InAppBrowser not found. Running desktop simulation mock.", "warning");
        mockWebViewDesktop();
        return;
    }

    // Open Chess.com inside customizable in-app browser overlay
    addLiveLog("Opening Chess.com analysis board...", "info");
    
    // Build InAppBrowser options based on fullscreen preference
    let browserOptions = "location=no,hidden=no,clearcache=no,clearsessioncache=no";
    if (appState.fullscreenMode) {
        browserOptions += ",toolbar=no,fullscreen=yes";
        addLiveLog("Fullscreen mode enabled. Triple-tap to toggle UI.", "info");
    } else {
        browserOptions += ",toolbar=yes,closebuttoncaption=Close,toolbarcolor=#08080a,navigationbuttoncolor=#ff3333,closebuttoncolor=#ff3333";
    }
    
    chessWebView = cordova.InAppBrowser.open(
        "https://www.chess.com/analysis", 
        "_blank", 
        browserOptions
    );

    // Watchdog to ensure stealth assistant remains injected across SPA page navigations
    if (window._injectionWatchdog) {
        clearInterval(window._injectionWatchdog);
    }
    window._injectionWatchdog = setInterval(() => {
        if (!appState.isBotRunning || !chessWebView) return;
        chessWebView.executeScript({ code: "typeof window.drawStealthOverlay" }, (res) => {
            if (!res || res[0] === "undefined") {
                console.log("Watchdog: Study reader not active. Re-injecting...");
                injectStealthScript();
            }
        });
    }, 2500);

    // When page finished loading, inject board detector & arrow painter scripts
    chessWebView.addEventListener("loadstop", () => {
        console.log("Analysis page loaded. Injecting study board reader...");
        addLiveLog("Study board loaded. Injecting analysis reader...", "info");
        injectStealthScript();
    });

    // Listen to board data events sent from WebView (supports stringified JSON and raw object payloads)
    chessWebView.addEventListener("message", (event) => {
        let data = (event && event.data !== undefined) ? event.data : event;
        if (typeof data === "string") {
            try {
                data = JSON.parse(data);
            } catch (e) {
                console.error("Failed to parse message string from InAppBrowser:", e);
                return;
            }
        }
        // Handle Android InAppBrowser data encapsulation
        if (data && data.data && typeof data.data === "object" && !data.matrix) {
            data = data.data;
        } else if (data && data.data && typeof data.data === "string") {
            try {
                const inner = JSON.parse(data.data);
                if (inner && (inner.type || inner.matrix)) data = inner;
            } catch (e) {}
        }

        if (data && (data.type === "BOARD_STATE" || (data.matrix && Array.isArray(data.matrix)))) {
            handleBoardUpdate(data.matrix, data.is_white_bottom, data.time_left);
        } else if (data && data.type === "ERROR") {
            addLiveLog("WebView Error: " + data.message, "error");
            console.error("WebView script error:", data.message, data.stack);
        }
    });

    // Reset button when closed
    chessWebView.addEventListener("exit", () => {
        addLiveLog("WebView overlay exited by user.", "warning");
        stopBot();
    });
}

// Injects the in-memory stealth script into the active InAppBrowser instance
function injectStealthScript() {
    if (!chessWebView) return;

    // Inject CSS rules for overlay
    chessWebView.insertCSS({
        code: `
            #stealth-hud-container, #stealth-board-overlay {
                pointer-events: none !important;
                z-index: 99999 !important;
            }
        `
    });

    if (window.injectedStealthFunction) {
        const code = `(${window.injectedStealthFunction.toString()})();`;
        chessWebView.executeScript({ code: code }, (res) => {
            console.log("Stealth script injected successfully.");
        });
    } else {
        console.error("Error: window.injectedStealthFunction is not loaded on main window!");
    }
}

function stopBot() {
    appState.isBotRunning = false;
    addLiveLog("Study session stopped.", "warning");

    if (window._injectionWatchdog) {
        clearInterval(window._injectionWatchdog);
        window._injectionWatchdog = null;
    }
    
    const startBtn = document.getElementById("start-bot-btn");
    startBtn.innerHTML = `<span>Start Assistant Bot</span><span class="btn-ar">بدء بوت المساعد الذكي</span>`;
    startBtn.style.background = "linear-gradient(135deg, #2b0f0f, #7a0f0f)";
    startBtn.style.borderColor = "var(--primary-red)";
    
    // Clear chess structures
    lastMatrix = null;
    lastFen = "";
    isWhiteTurn = true;
    isSearching = false;
    pendingSearch = null;
    if (showMovesTimeout) clearTimeout(showMovesTimeout);
}

let isSearching = false;
let pendingSearch = null;

function triggerSearch(fen, isWhiteBottom, timeLeft) {
    if (!stockfishWorker || !appState.isBotRunning) return;
    isSearching = true;
    parsedMoves = [];
    
    stockfishWorker.postMessage(`position fen ${fen}`);
    
    currentSearchCallback = () => {
        let finalMoves = [...parsedMoves].filter(m => m !== undefined && m !== null);
        if (finalMoves.length === 0) return;

        // Apply Anti-Ban scrambling
        finalMoves = humanizeMoves(finalMoves);
        
        // Calculate randomized delay based on position difficulty and clock
        const delaySeconds = calculateDelay(finalMoves, timeLeft);
        
        addLiveLog("Best move: " + finalMoves[0].move + " (Score: " + finalMoves[0].score + ")", "success");
        if (delaySeconds > 0.01) {
            addLiveLog(`Delaying display by ${delaySeconds.toFixed(1)}s (Anti-Ban)`, "info");
            showMovesTimeout = setTimeout(() => {
                sendMovesToWebView(finalMoves, isWhiteBottom, timeLeft);
            }, delaySeconds * 1000);
        } else {
            sendMovesToWebView(finalMoves, isWhiteBottom, timeLeft);
        }
    };

    stockfishWorker.postMessage(`go depth ${appState.engineDepth}`);
}

// Process board updates
function handleBoardUpdate(matrix, isWhiteBottom, timeLeft) {
    updateTurnDirection(matrix);
    const fen = translateMatrixToFen(matrix);
    
    // Position changed, start Stockfish search
    if (fen !== lastFen && fen !== "8/8/8/8/8/8/8/8 w - - 0 1" && fen !== "8/8/8/8/8/8/8/8 b - - 0 1") {
        lastFen = fen;
        addLiveLog("Board state updated. FEN: " + fen, "engine");
        
        // Clear any pending render timers so we don't display outdated moves
        if (showMovesTimeout) {
            clearTimeout(showMovesTimeout);
            showMovesTimeout = null;
        }

        if (isSearching) {
            // Queue this search to run immediately after the current one stops
            pendingSearch = { fen, isWhiteBottom, timeLeft };
            stockfishWorker.postMessage("stop");
        } else {
            pendingSearch = null;
            triggerSearch(fen, isWhiteBottom, timeLeft);
        }
    }
}

// Send calculations back to the WebView to draw overlays
function sendMovesToWebView(moves, isWhiteBottom, timeLeft) {
    if (!chessWebView) return;
    
    addLiveLog("Rendering " + moves.length + " arrow(s) in WebView...", "info");
    // Convert to JSON and evaluate injection in WebView DOM
    const serializedMoves = JSON.stringify(moves);
    const code = `
        (function() {
            if (typeof window.drawStealthOverlay === 'function') {
                window.drawStealthOverlay(${serializedMoves}, ${isWhiteBottom}, ${timeLeft}, ${appState.showArrows}, ${appState.showHud}, ${appState.stealthScreen}, ${appState.soundEnabled});
                return "DRAW_OK";
            }
            return "NOT_READY";
        })()
    `;
    chessWebView.executeScript({ code: code }, (result) => {
        if (!result || result[0] !== "DRAW_OK") {
            // Re-inject if drawStealthOverlay was not defined yet
            injectStealthScript();
        }
    });
}

// Desktop Simulator Mock for browser testing
function mockWebViewDesktop() {
    console.log("Mock started. Open Chess.com in browser and paste mock moves.");
    // Simulate periodic dummy Chess board updates
    setInterval(() => {
        if (!appState.isBotRunning) return;
        const dummyMatrix = [
            ["r","n","b","q","k","b","n","r"],
            ["p","p","p","p","p","p","p","p"],
            ["","","","","","","",""],
            ["","","","","","","",""],
            ["","","","","","","",""],
            ["","","","","","","",""],
            ["P","P","P","P","P","P","P","P"],
            ["R","N","B","Q","K","B","N","R"]
        ];
        handleBoardUpdate(dummyMatrix, true, 280);
    }, 4000);
}
