(async function() {
    // This adapter is intentionally limited to explicit study / analysis pages.
    // It does not read live-match boards or provide move suggestions during live play.
    const isPermittedStudyPage = () => {
        const host = window.location.hostname.toLowerCase();
        const path = window.location.pathname.toLowerCase();
        const isChessCom = host === "chess.com" || host.endsWith(".chess.com");
        const isLichess = host === "lichess.org" || host.endsWith(".lichess.org");
        return (isChessCom && /^\/analysis(?:\/|$)/.test(path)) ||
               (isLichess && (/^\/analysis(?:\/|$)/.test(path) || /^\/study(?:\/|$)/.test(path)));
    };

    if (!isPermittedStudyPage()) {
        console.info("Chess Helper: disabled outside study / analysis pages.");
        return;
    }

    // Use the page's standard APIs; no isolated-frame bypass.
    const nativeFetch = window.fetch.bind(window);
    const nativeSetTimeout = window.setTimeout.bind(window);

    // Check if the local Python server is authenticated (license is active)
    async function checkAuth() {
        try {
            const response = await nativeFetch("http://127.0.0.1:5005/auth", {
                method: "GET",
                mode: "cors",
                credentials: "omit"
            });
            if (response.ok) {
                const data = await response.json();
                return data.status === "authenticated";
            }
        } catch (e) {
            // Local server offline or not running
        }
        return false;
    }

    const isAuthed = await checkAuth();
    if (!isAuthed) {
        console.log("Chess Helper: Unauthorized or App not running. Subscription key required.");
        return;
    }

    console.log("Chess Helper: License Verified. Stealth DOM Reader started.");

    // Detect which platform we are on
    const isLichess = window.location.hostname.includes("lichess.org");
    const isChessCom = window.location.hostname.includes("chess.com");

    // Caching state to minimize reflows and HTTP spam
    let cached_is_white_bottom = null;
    let framesSinceOrientationCheck = 0;
    let lastSentMatrixStr = "";
    let lastSentIsWhiteBottom = null;
    let lastSentTimeLeft = null;
    
    // ====================================================================
    //  Turn & Perspective Detector for Chess.com
    // ====================================================================
    function detectTurnChessCom(boardEl) {
        const isFlipped = boardEl.classList.contains('flipped') || !!document.querySelector('.board.flipped');
        const isWhiteBottom = !isFlipped;
        const myColor = isWhiteBottom ? 'w' : 'b';

        let detectedTurn = null;
        const boardRoot = boardEl.shadowRoot || boardEl;
        const highlights = boardRoot.querySelectorAll('.highlight');
        if (highlights && highlights.length >= 2) {
            for (let i = 0; i < highlights.length; i++) {
                const hl = highlights[i];
                let sqCoord = "";
                hl.classList.forEach(c => {
                    if (c.startsWith("square-")) sqCoord = c;
                });
                if (sqCoord) {
                    const piece = boardRoot.querySelector(`.piece.${sqCoord}`);
                    if (piece) {
                        piece.classList.forEach(c => {
                            if (c.length === 2 && ['p', 'n', 'b', 'r', 'q', 'k'].includes(c[1].toLowerCase())) {
                                if (c[0] === 'w') detectedTurn = 'b';
                                else if (c[0] === 'b') detectedTurn = 'w';
                            }
                        });
                    }
                }
                if (detectedTurn) break;
            }
        }

        if (!detectedTurn) {
            const moveNodes = document.querySelectorAll('wc-vertical-move-list .node, .vertical-move-list-component .node, .move-list-row .node');
            if (moveNodes && moveNodes.length > 0) {
                const lastNode = moveNodes[moveNodes.length - 1];
                if (lastNode.classList.contains('white') || lastNode.closest('.white')) detectedTurn = 'b';
                else if (lastNode.classList.contains('black') || lastNode.closest('.black')) detectedTurn = 'w';
            }
        }

        if (!detectedTurn) detectedTurn = 'w';

        const isMyTurn = (detectedTurn === myColor);
        return { isWhiteBottom, myColor, turn: detectedTurn, isMyTurn };
    }

    // ====================================================================
    //  Chess.com Board Reader
    // ====================================================================
    function readBoardChessCom() {
        if (!isPermittedStudyPage()) {
            removeOnBoardArrow();
            nativeSetTimeout(readBoardChessCom, 350);
            return;
        }
        const boardEl = document.querySelector('wc-chess-board') || document.querySelector('.board');
        if (!boardEl) {
            nativeSetTimeout(readBoardChessCom, 150);
            return;
        }

        const boardRoot = boardEl.shadowRoot || boardEl;
        let pieces = boardRoot.querySelectorAll('.piece, piece, [class*="piece "]');
        if (!pieces.length) {
            pieces = boardEl.querySelectorAll('.piece');
        }
        if (!pieces.length) {
            nativeSetTimeout(readBoardChessCom, 100);
            return;
        }

        const turnInfo = detectTurnChessCom(boardEl);
        const is_white_bottom = turnInfo.isWhiteBottom;

        let boardArray = Array(8).fill("").map(() => Array(8).fill(""));

        pieces.forEach(p => {
            let classes = Array.from(p.classList || p.className.split(' '));
            let colorType = classes.find(c => c.length === 2 && (c[0]==='w' || c[0]==='b') && ['p', 'n', 'b', 'r', 'q', 'k'].includes(c[1].toLowerCase()));
            let sqClass = classes.find(c => c.startsWith('square-'));
            let file = 0, rank = 0;
            
            if (sqClass) {
                let coordPart = sqClass.replace('square-', '');
                if (coordPart.length === 2) {
                    file = parseInt(coordPart[0], 10);
                    rank = parseInt(coordPart[1], 10);
                } else if (coordPart.length === 4) {
                    file = parseInt(coordPart.substring(0, 2), 10);
                    rank = parseInt(coordPart.substring(2, 4), 10);
                }
            } else {
                let dataSq = p.getAttribute('data-square');
                if (dataSq && /^[a-h][1-8]$/.test(dataSq)) {
                    file = dataSq.charCodeAt(0) - 96;
                    rank = parseInt(dataSq[1], 10);
                }
            }

            if (colorType && file >= 1 && file <= 8 && rank >= 1 && rank <= 8) {
                let r = 8 - rank;
                let c = file - 1;
                let char = colorType[1];
                if (colorType[0] === 'w') char = char.toUpperCase();
                boardArray[r][c] = char;
            }
        });
        
        let timeLeft = 300; 
        let clockEl = document.querySelector('.player-component.bottom .clock-component, #player-bottom .clock-time-component, .clock-bottom');
        if (clockEl) {
            let timeText = clockEl.textContent.trim();
            if (timeText) {
                let parts = timeText.split(':');
                if (parts.length === 2) {
                    let min = parseInt(parts[0], 10);
                    let sec = parseFloat(parts[1]);
                    if (!isNaN(min) && !isNaN(sec)) timeLeft = min * 60 + sec;
                } else if (parts.length === 3) {
                    let hr = parseInt(parts[0], 10);
                    let min = parseInt(parts[1], 10);
                    let sec = parseFloat(parts[2]);
                    if (!isNaN(hr) && !isNaN(min) && !isNaN(sec)) timeLeft = hr * 3600 + min * 60 + sec;
                } else {
                    let sec = parseFloat(timeText);
                    if (!isNaN(sec)) timeLeft = sec;
                }
            }
        }
 
        sendBoardState(boardArray, is_white_bottom, timeLeft, turnInfo.turn, turnInfo.isMyTurn, boardEl);
        
        nativeSetTimeout(readBoardChessCom, 100);
    }

    // ====================================================================
    //  Lichess.org Board Reader
    // ====================================================================
    function readBoardLichess() {
        if (!isPermittedStudyPage()) {
            removeOnBoardArrow();
            nativeSetTimeout(readBoardLichess, 350);
            return;
        }
        let boardArray = Array(8).fill("").map(() => Array(8).fill(""));

        // Lichess renders pieces as <piece> elements inside cg-board
        const cgBoard = document.querySelector('cg-board');
        if (!cgBoard) {
            nativeSetTimeout(readBoardLichess, 200);
            return;
        }

        const pieces = cgBoard.querySelectorAll('piece');
        if (!pieces.length) {
            nativeSetTimeout(readBoardLichess, 100);
            return;
        }

        // Detect board orientation: Lichess adds class 'orientation-white' or 'orientation-black' on parent
        let is_white_bottom = true;
        if (cached_is_white_bottom !== null && framesSinceOrientationCheck < 30) {
            is_white_bottom = cached_is_white_bottom;
            framesSinceOrientationCheck++;
        } else {
            framesSinceOrientationCheck = 0;
            const boardWrap = document.querySelector('.cg-wrap');
            if (boardWrap) {
                if (boardWrap.classList.contains('orientation-black')) {
                    is_white_bottom = false;
                } else {
                    is_white_bottom = true;
                }
            }
            cached_is_white_bottom = is_white_bottom;
        }

        // Get board dimensions for coordinate calculation
        const boardRect = cgBoard.getBoundingClientRect();
        const boardWidth = boardRect.width;
        const boardHeight = boardRect.height;
        const squareWidth = boardWidth / 8;
        const squareHeight = boardHeight / 8;

        // Piece class mapping for Lichess: class contains color (white/black) and role (king/queen/rook etc.)
        const roleMap = {
            'king': 'k', 'queen': 'q', 'rook': 'r',
            'bishop': 'b', 'knight': 'n', 'pawn': 'p'
        };

        pieces.forEach(p => {
            const classes = Array.from(p.classList);
            const isWhitePiece = classes.includes('white');
            const isBlackPiece = classes.includes('black');
            if (!isWhitePiece && !isBlackPiece) return;

            // Determine piece type from class
            let pieceChar = '';
            for (const [role, char] of Object.entries(roleMap)) {
                if (classes.includes(role)) {
                    pieceChar = isWhitePiece ? char.toUpperCase() : char;
                    break;
                }
            }
            if (!pieceChar) return;

            // Get position from CSS transform: translate(Xpx, Ypx)
            const style = p.style.transform || p.getAttribute('style') || '';
            const translateMatch = style.match(/translate\(\s*([\d.]+)px\s*,\s*([\d.]+)px\s*\)/);
            if (!translateMatch) return;

            const pixelX = parseFloat(translateMatch[1]);
            const pixelY = parseFloat(translateMatch[2]);

            // Convert pixel coordinates to board col/row (0-7)
            let col = Math.round(pixelX / squareWidth);
            let row = Math.round(pixelY / squareHeight);

            // Clamp to valid range
            col = Math.max(0, Math.min(7, col));
            row = Math.max(0, Math.min(7, row));

            // Lichess renders from white's perspective by default:
            // translate(0, 0) = a8, translate(7*sq, 7*sq) = h1
            // If black bottom, the coordinates are flipped
            if (!is_white_bottom) {
                col = 7 - col;
                row = 7 - row;
            }

            boardArray[row][col] = pieceChar;
        });

        // Parse remaining time from Lichess clocks
        let timeLeft = 300;
        // Lichess clock: bottom player's clock has class 'rclock-bottom' or the 2nd .rclock
        let clockEl = document.querySelector('.rclock-bottom .time, .rclock.rclock-bottom time');
        if (!clockEl) {
            // Fallback: try to find clocks by general selectors
            const clocks = document.querySelectorAll('.rclock time, .clock');
            if (clocks.length > 0) {
                clockEl = clocks[clocks.length - 1];
            }
        }
        if (clockEl) {
            let timeText = clockEl.textContent.trim();
            if (timeText) {
                let parts = timeText.split(':');
                if (parts.length === 2) {
                    let min = parseInt(parts[0], 10);
                    let sec = parseFloat(parts[1]);
                    if (!isNaN(min) && !isNaN(sec)) timeLeft = min * 60 + sec;
                } else if (parts.length === 3) {
                    let hr = parseInt(parts[0], 10);
                    let min = parseInt(parts[1], 10);
                    let sec = parseFloat(parts[2]);
                    if (!isNaN(hr) && !isNaN(min) && !isNaN(sec)) timeLeft = hr * 3600 + min * 60 + sec;
                } else {
                    let sec = parseFloat(timeText);
                    if (!isNaN(sec)) timeLeft = sec;
                }
            }
        }

        sendBoardState(boardArray, is_white_bottom, timeLeft, "w", true, cgBoard);

        let bulletSpeedDelay = Math.floor(Math.random() * 20) + 70;
        nativeSetTimeout(readBoardLichess, bulletSpeedDelay);
    }

    // ====================================================================
    //  Tactical Arrow Overlay on Board
    // ====================================================================
    let lastRenderedMove = "";
    let currentBestMove = "";

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

        const renderKey = `${uciMove}:${isWhiteBottom ? "white" : "black"}`;
        const currentLayer = document.getElementById("csp5-arrow-layer");
        if (renderKey === lastRenderedMove && currentLayer) {
            const rect = boardEl.getBoundingClientRect();
            Object.assign(currentLayer.style, {
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

        const fromCol = uciMove.charCodeAt(0) - 97;
        const fromRank = parseInt(uciMove[1], 10);
        const toCol = uciMove.charCodeAt(2) - 97;
        const toRank = parseInt(uciMove[3], 10);

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

        // Mount at document level instead of inside Chess.com's custom element.
        // Some board implementations use Shadow DOM and discard un-slotted children.
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
            <rect x="${targetX}" y="${targetY}" width="12.5" height="12.5"
                  fill="#00f0ff" fill-opacity="0.28" rx="1.5" />
            <circle cx="${x1}" cy="${y1}" r="1.8" fill="#00f0ff" opacity="0.9" filter="url(#csp5-glow)" />
            <line x1="${x1}" y1="${y1}" x2="${shaftEndX}" y2="${shaftEndY}"
                  stroke="#00f0ff" stroke-width="1.8" stroke-linecap="round"
                  opacity="0.92" filter="url(#csp5-glow)" />
            <polygon points="${x2},${y2} ${leftX},${leftY} ${rightX},${rightY}"
                     fill="#00f0ff" opacity="0.95" filter="url(#csp5-glow)" />
        `;

        lastRenderedMove = renderKey;
    }

    // ====================================================================
    //  Shared: Throttled POST to Python backend + Arrow Sync
    // ====================================================================
    function sendBoardState(boardArray, is_white_bottom, timeLeft, turn = "w", isMyTurn = true, boardEl = null) {
        if (!isPermittedStudyPage()) {
            removeOnBoardArrow();
            return;
        }
        let matrixStr = JSON.stringify(boardArray) + `:${turn}:${isMyTurn}`;
        
        let shouldSend = (matrixStr !== lastSentMatrixStr) || (is_white_bottom !== lastSentIsWhiteBottom);
                           
        if (shouldSend) {
            lastSentMatrixStr = matrixStr;
            lastSentIsWhiteBottom = is_white_bottom;
            currentBestMove = "";
            removeOnBoardArrow();

            nativeFetch("http://127.0.0.1:5005", {
                method: "POST",
                mode: "cors",
                credentials: "omit",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ 
                    matrix: boardArray, 
                    is_white_bottom: is_white_bottom,
                    turn: turn,
                    is_my_turn: isMyTurn,
                    time_left: timeLeft,
                    platform: "Chess.com"
                })
            })
            .then(r => r.json())
            .then(data => {
                if (data && data.is_my_turn && data.best_move && boardEl) {
                    currentBestMove = data.best_move;
                    drawOnBoardArrow(boardEl, data.best_move, is_white_bottom);
                }
            })
            .catch(e => {});
        }

        if (isMyTurn && boardEl) {
            if (!currentBestMove) {
                nativeFetch("http://127.0.0.1:5005/bestmove", {
                    method: "GET",
                    mode: "cors",
                    credentials: "omit"
                })
                .then(r => r.json())
                .then(data => {
                    if (data && data.is_my_turn && data.best_move) {
                        currentBestMove = data.best_move;
                        drawOnBoardArrow(boardEl, data.best_move, is_white_bottom);
                    }
                })
                .catch(e => {});
            }
        } else {
            removeOnBoardArrow();
        }
    }

    // Start the appropriate reader based on hostname
    if (isLichess) {
        console.log("Chess Helper: Lichess.org detected. Starting Lichess reader.");
        readBoardLichess();
    } else {
        console.log("Chess Helper: Chess.com detected. Starting Chess.com reader.");
        readBoardChessCom();
    }
})();
