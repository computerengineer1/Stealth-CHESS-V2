window.injectedStealthFunction = function() {
    if (window.__stealth_assistant_running) {
        console.log("Stealth Injected Script is already running.");
        return;
    }
    window.__stealth_assistant_running = true;
    console.log("Stealth Injected Script Loaded successfully!");

    // State & Configuration
    window.__stealth_ui_hidden = false;
    window.__stealth_hud_minimized = false;
    window.__stealth_sound_enabled = true;
    window.__stealth_last_known_score = "0.00";
    window.__stealth_last_best_move = "";

    // Use native setTimeout with iOS WKWebView fallback
    let nativeSetTimeout = window.setTimeout.bind(window);
    try {
        const frame = document.createElement('iframe');
        frame.style.display = 'none';
        frame.src = 'about:blank';
        document.documentElement.appendChild(frame);
        if (frame.contentWindow && frame.contentWindow.setTimeout) {
            nativeSetTimeout = frame.contentWindow.setTimeout.bind(frame.contentWindow);
        }
    } catch (e) {
        console.log("Using fallback setTimeout.");
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

        if (window.__stealth_ui_hidden || window.__stealth_settings_arrows === false) {
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
            // and show calculating indicator on HUD so user doesn't follow old tactics
            const domSvg = document.getElementById("stealth-board-overlay");
            if (domSvg) {
                Array.from(domSvg.children).forEach(c => {
                    if (c.tagName.toLowerCase() !== 'defs') c.remove();
                });
            }
            // Update HUD into calculating state while keeping last known score
            drawGameHud([], timeLeft, window.__stealth_settings_hud !== false, true);
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
        window.__stealth_settings_arrows = (showArrows !== false);
        window.__stealth_settings_hud = (showHud !== false);
        window.__stealth_settings_secure = (stealthScreen !== false);
        if (soundEnabled !== undefined) {
            window.__stealth_sound_enabled = soundEnabled;
        }

        if (window.__stealth_ui_hidden) {
            showArrows = false;
            showHud = false;
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
                drawGameHud(moves || [], timeLeft, showHud, moves.length === 0);
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

            // Render moves in reverse order so best move paints on top
            for (let idx = moves.length - 1; idx >= 0; idx--) {
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

                // Drop shadow line (Only for Best Move)
                if (isTopMove) {
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

                if (isTopMove) {
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

            // Draw HUD
            drawGameHud(moves, timeLeft, showHud, false);

        } catch (err) {
            console.error("Stealth overlay draw error:", err);
        }
    };

    // ====================================================================
    //  Modern Mobile HUD Overlay (Glassmorphism & Expand/Minimize)
    // ====================================================================
    function drawGameHud(moves, timeLeft, showHud, isCalculating) {
        let hud = document.getElementById("stealth-hud-card");
        if (showHud === false || window.__stealth_ui_hidden) {
            if (hud) hud.style.setProperty("display", "none", "important");
            updateStealthFloatingBadge();
            return;
        }
        updateStealthFloatingBadge();

        if (!hud) {
            hud = document.createElement("div");
            hud.setAttribute("id", "stealth-hud-card");
            Object.assign(hud.style, {
                position: "fixed",
                bottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
                left: "12px",
                right: "12px",
                backgroundColor: "rgba(12, 12, 18, 0.94)",
                border: "1.5px solid rgba(27, 172, 166, 0.7)",
                borderRadius: "14px",
                padding: "10px 14px",
                color: "#ffffff",
                fontFamily: "'Segoe UI', Arial, sans-serif",
                fontSize: "12px",
                zIndex: "999999",
                boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                backdropFilter: "blur(12px)",
                webkitBackdropFilter: "blur(12px)",
                transition: "all 0.25s ease"
            });
            document.body.appendChild(hud);
        }

        hud.style.setProperty("display", "flex", "important");

        // Format Clock
        const m = Math.floor(timeLeft / 60);
        const s = Math.floor(timeLeft % 60);
        const clockStr = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;

        // Color state based on time
        let borderColor = "rgba(27, 172, 166, 0.7)";
        let timeColor = "#2ecc71";
        let timeState = "SAFE";
        if (timeLeft <= 15) {
            borderColor = "rgba(235, 60, 60, 0.9)";
            timeColor = "#ff4f4f";
            timeState = "PANIC!";
        } else if (timeLeft <= 60) {
            borderColor = "rgba(240, 150, 20, 0.85)";
            timeColor = "#f39c12";
            timeState = "WARNING";
        }
        hud.style.borderColor = borderColor;

        // If HUD is minimized, render sleek compact floating pill
        if (window.__stealth_hud_minimized) {
            hud.style.padding = "6px 12px";
            hud.style.gap = "0";
            hud.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-weight:bold; color:#ff3333;">🛡️ STEALTH</span>
                        <span style="font-size:11px; color:#2ecc71; font-weight:bold;">${window.__stealth_last_known_score}</span>
                        <span style="font-size:10px; color:${timeColor};">⏱️ ${clockStr}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:6px;">
                        <button id="stealth-btn-toggle-hud" style="background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); border-radius:6px; color:#fff; font-size:10px; padding:3px 8px; cursor:pointer;">[+] EXPAND</button>
                        <button id="stealth-btn-min-hide" style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.15); border-radius:6px; color:#bbb; font-size:11px; padding:2px 6px; cursor:pointer;" title="Hide UI">👁️</button>
                    </div>
                </div>
            `;
            const expandBtn = hud.querySelector("#stealth-btn-toggle-hud");
            if (expandBtn) {
                expandBtn.onclick = (e) => {
                    e.stopPropagation();
                    window.__stealth_hud_minimized = false;
                    drawGameHud(moves, timeLeft, showHud, isCalculating);
                };
            }
            const minHideBtn = hud.querySelector("#stealth-btn-min-hide");
            if (minHideBtn) {
                minHideBtn.onclick = (e) => {
                    e.stopPropagation();
                    window.__stealth_ui_hidden = true;
                    hud.style.setProperty("display", "none", "important");
                    const domSvg = document.getElementById("stealth-board-overlay");
                    if (domSvg) domSvg.style.setProperty("display", "none", "important");
                    updateStealthFloatingBadge();
                    showStealthToast("🛡️ Stealth Mode Active (Tap 🛡️ icon to restore)");
                };
            }
            return;
        }

        hud.style.padding = "10px 14px";
        hud.style.gap = "8px";

        // Evaluation calculation & retention
        let bestScore = window.__stealth_last_known_score || "0.00";
        if (moves && moves.length > 0 && moves[0].score) {
            bestScore = moves[0].score;
            window.__stealth_last_known_score = bestScore;
        }

        let scoreVal = parseFloat(bestScore) || 0.0;
        let isMate = bestScore.includes("M");

        let barRatio = 50;
        if (isMate) {
            barRatio = bestScore.includes("-") ? 5 : 95;
        } else {
            let clamped = Math.max(-5.0, Math.min(5.0, scoreVal));
            barRatio = ((clamped + 5.0) / 10.0) * 100;
        }

        // Candidate moves rows
        let candidateRowsHtml = "";
        if (moves && moves.length > 0) {
            moves.forEach((item, index) => {
                let badgeText = "GOOD";
                let badgeBg = "rgba(240, 150, 20, 0.15)";
                let badgeColor = "#f39c12";

                if (item.score.includes("M")) {
                    badgeText = "MATE";
                    badgeBg = "rgba(155, 89, 182, 0.25)";
                    badgeColor = "#9b59b6";
                } else if (index === 0) {
                    if (scoreVal >= 3.5) {
                        badgeText = "BRILLIANT";
                        badgeBg = "rgba(26, 188, 156, 0.25)";
                        badgeColor = "#1abc9c";
                    } else {
                        badgeText = "BEST";
                        badgeBg = "rgba(46, 204, 113, 0.25)";
                        badgeColor = "#2ecc71";
                    }
                } else {
                    let firstVal = parseFloat(moves[0].score) || 0.0;
                    let currentVal = parseFloat(item.score) || 0.0;
                    let diff = Math.abs(firstVal - currentVal);
                    if (diff >= 2.0) {
                        badgeText = "BLUNDER";
                        badgeBg = "rgba(231, 76, 60, 0.25)";
                        badgeColor = "#e74c3c";
                    } else if (diff >= 1.0) {
                        badgeText = "INACCURACY";
                        badgeBg = "rgba(230, 126, 34, 0.25)";
                        badgeColor = "#e67e22";
                    } else if (diff <= 0.35) {
                        badgeText = "EXCELLENT";
                        badgeBg = "rgba(160, 212, 104, 0.25)";
                        badgeColor = "#a0d468";
                    }
                }

                candidateRowsHtml += `
                    <div style="display:flex; justify-content:space-between; align-items:center; background-color:rgba(255,255,255,0.04); padding:4px 8px; border-radius:6px;">
                        <div style="display:flex; align-items:center; gap:6px;">
                            <span style="width:6px; height:6px; border-radius:50%; background-color:${badgeColor};"></span>
                            <strong style="color:#f5f5f7;">${index+1}. ${item.move}</strong>
                            <span style="color:#8a8a93; font-size:10px;">(${item.score})</span>
                        </div>
                        <span style="font-size:9px; font-weight:bold; background-color:${badgeBg}; color:${badgeColor}; padding:2px 6px; border-radius:4px;">${badgeText}</span>
                    </div>
                `;
            });
        } else {
            candidateRowsHtml = `
                <div style="display:flex; align-items:center; justify-content:center; gap:8px; padding:8px; background:rgba(255,255,255,0.03); border-radius:6px; color:#1abc9c; font-weight:600; font-size:11px;">
                    <span style="display:inline-block; animation:stealthPulse 1.2s infinite;">⚡</span>
                    <span>CALCULATING BEST MOVE...</span>
                </div>
            `;
        }

        hud.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:5px;">
                <div style="display:flex; align-items:center; gap:6px;">
                    <span style="font-weight:bold; letter-spacing:0.5px; color:#ff3333;">🛡️ STEALTH ASSISTANT</span>
                    <span style="font-size:10px; color:#8a8a93;">| ⏱️ <strong style="color:${timeColor}">${clockStr}</strong></span>
                </div>
                <div style="display:flex; align-items:center; gap:6px;">
                    <button id="stealth-btn-toggle-sound" style="background:none; border:none; color:#aaa; font-size:12px; cursor:pointer;" title="Toggle Sound">
                        ${window.__stealth_sound_enabled ? '🔊' : '🔇'}
                    </button>
                    <button id="stealth-btn-minimize" style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); border-radius:4px; color:#ddd; font-size:10px; padding:2px 6px; cursor:pointer;">[-] MIN</button>
                    <button id="stealth-btn-hide-ui" style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); border-radius:4px; color:#ddd; font-size:10px; padding:2px 6px; cursor:pointer;" title="Hide UI (Stealth)">👁️ HIDE</button>
                </div>
            </div>
            
            <div style="display:flex; gap:12px; align-items:center;">
                <!-- Vertical Power Bar -->
                <div style="width:10px; height:50px; background-color:#202026; border-radius:3px; position:relative; border:1px solid rgba(255,255,255,0.15); overflow:hidden;">
                    <div style="position:absolute; bottom:0; left:0; width:100%; height:${barRatio}%; background:linear-gradient(to top, #2ecc71, #1abc9c); transition:height 0.3s ease;"></div>
                </div>

                <!-- Live Eval Panel -->
                <div style="flex:1; display:flex; flex-direction:column; gap:3px;">
                    <div style="display:flex; justify-content:space-between;">
                        <span style="color:#8a8a93; font-size:11px;">Evaluation:</span>
                        <strong style="color:${scoreVal >= 0 ? '#2ecc71' : '#ff4f4f'}; font-size:13px;">${scoreVal > 0 ? '+' : ''}${bestScore}</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between;">
                        <span style="color:#8a8a93; font-size:11px;">Time Status:</span>
                        <span style="font-weight:bold; color:${timeColor}; font-size:11px;">${timeState}</span>
                    </div>
                </div>
            </div>

            <!-- Candidate list or Calculating State -->
            <div style="display:flex; flex-direction:column; gap:4px;">
                ${candidateRowsHtml}
            </div>
        `;

        // Bind HUD controls
        const minBtn = hud.querySelector("#stealth-btn-minimize");
        if (minBtn) {
            minBtn.onclick = (e) => {
                e.stopPropagation();
                window.__stealth_hud_minimized = true;
                drawGameHud(moves, timeLeft, showHud, isCalculating);
            };
        }

        const hideBtn = hud.querySelector("#stealth-btn-hide-ui");
        if (hideBtn) {
            hideBtn.onclick = (e) => {
                e.stopPropagation();
                window.__stealth_ui_hidden = true;
                hud.style.setProperty("display", "none", "important");
                const domSvg = document.getElementById("stealth-board-overlay");
                if (domSvg) domSvg.style.setProperty("display", "none", "important");
                updateStealthFloatingBadge();
                showStealthToast("🛡️ Stealth Mode Active (Tap 🛡️ icon to restore)");
            };
        }

        const sndBtn = hud.querySelector("#stealth-btn-toggle-sound");
        if (sndBtn) {
            sndBtn.onclick = (e) => {
                e.stopPropagation();
                window.__stealth_sound_enabled = !window.__stealth_sound_enabled;
                sndBtn.textContent = window.__stealth_sound_enabled ? '🔊' : '🔇';
                showStealthToast(window.__stealth_sound_enabled ? "🔊 Sound Enabled" : "🔇 Sound Muted");
            };
        }
    }

    // ====================================================================
    //  Stealth Floating Badge (Always allows instant 1-tap restore)
    // ====================================================================
    function updateStealthFloatingBadge() {
        let badge = document.getElementById("stealth-restore-pill");
        if (!window.__stealth_ui_hidden) {
            if (badge) badge.style.display = "none";
            return;
        }
        if (!badge) {
            badge = document.createElement("div");
            badge.id = "stealth-restore-pill";
            Object.assign(badge.style, {
                position: "fixed",
                top: "14px",
                right: "14px",
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: "rgba(10, 10, 16, 0.88)",
                border: "1.5px solid rgba(255, 51, 51, 0.65)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontSize: "16px",
                cursor: "pointer",
                zIndex: "1000001",
                boxShadow: "0 4px 15px rgba(0,0,0,0.6)",
                opacity: "0.65",
                transition: "all 0.2s ease",
                userSelect: "none",
                webkitUserSelect: "none",
                touchAction: "manipulation"
            });
            badge.innerHTML = "🛡️";
            badge.onclick = (e) => {
                e.stopPropagation();
                window.__stealth_ui_hidden = false;
                badge.style.display = "none";
                const domSvg = document.getElementById("stealth-board-overlay");
                const hud = document.getElementById("stealth-hud-card");
                if (domSvg && window.__stealth_settings_arrows !== false) domSvg.style.setProperty("display", "block", "important");
                if (hud && window.__stealth_settings_hud !== false) hud.style.setProperty("display", "flex", "important");
                showStealthToast("🛡️ Stealth UI Restored");
            };
            badge.ontouchstart = () => { badge.style.opacity = "1"; };
            badge.ontouchend = () => { badge.style.opacity = "0.65"; };
            document.body.appendChild(badge);
        }
        badge.style.display = "flex";
    }

    // ====================================================================
    //  Safe Stealth Gesture Handler (4-Tap on top status bar only)
    // ====================================================================
    let lastTapTime = 0;
    let tapCount = 0;

    function handleSafeTapGesture(e) {
        // Only trigger stealth hide/show if user intentionally taps on the top 40px of screen
        const clientY = e.clientY || (e.changedTouches && e.changedTouches[0] && e.changedTouches[0].clientY) || 0;
        if (clientY > 45) {
            tapCount = 0;
            return;
        }

        // Ignore touches on chess board, pieces, squares, HUD, or interactive elements
        if (e.target && typeof e.target.closest === "function") {
            if (e.target.closest('wc-chess-board, chess-board, cg-board, .board, .piece, [class*="square-"], #stealth-hud-card, #stealth-restore-pill, button, input, a')) {
                tapCount = 0;
                return;
            }
        }

        const now = Date.now();
        if (now - lastTapTime < 400) {
            tapCount++;
            if (tapCount >= 4) {
                window.__stealth_ui_hidden = !window.__stealth_ui_hidden;
                tapCount = 0;

                const domSvg = document.getElementById("stealth-board-overlay");
                const hud = document.getElementById("stealth-hud-card");

                if (window.__stealth_ui_hidden) {
                    if (hud) hud.style.setProperty("display", "none", "important");
                    if (domSvg) domSvg.style.setProperty("display", "none", "important");
                    updateStealthFloatingBadge();
                    showStealthToast("🛡️ Stealth Mode: Hidden");
                } else {
                    if (domSvg && window.__stealth_settings_arrows !== false) domSvg.style.setProperty("display", "block", "important");
                    if (hud && window.__stealth_settings_hud !== false) hud.style.setProperty("display", "flex", "important");
                    updateStealthFloatingBadge();
                    showStealthToast("🛡️ Stealth Mode: Restored");
                }
            }
        } else {
            tapCount = 1;
        }
        lastTapTime = now;
    }

    // Listen only to pointerup (prevents double counting from touchstart + click)
    document.addEventListener("pointerup", handleSafeTapGesture, { passive: true });

    // Inject breathing pulse animation for HUD calculating state
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerHTML = `
        @keyframes stealthPulse {
            0% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.2); opacity: 1; }
            100% { transform: scale(1); opacity: 0.8; }
        }
    `;
    document.head.appendChild(styleSheet);

    // Start scanner based on hostname
    if (isLichess) {
        console.log("Stealth: Lichess.org detected. Starting Lichess scanner.");
        scanLichessBoard();
    } else {
        console.log("Stealth: Chess.com detected. Starting Chess.com scanner.");
        scanChessBoard();
    }
};
