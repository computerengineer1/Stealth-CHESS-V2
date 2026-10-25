window.injectedStealthFunction = function() {
    // Supports study/analysis pages AND live games against people.
    const isPermittedPage = () => {
        const host = window.location.hostname.toLowerCase();
        const path = window.location.pathname.toLowerCase();
        const isChessCom = host === "chess.com" || host.endsWith(".chess.com");
        const isLichess = host === "lichess.org" || host.endsWith(".lichess.org");
        if (isChessCom) {
            return /^\/(analysis|live|online|game)(?:\/|$)/.test(path);
        }
        if (isLichess) {
            return /^\/(analysis|study|future|simul|round)(?:\/|$)/.test(path) ||
                   /^[a-z]{2}[a-z0-9]{6}(?:$|\/black$|\/white$|\/play$)/.test(path.replace(/^\//, ""));
        }
        return false;
    };
    window.__stealth_is_permitted_page = isPermittedPage;

    if (!isPermittedPage()) {
        console.info("Chess Helper: disabled outside supported pages.");
        return;
    }
    if (window.__stealth_assistant_running) {
        console.log("Chess Helper is already running.");
        return;
    }
    window.__stealth_assistant_running = true;
    console.log("Chess Helper loaded (study + live games supported).");

    // State & Configuration
    window.__stealth_ui_hidden = false;
    window.__stealth_sound_enabled = true;
    window.__stealth_last_best_move = "";

    // LOW-DEVICE PERFORMANCE PROFILE
    // The heavy SVG drop-shadow / glow filters are GPU killers on older phones
    // (e.g. iPhone 11 Pro). We detect weak devices once and skip filters,
    // shadows and extra DOM nodes entirely for a rock-solid smooth framerate.
    const isLowPowerDevice = (() => {
        try {
            const mem = navigator.deviceMemory || 4;          // GB (Safari reports undefined -> assume mid)
            const cores = navigator.hardwareConcurrency || 4; // CPU threads
            const ua = navigator.userAgent || "";
            const isOldIOS = /iPhone|iPad|iPod/.test(ua) && !/CPU OS (1[5-9]|2[0-9])_/.test(ua.replace(/_/g, "."));
            return mem <= 4 || cores <= 4 || isOldIOS;
        } catch (e) {
            return true; // when in doubt, favour smoothness
        }
    })();
    window.__stealth_low_power = isLowPowerDevice;

    // Use normal WebView timers; no isolated-frame API bypass is needed in study mode.
    const nativeSetTimeout = window.setTimeout.bind(window);

    function clearOverlayOutsideStudyMode() {
        ["stealth-board-overlay", "stealth-hud-card", "stealth-floating-badge", "stealth-assistant-hud", "stealth-toast"].forEach(id => {
            const element = document.getElementById(id);
            if (element) element.remove();
        });
    }

    // ====================================================================
    //  Pure Web Audio API Sound Synthesizer (Zero Network, 100% Offline)
    // ====================================================================
    const SoundFx = {
        ctx: null,
        init() {
            try {
                if (!this.ctx) {
                    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                    if (AudioContextClass) {
                        this.ctx = new AudioContextClass();
                    }
                }
                if (this.ctx && this.ctx.state === 'suspended') {
                    this.ctx.resume().catch(() => {});
                }
            } catch (e) {}
        },
        playMove() {
            if (!window.__stealth_sound_enabled) return;
            try {
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.type = "triangle";
                osc.frequency.setValueAtTime(480, now);
                osc.frequency.exponentialRampToValueAtTime(240, now + 0.07);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
                osc.start(now);
                osc.stop(now + 0.07);
            } catch (e) {}
        },
        playBrilliant() {
            if (!window.__stealth_sound_enabled) return;
            try {
                this.init();
                if (!this.ctx) return;
                const chords = [587.33, 880, 1174.66];
                chords.forEach((freq, idx) => {
                    const t = this.ctx.currentTime + idx * 0.055;
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.type = "sine";
                    osc.frequency.setValueAtTime(freq, t);
                    gain.gain.setValueAtTime(0.25, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
                    osc.start(t);
                    osc.stop(t + 0.25);
                });
            } catch (e) {}
        },
        playMate() {
            if (!window.__stealth_sound_enabled) return;
            try {
                this.init();
                if (!this.ctx) return;
                const freqs = [440, 554.37, 659.25, 880];
                freqs.forEach((freq) => {
                    const t = this.ctx.currentTime;
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.type = "sine";
                    osc.frequency.setValueAtTime(freq, t);
                    gain.gain.setValueAtTime(0.18, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
                    osc.start(t);
                    osc.stop(t + 0.55);
                });
            } catch (e) {}
        },
        playLowTime() {
            if (!window.__stealth_sound_enabled) return;
            try {
                this.init();
                if (!this.ctx) return;
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.type = "sine";
                osc.frequency.setValueAtTime(880, now);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
            } catch (e) {}
        }
    };

    // Caching state to throttle WebView-to-App messages
    let cachedIsWhiteBottom = null;
    let framesSinceOrientationCheck = 0;
    let lastSentMatrixStr = "";
    let lastSentIsWhiteBottom = null;
    let lastSentTimeLeft = null;
    let lastLowTimeBeep = 0;

    // Detect which chess platform the WebView is on
    const isLichess = window.location.hostname.includes("lichess.org");

    // ====================================================================
    //  Cross-Platform InAppBrowser Bridge Message Sender (Android + iOS)
    // ====================================================================
    function sendBridgeMessage(payload) {
        const jsonStr = (typeof payload === 'string') ? payload : JSON.stringify(payload);
        
        // 1. Android Cordova InAppBrowser
        if (window.cordova_iab && typeof window.cordova_iab.postMessage === 'function') {
            try {
                window.cordova_iab.postMessage(jsonStr);
                return true;
            } catch (e) {}
        }
        if (typeof cordova_iab !== 'undefined' && typeof cordova_iab.postMessage === 'function') {
            try {
                cordova_iab.postMessage(jsonStr);
                return true;
            } catch (e) {}
        }
        
        // 2. iOS WKWebView InAppBrowser
        if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.cordova_iab) {
            try {
                window.webkit.messageHandlers.cordova_iab.postMessage(jsonStr);
                return true;
            } catch (e) {}
        }
        
        // 3. Fallback / desktop iframe mock
        if (window.parent && window.parent !== window) {
            try {
                window.parent.postMessage(payload, "*");
                return true;
            } catch (e) {}
        }
        return false;
    }

    // ====================================================================
    //  Toast Notification Display Helper
    // ====================================================================
    function showStealthToast(message) {
        let toast = document.getElementById("stealth-toast");
        if (!toast) {
            toast = document.createElement("div");
            toast.id = "stealth-toast";
            Object.assign(toast.style, {
                position: "fixed",
                top: "20px",
                left: "50%",
                transform: "translateX(-50%)",
                backgroundColor: "rgba(15, 15, 20, 0.95)",
                border: "1px solid rgba(255, 51, 51, 0.6)",
                borderRadius: "20px",
                padding: "8px 18px",
                color: "#ffffff",
                fontFamily: "'Segoe UI', Arial, sans-serif",
                fontSize: "12px",
                fontWeight: "600",
                zIndex: "1000000",
                boxShadow: "0 6px 20px rgba(0,0,0,0.6)",
                pointerEvents: "none",
                transition: "opacity 0.3s ease, transform 0.3s ease",
                opacity: "0"
            });
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.style.opacity = "1";
        toast.style.transform = "translateX(-50%) translateY(0)";

        if (window._stealthToastTimer) clearTimeout(window._stealthToastTimer);
        window._stealthToastTimer = setTimeout(() => {
            if (toast) {
                toast.style.opacity = "0";
                toast.style.transform = "translateX(-50%) translateY(-8px)";
            }
        }, 1600);
    }

    // ====================================================================
    //  Robust Board Element Finder for Mobile & Desktop
    // ====================================================================
    function findChessBoard() {
        // 1. Strict Board Tag Selectors (direct 8x8 board elements)
        const strictSelectors = [
            'wc-chess-board',
            'chess-board',
            'cg-board',
            '#board-single',
            '.board-layout-component wc-chess-board',
            '#board-layout-chessboard wc-chess-board'
        ];
        for (const sel of strictSelectors) {
            const found = document.querySelectorAll(sel);
            for (let i = 0; i < found.length; i++) {
                const el = found[i];
                const r = el.getBoundingClientRect();
                if (r.width > 120 && r.height > 120) {
                    // Verify it's approximately square (aspect ratio between 0.85 and 1.15)
                    const ratio = r.width / r.height;
                    if (ratio > 0.80 && ratio < 1.25) {
                        return el;
                    }
                }
            }
        }

        // 2. Fallback: Search inside outer layout containers
        const layoutContainers = document.querySelectorAll('#board-layout-chessboard, .board-layout-main');
        for (let i = 0; i < layoutContainers.length; i++) {
            const container = layoutContainers[i];
            const childBoard = container.querySelector('wc-chess-board, chess-board, .board');
            if (childBoard) {
                const r = childBoard.getBoundingClientRect();
                if (r.width > 120 && r.height > 120) return childBoard;
            }
        }

        // 3. Generic board class fallback
        const generic = document.querySelectorAll('.board, [id^="board-"]');
        for (let i = 0; i < generic.length; i++) {
            const el = generic[i];
            const r = el.getBoundingClientRect();
            if (r.width > 120 && r.height > 120) {
                const ratio = r.width / r.height;
                if (ratio > 0.80 && ratio < 1.25) return el;
            }
        }

        return document.querySelector('wc-chess-board, chess-board, cg-board') || null;
    }

    // ====================================================================
    //  Synchronize DOM SVG Overlay with Chessboard Screen Position
    // ====================================================================
    function syncOverlayPosition(boardRect) {
        const domSvg = document.getElementById("stealth-board-overlay");
        if (!domSvg) return;

        if (window.__stealth_settings_arrows === false) {
            domSvg.style.display = "none";
            return;
        }

        const leftPx = boardRect.left + "px";
        const topPx = boardRect.top + "px";
        const widthPx = boardRect.width + "px";
        const heightPx = boardRect.height + "px";

        if (domSvg.style.position !== "fixed") domSvg.style.position = "fixed";
        if (domSvg.style.margin !== "0px") domSvg.style.margin = "0px";
        if (domSvg.style.transform !== "none") domSvg.style.transform = "none";
        if (domSvg.style.left !== leftPx) domSvg.style.left = leftPx;
        if (domSvg.style.top !== topPx) domSvg.style.top = topPx;
        if (domSvg.style.width !== widthPx) domSvg.style.width = widthPx;
        if (domSvg.style.height !== heightPx) domSvg.style.height = heightPx;
        if (domSvg.getAttribute("width") !== String(boardRect.width)) {
            domSvg.setAttribute("width", String(boardRect.width));
        }
        if (domSvg.getAttribute("height") !== String(boardRect.height)) {
            domSvg.setAttribute("height", String(boardRect.height));
        }
        if (domSvg.getAttribute("viewBox") !== `0 0 ${boardRect.width} ${boardRect.height}`) {
            domSvg.setAttribute("viewBox", `0 0 ${boardRect.width} ${boardRect.height}`);
        }
        if (domSvg.style.display !== "block") {
            domSvg.style.display = "block";
        }
    }

    // ====================================================================
    //  Lichess.org Board Scanner
    // ====================================================================
    function scanLichessBoard() {
        if (!isPermittedPage()) {
            clearOverlayOutsideStudyMode();
            nativeSetTimeout(scanLichessBoard, 300);
            return;
        }
        try {
            const cgBoard = document.querySelector('cg-board');
            if (!cgBoard) {
                nativeSetTimeout(scanLichessBoard, 200);
                return;
            }

            const rect = cgBoard.getBoundingClientRect();
            syncOverlayPosition(rect);

            const pieces = cgBoard.querySelectorAll('piece');
            if (!pieces.length) {
                nativeSetTimeout(scanLichessBoard, 100);
                return;
            }

            let isWhiteBottom = true;
            if (cachedIsWhiteBottom !== null && framesSinceOrientationCheck < 30) {
                isWhiteBottom = cachedIsWhiteBottom;
                framesSinceOrientationCheck++;
            } else {
                framesSinceOrientationCheck = 0;
                const boardWrap = document.querySelector('.cg-wrap');
                if (boardWrap) {
                    isWhiteBottom = !boardWrap.classList.contains('orientation-black');
                }
                cachedIsWhiteBottom = isWhiteBottom;
            }

            const squareWidth = rect.width / 8;
            const squareHeight = rect.height / 8;

            const roleMap = {
                'king': 'k', 'queen': 'q', 'rook': 'r',
                'bishop': 'b', 'knight': 'n', 'pawn': 'p'
            };

            let boardArray = Array(8).fill("").map(() => Array(8).fill(""));

            pieces.forEach(p => {
                const classes = Array.from(p.classList);
                const isWhitePiece = classes.includes('white');
                const isBlackPiece = classes.includes('black');
                if (!isWhitePiece && !isBlackPiece) return;

                let pieceChar = '';
                for (const [role, char] of Object.entries(roleMap)) {
                    if (classes.includes(role)) {
                        pieceChar = isWhitePiece ? char.toUpperCase() : char;
                        break;
                    }
                }
                if (!pieceChar) return;

                const style = p.style.transform || p.getAttribute('style') || '';
                const translateMatch = style.match(/translate\(\s*([\d.]+)px\s*,\s*([\d.]+)px\s*\)/);
                if (!translateMatch) return;

                const pixelX = parseFloat(translateMatch[1]);
                const pixelY = parseFloat(translateMatch[2]);

                let col = Math.round(pixelX / squareWidth);
                let row = Math.round(pixelY / squareHeight);
                col = Math.max(0, Math.min(7, col));
                row = Math.max(0, Math.min(7, row));

                if (!isWhiteBottom) {
                    col = 7 - col;
                    row = 7 - row;
                }

                boardArray[row][col] = pieceChar;
            });

            // Parse Lichess clock
            let timeLeft = 300;
            let clockEl = document.querySelector('.rclock-bottom .time, .rclock.rclock-bottom time');
            if (!clockEl) {
                const clocks = document.querySelectorAll('.rclock time, .clock');
                if (clocks.length > 0) clockEl = clocks[clocks.length - 1];
            }
            if (clockEl) {
                const timeText = clockEl.textContent.trim();
                if (timeText) {
                    const parts = timeText.split(':');
                    if (parts.length === 2) {
                        const min = parseInt(parts[0], 10);
                        const sec = parseFloat(parts[1]);
                        if (!isNaN(min) && !isNaN(sec)) timeLeft = min * 60 + sec;
                    } else if (parts.length === 3) {
                        const hr = parseInt(parts[0], 10);
                        const min = parseInt(parts[1], 10);
                        const sec = parseFloat(parts[2]);
                        if (!isNaN(hr) && !isNaN(min) && !isNaN(sec)) timeLeft = hr * 3600 + min * 60 + sec;
                    } else {
                        const sec = parseFloat(timeText);
                        if (!isNaN(sec)) timeLeft = sec;
                    }
                }
            }

            // Low time warning beep
            if (timeLeft <= 15 && timeLeft > 0 && Date.now() - lastLowTimeBeep > 3000) {
                lastLowTimeBeep = Date.now();
                SoundFx.playLowTime();
            }

            sendBoardPayload(boardArray, isWhiteBottom, timeLeft);

        } catch (err) {
            console.error("Lichess scan loop error:", err);
        }

        const delay = Math.floor(Math.random() * 20) + 70;
        nativeSetTimeout(scanLichessBoard, delay);
    }

    // ====================================================================
    //  Shared Payload Sender (Throttles messages to parent Capacitor app)
    // ====================================================================
    function sendBoardPayload(boardArray, isWhiteBottom, timeLeft) {
        const matrixStr = JSON.stringify(boardArray);
        const timeDiff = lastSentTimeLeft !== null ? Math.abs(timeLeft - lastSentTimeLeft) : 999;
        
        const boardChanged = (matrixStr !== lastSentMatrixStr) || (isWhiteBottom !== lastSentIsWhiteBottom);
        const shouldSend = boardChanged || (timeDiff >= 1.0);

        if (boardChanged && lastSentMatrixStr !== "") {
            // Position changed on the board! Instantly clear outdated arrows
            // so the user never follows stale analysis (no HUD is drawn — removed by design).
            const domSvg = document.getElementById("stealth-board-overlay");
            if (domSvg) {
                Array.from(domSvg.children).forEach(c => {
                    if (c.tagName.toLowerCase() !== 'defs') c.remove();
                });
            }
            // Live games: instantly blank the overlay for a snappy, lag-free feel.
            window.__stealth_last_best_move = "";
        }

        if (shouldSend) {
            lastSentMatrixStr = matrixStr;
            lastSentIsWhiteBottom = isWhiteBottom;
            lastSentTimeLeft = timeLeft;

            const payload = {
                type: "BOARD_STATE",
                matrix: boardArray,
                is_white_bottom: isWhiteBottom,
                time_left: timeLeft
            };

            sendBridgeMessage(payload);
        }
    }

    // ====================================================================
    //  Main Chess.com Scanning Loop
    // ====================================================================
    function scanChessBoard() {
        if (!isPermittedPage()) {
            clearOverlayOutsideStudyMode();
            nativeSetTimeout(scanChessBoard, 300);
            return;
        }
        try {
            const boardElement = findChessBoard();
            if (!boardElement) {
                nativeSetTimeout(scanChessBoard, 200);
                return;
            }

            const rect = boardElement.getBoundingClientRect();
            syncOverlayPosition(rect);

            const root = boardElement.shadowRoot || boardElement;
            let pieces = root.querySelectorAll('.piece, piece, [class*="piece "]');
            if (!pieces.length) {
                pieces = document.querySelectorAll('.piece, [class*="piece "]');
            }
            if (!pieces.length) {
                nativeSetTimeout(scanChessBoard, 100);
                return;
            }

            // Determine board orientation (White vs Black on bottom)
            let isWhiteBottom = true;
            if (boardElement.classList.contains('flipped') || boardElement.hasAttribute('flipped')) {
                isWhiteBottom = false;
            } else if (boardElement.classList.contains('orientation-black') || (boardElement.parentElement && boardElement.parentElement.classList.contains('orientation-black'))) {
                isWhiteBottom = false;
            } else if (boardElement.classList.contains('orientation-white') || (boardElement.parentElement && boardElement.parentElement.classList.contains('orientation-white'))) {
                isWhiteBottom = true;
            } else if (cachedIsWhiteBottom !== null && framesSinceOrientationCheck < 30) {
                isWhiteBottom = cachedIsWhiteBottom;
                framesSinceOrientationCheck++;
            } else {
                framesSinceOrientationCheck = 0;
                let anchorPiece = Array.from(pieces).find(p => {
                    const sqClass = Array.from(p.classList).find(c => c.startsWith('square-'));
                    if (sqClass) {
                        const coordPart = sqClass.replace('square-', '');
                        let rank = 0;
                        if (coordPart.length === 2) {
                            rank = parseInt(coordPart[1], 10);
                        } else if (coordPart.length === 4) {
                            rank = parseInt(coordPart.substring(2, 4), 10);
                        }
                        return rank >= 1 && rank <= 8 && (rank <= 2 || rank >= 7); 
                    }
                    return false;
                });

                if (anchorPiece) {
                    const sqClass = Array.from(anchorPiece.classList).find(c => c.startsWith('square-'));
                    const coordPart = sqClass.replace('square-', '');
                    let rank = 0;
                    if (coordPart.length === 2) {
                        rank = parseInt(coordPart[1], 10);
                    } else if (coordPart.length === 4) {
                        rank = parseInt(coordPart.substring(2, 4), 10);
                    }
                    const aRect = anchorPiece.getBoundingClientRect();
                    const relativeY = (aRect.top - rect.top) / rect.height;
                    const expectedY_WhiteBottom = (8 - rank) / 8;
                    const expectedY_BlackBottom = (rank - 1) / 8;
                    isWhiteBottom = Math.abs(relativeY - expectedY_WhiteBottom) < Math.abs(relativeY - expectedY_BlackBottom);
                    cachedIsWhiteBottom = isWhiteBottom;
                } else if (cachedIsWhiteBottom !== null) {
                    isWhiteBottom = cachedIsWhiteBottom;
                }
            }

            // Build 8x8 Board Matrix
            let boardArray = Array(8).fill("").map(() => Array(8).fill(""));
            pieces.forEach(p => {
                const classes = Array.from(p.classList);
                const colorType = classes.find(c => c.length === 2 && (c[0] === 'w' || c[0] === 'b') && ['p', 'n', 'b', 'r', 'q', 'k'].includes(c[1].toLowerCase()));
                const sqClass = classes.find(c => c.startsWith('square-'));
                let file = 0, rank = 0;
                if (sqClass) {
                    const coordPart = sqClass.replace('square-', '');
                    if (coordPart.length === 2) {
                        file = parseInt(coordPart[0], 10);
                        rank = parseInt(coordPart[1], 10);
                    } else if (coordPart.length === 4) {
                        file = parseInt(coordPart.substring(0, 2), 10);
                        rank = parseInt(coordPart.substring(2, 4), 10);
                    }
                } else {
                    const dataSq = p.getAttribute('data-square');
                    if (dataSq && /^[a-h][1-8]$/.test(dataSq)) {
                        file = dataSq.charCodeAt(0) - 96;
                        rank = parseInt(dataSq[1], 10);
                    }
                }
                
                if (colorType && file >= 1 && file <= 8 && rank >= 1 && rank <= 8) {
                    const r = 8 - rank;
                    const c = file - 1;
                    let char = colorType[1];
                    if (colorType[0] === 'w') char = char.toUpperCase();
                    boardArray[r][c] = char;
                }
            });

            // Parse remaining time from player's clock (bottom clock)
            let timeLeft = 300;
            let clockEl = document.querySelector('.clock-bottom .clock-time-monospace, .clock-bottom span, .clock-bottom');
            if (!clockEl) {
                const clocks = document.querySelectorAll('.clock-component');
                if (clocks.length > 0) clockEl = clocks[clocks.length - 1];
            }
            if (clockEl) {
                const timeText = clockEl.textContent.trim();
                if (timeText) {
                    const parts = timeText.split(':');
                    if (parts.length === 2) {
                        const min = parseInt(parts[0], 10);
                        const sec = parseFloat(parts[1]);
                        if (!isNaN(min) && !isNaN(sec)) timeLeft = min * 60 + sec;
                    } else if (parts.length === 3) {
                        const hr = parseInt(parts[0], 10);
                        const min = parseInt(parts[1], 10);
                        const sec = parseFloat(parts[2]);
                        if (!isNaN(hr) && !isNaN(min) && !isNaN(sec)) timeLeft = hr * 3600 + min * 60 + sec;
                    } else {
                        const sec = parseFloat(timeText);
                        if (!isNaN(sec)) timeLeft = sec;
                    }
                }
            }

            // Low time warning beep
            if (timeLeft <= 15 && timeLeft > 0 && Date.now() - lastLowTimeBeep > 3000) {
                lastLowTimeBeep = Date.now();
                SoundFx.playLowTime();
            }

            sendBoardPayload(boardArray, isWhiteBottom, timeLeft);

        } catch (err) {
            console.error("Chess.com scan loop error:", err);
        }

        const delay = Math.floor(Math.random() * 20) + 70;
        nativeSetTimeout(scanChessBoard, delay);
    }

    // ====================================================================
    //  High-Performance SVG Overlay Drawer
    // ====================================================================
    window.drawStealthOverlay = function(moves, isWhiteBottom, timeLeft, showArrows, showHud, stealthScreen, soundEnabled) {
        if (!isPermittedPage()) {
            clearOverlayOutsideStudyMode();
            return;
        }
        window.__stealth_settings_arrows = (showArrows !== false);
        if (soundEnabled !== undefined) {
            window.__stealth_sound_enabled = soundEnabled;
        }

        try {
            const boardElement = findChessBoard();
            if (!boardElement) return;

            const rect = boardElement.getBoundingClientRect();
            const boardWidth = rect.width || 360;
            const boardHeight = rect.height || boardWidth;

            // Mount SVG overlay directly on document.body so LitElement never deletes it!
            let svg = document.getElementById("stealth-board-overlay");
            if (!svg) {
                svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                svg.setAttribute("id", "stealth-board-overlay");

                if (!isLowPowerDevice) {
                    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
                    defs.innerHTML = `
                        <filter id="stealth-shadow" x="-30%" y="-30%" width="160%" height="160%">
                            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="black" flood-opacity="0.85"/>
                        </filter>
                        <filter id="stealth-glow" x="-30%" y="-30%" width="160%" height="160%">
                            <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
                            <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                    `;
                    svg.appendChild(defs);
                }
                document.body.appendChild(svg);
            }

            svg.style.position = "fixed";
            svg.style.left = rect.left + "px";
            svg.style.top = rect.top + "px";
            svg.style.width = boardWidth + "px";
            svg.style.height = boardHeight + "px";
            svg.style.pointerEvents = "none";
            svg.style.zIndex = "999999";
            svg.style.margin = "0";
            svg.style.transform = "none";
            svg.setAttribute("viewBox", `0 0 ${boardWidth} ${boardHeight}`);

            // Clean previous arrows, highlights, and annotations but keep defs
            Array.from(svg.children).forEach(c => {
                if (c.tagName.toLowerCase() !== 'defs') c.remove();
            });

            if (!showArrows || !moves || moves.length === 0) {
                if (!showArrows) svg.style.display = "none";
                return;
            } else {
                svg.style.display = "block";
            }

            const sqW = boardWidth / 8;
            const sqH = boardHeight / 8;

            function sqToCoords(sq) {
                const colChar = sq[0];
                const rankChar = sq[1];
                let col = colChar.charCodeAt(0) - 97;
                let row = 8 - parseInt(rankChar, 10);
                if (!isWhiteBottom) {
                    col = 7 - col;
                    row = 7 - row;
                }
                const x = col * sqW + sqW / 2;
                const y = row * sqH + sqH / 2;
                return { x, y, col, row };
            }

            // Audio Cue Trigger on new best move
            const currentBestMove = moves[0] ? moves[0].move : "";
            if (currentBestMove && currentBestMove !== window.__stealth_last_best_move) {
                window.__stealth_last_best_move = currentBestMove;
                const topScore = moves[0].score || "";
                if (topScore.includes("M")) {
                    SoundFx.playMate();
                } else {
                    const val = parseFloat(topScore) || 0.0;
                    if (val >= 3.5 || val <= -3.5) {
                        SoundFx.playBrilliant();
                    } else {
                        SoundFx.playMove();
                    }
                }
            }

            // Parse move scores
            let parsedScores = [];
            let bestScoreVal = 0.0;
            moves.forEach((m) => {
                let val = 0.0;
                let isMate = false;
                if (m.score && m.score.includes("M")) {
                    isMate = true;
                    val = m.score.includes("-") ? -1000.0 : 1000.0;
                } else {
                    val = parseFloat(m.score) || 0.0;
                }
                parsedScores.push({ val, isMate });
            });
            if (parsedScores.length > 0) bestScoreVal = parsedScores[0].val;

            // Render moves in reverse order so best move paints on top.
            // On low-power devices we cap to 2 arrows and skip every decorative
            // node (shadows/dots) — far fewer DOM elements = zero lag.
            const maxArrows = isLowPowerDevice ? Math.min(moves.length, 2) : moves.length;
            for (let idx = maxArrows - 1; idx >= 0; idx--) {
                const m = moves[idx];
                const moveUci = m.move;
                if (!moveUci || moveUci.length < 4) continue;

                const scoreVal = parsedScores[idx].val;
                const isMate = parsedScores[idx].isMate;

                // Color palette & sizing hierarchy
                let isTopMove = (idx === 0);
                let color = isTopMove ? "rgba(46, 204, 113, 0.95)" : "rgba(240, 150, 20, 0.40)";
                let strokeWidth = isTopMove ? Math.max(4.2, sqW * 0.11) : Math.max(2.2, sqW * 0.055);
                let markerSize = isTopMove ? Math.max(13, sqW * 0.30) : Math.max(8.5, sqW * 0.18);

                if (isMate) {
                    color = isTopMove ? "rgba(155, 89, 182, 0.95)" : "rgba(155, 89, 182, 0.40)"; // Royal purple
                } else if (isTopMove) {
                    if (scoreVal >= 3.5) {
                        color = "rgba(26, 188, 156, 0.95)"; // Brilliant Teal
                    } else {
                        color = "rgba(46, 204, 113, 0.95)"; // Emerald Green
                    }
                } else {
                    const diff = Math.abs(bestScoreVal - scoreVal);
                    if (diff >= 2.0) {
                        color = "rgba(231, 76, 60, 0.35)"; // Red Blunder
                    } else if (diff >= 1.0) {
                        color = "rgba(230, 126, 34, 0.35)"; // Inaccuracy Orange
                    } else if (diff <= 0.35) {
                        color = "rgba(160, 212, 104, 0.40)"; // Excellent Olive
                    }
                }

                const fromSq = moveUci.substring(0, 2);
                const toSq = moveUci.substring(2, 4);
                const fromC = sqToCoords(fromSq);
                const toC = sqToCoords(toSq);

                // A. Square Highlights (Only for the #1 Best Move)
                if (isTopMove) {
                    const startHighlight = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                    startHighlight.setAttribute("x", (fromC.col * sqW + 2).toString());
                    startHighlight.setAttribute("y", (fromC.row * sqH + 2).toString());
                    startHighlight.setAttribute("width", (sqW - 4).toString());
                    startHighlight.setAttribute("height", (sqH - 4).toString());
                    startHighlight.setAttribute("rx", "6");
                    startHighlight.setAttribute("fill", color);
                    startHighlight.setAttribute("fill-opacity", "0.18");
                    startHighlight.setAttribute("stroke", color);
                    startHighlight.setAttribute("stroke-width", "1.8");
                    svg.appendChild(startHighlight);

                    const endHighlight = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                    endHighlight.setAttribute("x", (toC.col * sqW + 2).toString());
                    endHighlight.setAttribute("y", (toC.row * sqH + 2).toString());
                    endHighlight.setAttribute("width", (sqW - 4).toString());
                    endHighlight.setAttribute("height", (sqH - 4).toString());
                    endHighlight.setAttribute("rx", "6");
                    endHighlight.setAttribute("fill", color);
                    endHighlight.setAttribute("fill-opacity", "0.18");
                    endHighlight.setAttribute("stroke", color);
                    endHighlight.setAttribute("stroke-width", "1.8");
                    svg.appendChild(endHighlight);
                }

                // B. Arrows
                const dx = toC.x - fromC.x;
                const dy = toC.y - fromC.y;
                const length = Math.hypot(dx, dy);
                if (length < 1) continue;

                const ux = dx / length;
                const uy = dy / length;
                const paddingStart = Math.min(length * 0.15, sqW * (isTopMove ? 0.18 : 0.12));
                const paddingEnd = Math.min(length * 0.35, sqW * (isTopMove ? 0.32 : 0.20));
                const startX = fromC.x + ux * paddingStart;
                const startY = fromC.y + uy * paddingStart;
                const endX = fromC.x + ux * (length - paddingEnd);
                const endY = fromC.y + uy * (length - paddingEnd);

                // Drop shadow line (Best Move only, skipped on low-power devices)
                if (isTopMove && !isLowPowerDevice) {
                    const shadowLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
                    shadowLine.setAttribute("x1", startX.toString());
                    shadowLine.setAttribute("y1", startY.toString());
                    shadowLine.setAttribute("x2", endX.toString());
                    shadowLine.setAttribute("y2", endY.toString());
                    shadowLine.setAttribute("stroke", "black");
                    shadowLine.setAttribute("stroke-opacity", "0.55");
                    shadowLine.setAttribute("stroke-width", (strokeWidth + 2.5).toString());
                    shadowLine.setAttribute("stroke-linecap", "round");
                    svg.appendChild(shadowLine);
                }

                // Main arrow shaft
                const mainLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
                mainLine.setAttribute("x1", startX.toString());
                mainLine.setAttribute("y1", startY.toString());
                mainLine.setAttribute("x2", endX.toString());
                mainLine.setAttribute("y2", endY.toString());
                mainLine.setAttribute("stroke", color);
                mainLine.setAttribute("stroke-width", strokeWidth.toString());
                mainLine.setAttribute("stroke-linecap", "round");
                svg.appendChild(mainLine);

                // Arrow Head Triangle
                const p1x = endX;
                const p1y = endY;
                const p2x = endX - ux * markerSize + (-uy) * (markerSize * 0.65);
                const p2y = endY - uy * markerSize + ux * (markerSize * 0.65);
                const p3x = endX - ux * markerSize - (-uy) * (markerSize * 0.65);
                const p3y = endY - uy * markerSize - ux * (markerSize * 0.65);

                if (isTopMove && !isLowPowerDevice) {
                    const arrowHeadShadow = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
                    arrowHeadShadow.setAttribute("points", `${p1x+1},${p1y+1.5} ${p2x+1},${p2y+1.5} ${p3x+1},${p3y+1.5}`);
                    arrowHeadShadow.setAttribute("fill", "black");
                    arrowHeadShadow.setAttribute("fill-opacity", "0.55");
                    svg.appendChild(arrowHeadShadow);
                }

                const arrowHead = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
                arrowHead.setAttribute("points", `${p1x},${p1y} ${p2x},${p2y} ${p3x},${p3y}`);
                arrowHead.setAttribute("fill", color);
                svg.appendChild(arrowHead);

                // Start node circle (Only for Best Move)
                if (isTopMove) {
                    const startDot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                    startDot.setAttribute("cx", startX.toString());
                    startDot.setAttribute("cy", startY.toString());
                    startDot.setAttribute("r", (strokeWidth * 1.15).toString());
                    startDot.setAttribute("fill", color);
                    startDot.setAttribute("stroke", "white");
                    startDot.setAttribute("stroke-width", "1.5");
                    svg.appendChild(startDot);
                }
            }

        } catch (err) {
            console.error("Stealth overlay draw error:", err);
        }
    };

    // ====================================================================
    //  HUD FULLY REMOVED BY DESIGN
    //  The old "Stealth Assistant HUD" panel covered the live logs and the
    //  game UI, so it has been deleted. Only board arrows remain — this also
    //  removes a big source of DOM churn / lag on low-end phones.
    // ====================================================================
    function purgeLegacyHud() {
        ["stealth-hud-card", "stealth-restore-pill", "stealth-assistant-hud", "stealth-floating-badge"].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });
    }
    purgeLegacyHud();
    setInterval(purgeLegacyHud, 4000); // safety sweep across SPA re-renders

    // Start scanner based on hostname
    if (isLichess) {
        console.log("Stealth: Lichess.org detected. Starting Lichess scanner.");
        scanLichessBoard();
    } else {
        console.log("Stealth: Chess.com detected. Starting Chess.com scanner.");
        scanChessBoard();
    }
};
