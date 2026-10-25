// ==UserScript==
// @name         Chess Study Overlay — Analysis Mode
// @namespace    https://grandmaster.studio
// @version      5.2
// @description  Optional move-arrow visualization for permitted chess analysis and study pages only
// @match        https://chess.com/analysis*
// @match        https://www.chess.com/analysis*
// @match        https://*.chess.com/analysis*
// @match        https://lichess.org/analysis*
// @match        https://lichess.org/study/*
// @match        https://*.lichess.org/analysis*
// @match        https://*.lichess.org/study/*
// @grant        GM_xmlhttpRequest
// @connect      127.0.0.1
// @connect      localhost
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const isPermittedStudyPage = () => {
        const host = window.location.hostname.toLowerCase();
        const path = window.location.pathname.toLowerCase();
        const isChessCom = host === "chess.com" || host.endsWith(".chess.com");
        const isLichess = host === "lichess.org" || host.endsWith(".lichess.org");
        return (isChessCom && /^\/analysis(?:\/|$)/.test(path)) ||
               (isLichess && (/^\/analysis(?:\/|$)/.test(path) || /^\/study(?:\/|$)/.test(path)));
    };

    if (!isPermittedStudyPage()) {
        console.info("Chess Study Overlay: disabled outside study / analysis pages.");
        return;
    }

    const BRIDGE_URL = "http://127.0.0.1:5005/";
    const AUTH_URL = "http://127.0.0.1:5005/auth";
    const BEST_MOVE_URL = "http://127.0.0.1:5005/bestmove";
    const SCAN_INTERVAL_MS = 100; // 10 scans/sec for instant response

    let isConnected = false;
    let lastSentMatrixStr = "";
    let currentBestMove = "";
    let lastRenderedMove = "";

    // ── Floating HUD Badge on Screen ──
    const badge = document.createElement("div");
    badge.id = "csp5-sync-badge";
    badge.innerHTML = "♞ STUDIO: CONNECTING...";
    Object.assign(badge.style, {
        position: "fixed",
        top: "14px",
        right: "18px",
        zIndex: "999999",
        padding: "6px 14px",
        borderRadius: "20px",
        background: "rgba(11, 14, 20, 0.92)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 62, 94, 0.4)",
        color: "#f87171",
        fontFamily: "'Segoe UI', Roboto, sans-serif",
        fontSize: "11px",
        fontWeight: "700",
        letterSpacing: "1px",
        boxShadow: "0 4px 18px rgba(0, 0, 0, 0.55)",
        transition: "all 0.25s ease",
        cursor: "pointer",
        userSelect: "none"
    });
    badge.title = "Grandmaster Chess Studio PRO — Click to test connection";
    badge.addEventListener("click", () => checkConnection(true));
    (document.body || document.documentElement).appendChild(badge);

    function setBadge(state, text) {
        if (state === "ready" || state === "turn") {
            badge.style.border = "1px solid rgba(16, 185, 129, 0.7)";
            badge.style.color = "#34d399";
            badge.innerHTML = "♞ " + (text || "YOUR TURN");
        } else if (state === "waiting") {
            badge.style.border = "1px solid rgba(251, 191, 36, 0.6)";
            badge.style.color = "#fbbf24";
            badge.innerHTML = "⏳ " + (text || "WAITING FOR OPPONENT");
        } else {
            badge.style.border = "1px solid rgba(255, 62, 94, 0.4)";
            badge.style.color = "#f87171";
            badge.innerHTML = "♞ " + (text || "OFFLINE");
        }
    }

    // ── HTTP Helper using GM_xmlhttpRequest with fallback to fetch ──
    function sendBridgeRequest(url, method, payload, callback) {
        if (typeof GM_xmlhttpRequest !== "undefined") {
            GM_xmlhttpRequest({
                method: method,
                url: url,
                data: payload ? JSON.stringify(payload) : null,
                headers: { "Content-Type": "application/json" },
                timeout: 3000,
                onload: (res) => {
                    try {
                        callback(null, JSON.parse(res.responseText));
                    } catch (e) {
                        callback(null, res.responseText);
                    }
                },
                onerror: (err) => callback(err, null),
                ontimeout: () => callback(new Error("timeout"), null)
            });
        } else {
            fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: payload ? JSON.stringify(payload) : null
            })
            .then(res => res.json())
            .then(data => callback(null, data))
            .catch(err => callback(err, null));
        }
    }

    function checkConnection(manual = false) {
        sendBridgeRequest(AUTH_URL, "GET", null, (err, res) => {
            if (!err && res && res.status === "authenticated") {
                if (!isConnected || manual) {
                    isConnected = true;
                    setBadge("ready", "CONNECTED TO STUDIO");
                }
            } else {
                if (isConnected || manual) {
                    isConnected = false;
                    setBadge("error", "STUDIO DISCONNECTED");
                }
            }
        });
    }

    setInterval(() => checkConnection(false), 4000);
    checkConnection(false);

    // ── Turn and Perspective Detector ──
    function detectGameDetails(boardEl) {
        // 1. Perspective: Is user playing as Black (board flipped)?
        const isFlipped = boardEl.classList.contains('flipped') || !!document.querySelector('.board.flipped');
        const isWhiteBottom = !isFlipped;
        const myColor = isWhiteBottom ? 'w' : 'b';

        // 2. Active turn from board highlights (previous move indicators)
        let detectedTurn = null;
        const highlights = boardEl.querySelectorAll('.highlight');
        if (highlights && highlights.length >= 2) {
            for (let i = 0; i < highlights.length; i++) {
                const hl = highlights[i];
                let sqCoord = "";
                hl.classList.forEach(c => {
                    if (c.startsWith("square-")) sqCoord = c;
                });
                if (sqCoord) {
                    const piece = boardEl.querySelector(`.piece.${sqCoord}`);
                    if (piece) {
                        piece.classList.forEach(c => {
                            if (c.length === 2 && ['p', 'n', 'b', 'r', 'q', 'k'].includes(c[1].toLowerCase())) {
                                if (c[0] === 'w') {
                                    detectedTurn = 'b'; // White just moved -> Black to play
                                } else if (c[0] === 'b') {
                                    detectedTurn = 'w'; // Black just moved -> White to play
                                }
                            }
                        });
                    }
                }
                if (detectedTurn) break;
            }
        }

        // 3. Fallback: check move list
        if (!detectedTurn) {
            const moveNodes = document.querySelectorAll('wc-vertical-move-list .node, .vertical-move-list-component .node, .move-list-row .node');
            if (moveNodes && moveNodes.length > 0) {
                const lastNode = moveNodes[moveNodes.length - 1];
                if (lastNode.classList.contains('white') || lastNode.closest('.white')) {
                    detectedTurn = 'b';
                } else if (lastNode.classList.contains('black') || lastNode.closest('.black')) {
                    detectedTurn = 'w';
                }
            }
        }

        // 4. Fallback: Check active clocks
        if (!detectedTurn) {
            const bottomClock = document.querySelector('.player-component.bottom .clock-player-turn, #player-bottom .clock-player-turn');
            const topClock = document.querySelector('.player-component.top .clock-player-turn, #player-top .clock-player-turn');
            if (bottomClock) {
                detectedTurn = myColor;
            } else if (topClock) {
                detectedTurn = myColor === 'w' ? 'b' : 'w';
            }
        }

        // Default: starting position -> White to play
        if (!detectedTurn) {
            detectedTurn = 'w';
        }

        const isMyTurn = (detectedTurn === myColor);

        return { isWhiteBottom, myColor, turn: detectedTurn, isMyTurn };
    }

    // ── Read 8x8 Board Matrix ──
    function readChessCom() {
        const boardEl = document.querySelector('wc-chess-board') || document.querySelector('.board');
        if (!boardEl) return null;

        const pieces = boardEl.querySelectorAll('.piece');
        if (!pieces || pieces.length === 0) return null;

        const info = detectGameDetails(boardEl);

        const matrix = Array(8).fill("").map(() => Array(8).fill(""));

        pieces.forEach(p => {
            const classList = Array.from(p.classList);
            let pieceCode = "";
            let file = 0, rank = 0;

            classList.forEach(c => {
                if (c.length === 2 && (c[0] === 'w' || c[0] === 'b') && ['p', 'n', 'b', 'r', 'q', 'k'].includes(c[1].toLowerCase())) {
                    const color = c[0];
                    const kind = c[1].toLowerCase();
                    pieceCode = color === 'w' ? kind.toUpperCase() : kind.toLowerCase();
                } else if (c.startsWith('square-')) {
                    const coord = c.substring(7);
                    if (coord.length === 2) {
                        file = parseInt(coord[0], 10);
                        rank = parseInt(coord[1], 10);
                    }
                }
            });

            if (pieceCode && file >= 1 && file <= 8 && rank >= 1 && rank <= 8) {
                const row = 8 - rank;
                const col = file - 1;
                matrix[row][col] = pieceCode;
            }
        });

        // Time left
        let timeLeft = 300.0;
        const clockEl = document.querySelector('.player-component.bottom .clock-component') ||
                        document.querySelector('#player-bottom .clock-time-component') ||
                        document.querySelector('.player-tagline.bottom .clock');
        if (clockEl) {
            const text = clockEl.textContent.trim();
            const parts = text.split(':');
            if (parts.length === 2) timeLeft = parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
            else if (parts.length === 3) timeLeft = parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
        }

        return {
            matrix,
            boardEl,
            isWhiteBottom: info.isWhiteBottom,
            myColor: info.myColor,
            turn: info.turn,
            isMyTurn: info.isMyTurn,
            timeLeft
        };
    }

    // ── SVG Arrow Drawing Engine ──
    function removeOnBoardArrow() {
        const existing = document.getElementById("csp5-arrow-layer");
        if (existing) existing.remove();
        lastRenderedMove = "";
    }

    function drawOnBoardArrow(boardEl, uciMove, isWhiteBottom) {
        if (!isPermittedStudyPage()) {
            removeOnBoardArrow();
            return;
        }
        if (!boardEl || !uciMove || uciMove.length < 4) {
            removeOnBoardArrow();
            return;
        }

        const existingLayer = document.getElementById("csp5-arrow-layer");
        if (uciMove === lastRenderedMove && existingLayer) {
            const rect = boardEl.getBoundingClientRect();
            Object.assign(existingLayer.style, {
                position: "fixed",
                top: rect.top + "px",
                left: rect.left + "px",
                width: rect.width + "px",
                height: rect.height + "px",
                pointerEvents: "none",
                zIndex: "2147483647",
                overflow: "visible",
                margin: "0",
                transform: "none"
            });
            return;
        }

        const fromCol = uciMove.charCodeAt(0) - 97; // 0..7
        const fromRank = parseInt(uciMove[1], 10);   // 1..8
        const toCol = uciMove.charCodeAt(2) - 97;   // 0..7
        const toRank = parseInt(uciMove[3], 10);     // 1..8

        const col1 = isWhiteBottom ? fromCol : (7 - fromCol);
        const row1 = isWhiteBottom ? (8 - fromRank) : (fromRank - 1);
        const col2 = isWhiteBottom ? toCol : (7 - toCol);
        const row2 = isWhiteBottom ? (8 - toRank) : (toRank - 1);

        const x1 = (col1 + 0.5) * 12.5;
        const y1 = (row1 + 0.5) * 12.5;
        const x2 = (col2 + 0.5) * 12.5;
        const y2 = (row2 + 0.5) * 12.5;

        const targetX = col2 * 12.5;
        const targetY = row2 * 12.5;

        const dx = x2 - x1;
        const dy = y2 - y1;
        const angle = Math.atan2(dy, dx);
        
        const headLen = 3.6;
        const headWidth = 2.4;
        const shaftEndX = x2 - (headLen * 0.7) * Math.cos(angle);
        const shaftEndY = y2 - (headLen * 0.7) * Math.sin(angle);

        const leftX = x2 - headLen * Math.cos(angle) + headWidth * Math.sin(angle);
        const leftY = y2 - headLen * Math.sin(angle) - headWidth * Math.cos(angle);
        const rightX = x2 - headLen * Math.cos(angle) - headWidth * Math.sin(angle);
        const rightY = y2 - headLen * Math.sin(angle) + headWidth * Math.cos(angle);

        const boardRect = boardEl.getBoundingClientRect();
        if (!boardRect.width || !boardRect.height || !document.body) {
            removeOnBoardArrow();
            return;
        }

        // A document-level fixed SVG avoids being hidden inside Chess.com's board component.
        let svg = document.getElementById("csp5-arrow-layer");
        if (!svg) {
            svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.id = "csp5-arrow-layer";
            document.body.appendChild(svg);
        }
        Object.assign(svg.style, {
            position: "fixed",
            top: boardRect.top + "px",
            left: boardRect.left + "px",
            width: boardRect.width + "px",
            height: boardRect.height + "px",
            pointerEvents: "none",
            zIndex: "2147483647",
            overflow: "visible",
            margin: "0",
            transform: "none"
        });
        svg.setAttribute("viewBox", "0 0 100 100");

        svg.innerHTML = `
            <defs>
                <filter id="csp5-glow" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="0" stdDeviation="0.8" flood-color="#00f0ff" flood-opacity="0.95" />
                </filter>
            </defs>
            <!-- Target square highlight -->
            <rect x="${targetX}" y="${targetY}" width="12.5" height="12.5"
                  fill="#00f0ff" fill-opacity="0.28" rx="1.5" />
            <!-- Start point circle -->
            <circle cx="${x1}" cy="${y1}" r="1.8" fill="#00f0ff" opacity="0.9" filter="url(#csp5-glow)" />
            <!-- Arrow shaft -->
            <line x1="${x1}" y1="${y1}" x2="${shaftEndX}" y2="${shaftEndY}"
                  stroke="#00f0ff" stroke-width="1.8" stroke-linecap="round"
                  opacity="0.92" filter="url(#csp5-glow)" />
            <!-- Arrow head -->
            <polygon points="${x2},${y2} ${leftX},${leftY} ${rightX},${rightY}"
                     fill="#00f0ff" opacity="0.95" filter="url(#csp5-glow)" />
        `;

        lastRenderedMove = uciMove;
    }

    // ── Continuous Best Move Poller for Active Turn ──
    function fetchAndDrawBestMove(boardEl, isWhiteBottom) {
        sendBridgeRequest(BEST_MOVE_URL, "GET", null, (err, res) => {
            if (!err && res && (res.status === "ok" || res.best_move !== undefined)) {
                if (res.is_my_turn && res.best_move) {
                    currentBestMove = res.best_move;
                    drawOnBoardArrow(boardEl, res.best_move, isWhiteBottom);
                    setBadge("turn", `${res.san || res.best_move} (${res.score})`);
                } else if (!res.is_my_turn) {
                    removeOnBoardArrow();
                    setBadge("waiting", "WAITING FOR OPPONENT");
                }
            }
        });
    }

    // ── Main Scan Loop ──
    function scanAndSync() {
        if (!isPermittedStudyPage()) {
            removeOnBoardArrow();
            currentBestMove = "";
            badge.style.display = "none";
            return;
        }
        badge.style.display = "block";
        const data = readChessCom();
        if (!data) return;

        const matrixStr = JSON.stringify(data.matrix) + `:${data.turn}:${data.isMyTurn}`;

        if (matrixStr !== lastSentMatrixStr) {
            lastSentMatrixStr = matrixStr;
            currentBestMove = "";
            removeOnBoardArrow();

            const payload = {
                matrix: data.matrix,
                is_white_bottom: data.isWhiteBottom,
                turn: data.turn,
                is_my_turn: data.isMyTurn,
                time_left: data.timeLeft,
                platform: "Chess.com"
            };

            sendBridgeRequest(BRIDGE_URL, "POST", payload, (err, res) => {
                if (!err && res && res.status === "ok") {
                    if (data.isMyTurn) {
                        if (res.best_move) {
                            currentBestMove = res.best_move;
                            drawOnBoardArrow(data.boardEl, res.best_move, data.isWhiteBottom);
                            setBadge("turn", `${res.san || res.best_move} (${res.score})`);
                        } else {
                            setBadge("turn", "COMPUTING BEST MOVE...");
                        }
                    } else {
                        removeOnBoardArrow();
                        setBadge("waiting", "WAITING FOR OPPONENT");
                    }
                }
            });
        }

        // If it's my turn and arrow hasn't rendered yet, poll bridge for engine output
        if (data.isMyTurn) {
            if (!currentBestMove) {
                fetchAndDrawBestMove(data.boardEl, data.isWhiteBottom);
            }
        } else {
            removeOnBoardArrow();
            setBadge("waiting", "WAITING FOR OPPONENT");
        }
    }

    setInterval(scanAndSync, SCAN_INTERVAL_MS);
})();
