"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluatePosition = evaluatePosition;
exports.searchBestMove = searchBestMove;
const chess_js_1 = require("chess.js");
const PIECE_VAL = {
    p: 1,
    n: 2.5,
    b: 3,
    r: 4.5,
    q: 20,
    k: 50000,
};
const PST = {
    p: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 1, 0, 0, 0],
        [0, 1, 2, 2, 2, 2, 1, 0],
        [1, 2, 3, 3, 3, 3, 2, 1],
        [1, 2, 3, 4, 4, 3, 2, 1],
        [2, 3, 4, 5, 5, 4, 3, 2],
        [3, 4, 5, 6, 6, 5, 4, 3],
        [7, 7, 7, 7, 7, 7, 7, 7],
    ],
    n: [
        [0, 1, 2, 2, 2, 2, 1, 0],
        [1, 3, 4, 4, 4, 4, 3, 1],
        [2, 4, 6, 6, 6, 6, 4, 2],
        [2, 4, 6, 7, 7, 6, 4, 2],
        [2, 4, 6, 7, 7, 6, 4, 2],
        [2, 4, 6, 6, 6, 6, 4, 2],
        [1, 3, 4, 4, 4, 4, 3, 1],
        [0, 1, 2, 2, 2, 2, 1, 0],
    ],
    b: [
        [0, 1, 1, 2, 2, 1, 1, 0],
        [1, 2, 3, 3, 3, 3, 2, 1],
        [1, 3, 4, 4, 4, 4, 3, 1],
        [2, 3, 4, 5, 5, 4, 3, 2],
        [2, 3, 4, 5, 5, 4, 3, 2],
        [1, 3, 4, 4, 4, 4, 3, 1],
        [1, 2, 3, 3, 3, 3, 2, 1],
        [0, 1, 1, 2, 2, 1, 1, 0],
    ],
    r: [
        [0, 0, 1, 2, 2, 1, 0, 0],
        [0, 1, 2, 3, 3, 2, 1, 0],
        [0, 1, 2, 3, 3, 2, 1, 0],
        [0, 1, 2, 3, 3, 2, 1, 0],
        [0, 1, 2, 3, 3, 2, 1, 0],
        [0, 1, 2, 3, 3, 2, 1, 0],
        [0, 1, 2, 3, 3, 2, 1, 0],
        [0, 0, 1, 2, 2, 1, 0, 0],
    ],
    q: [
        [0, 0, 1, 1, 1, 1, 0, 0],
        [0, 1, 2, 2, 2, 2, 1, 0],
        [1, 2, 3, 3, 3, 3, 2, 1],
        [1, 2, 3, 4, 4, 3, 2, 1],
        [1, 2, 3, 4, 4, 3, 2, 1],
        [1, 2, 3, 3, 3, 3, 2, 1],
        [0, 1, 2, 2, 2, 2, 1, 0],
        [0, 0, 1, 1, 1, 1, 0, 0],
    ],
    k: [
        [2, 2, 1, 0, 0, 1, 2, 2],
        [2, 2, 1, 0, 0, 1, 2, 2],
        [1, 1, 0, 0, 0, 0, 1, 1],
        [0, 0, 0, -1, -1, 0, 0, 0],
        [0, 0, 0, -1, -1, 0, 0, 0],
        [1, 1, 0, 0, 0, 0, 1, 1],
        [2, 2, 1, 0, 0, 1, 2, 2],
        [2, 2, 1, 0, 0, 1, 2, 2],
    ],
};
// ---------------------------
// 🔹 EVALUATION FUNCTION
// ---------------------------
function evaluatePosition(fen) {
    console.log('[evaluatePosition] Evaluating position for FEN:', fen);
    let chess;
    try {
        chess = new chess_js_1.Chess(fen);
    }
    catch (error) {
        console.error('[evaluatePosition] Error creating Chess object from fen:', error);
        throw new Error(`[evaluatePosition] Invalid FEN: ${fen}`);
    }
    // 🧩 Terminal conditions
    try {
        if (chess.isCheckmate()) {
            console.log('[evaluatePosition] Checkmate detected.');
            return chess.turn() === 'b' ? -1e6 : 1e6;
        }
        if (chess.isDraw() ||
            chess.isStalemate() ||
            chess.isThreefoldRepetition() ||
            chess.isInsufficientMaterial()) {
            console.log('[evaluatePosition] Drawish terminal state detected.');
            return 0;
        }
    }
    catch (err) {
        console.error('[evaluatePosition] Error during terminal evaluation:', err);
        throw err;
    }
    const mirror = (i) => 7 - i;
    let score = 0;
    let board;
    try {
        board = chess.board();
    }
    catch (err) {
        console.error('[evaluatePosition] Error getting board:', err);
        throw err;
    }
    // Helper: convert board indices -> algebraic like "e4"
    const indexToSquare = (r, f) => `${String.fromCharCode(97 + f)}${8 - r}`;
    // Helper: get legal moves for a specific square for a given color by forcing the side-to-move in a temp FEN
    const getLegalMovesForSquare = (pieceColor, r, f) => {
        const sq = indexToSquare(r, f);
        try {
            const fenParts = chess.fen().split(' ');
            fenParts[1] = pieceColor; // set side to move
            const tmpChess = new chess_js_1.Chess(fenParts.join(' '));
            // chess.js expects the square as type Square (e.g., "e4"), not string literal
            // so must cast sq as Square to match type signature
            return tmpChess.moves({ square: sq, verbose: true }) || [];
        }
        catch (err) {
            return [];
        }
    };
    // Helper: detect attacks to a target square by scanning board (knights, pawns, sliders, king)
    const isAttackedBy = (attackerColor, tr, tf) => {
        // knight attacks
        const knightOffsets = [
            [2, 1],
            [1, 2],
            [-1, 2],
            [-2, 1],
            [-2, -1],
            [-1, -2],
            [1, -2],
            [2, -1],
        ];
        for (const [dr, df] of knightOffsets) {
            const r = tr + dr, f = tf + df;
            if (r >= 0 && r < 8 && f >= 0 && f < 8) {
                const s = board[r][f];
                if (s && s.color === attackerColor && s.type === 'n')
                    return true;
            }
        }
        // pawn attacks (attacker pawns that attack tr,tf)
        const pawnDir = attackerColor === 'w' ? -1 : 1;
        for (const df of [-1, 1]) {
            const pr = tr - pawnDir, pf = tf - df;
            if (pr >= 0 && pr < 8 && pf >= 0 && pf < 8) {
                const s = board[pr][pf];
                if (s && s.color === attackerColor && s.type === 'p')
                    return true;
            }
        }
        // king adjacency
        for (let dr = -1; dr <= 1; dr++)
            for (let df = -1; df <= 1; df++) {
                if (dr === 0 && df === 0)
                    continue;
                const r = tr + dr, f = tf + df;
                if (r >= 0 && r < 8 && f >= 0 && f < 8) {
                    const s = board[r][f];
                    if (s && s.color === attackerColor && s.type === 'k')
                        return true;
                }
            }
        // sliders: rooks/queens on straight lines
        const straightDirs = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
        ];
        for (const [dr, df] of straightDirs) {
            let r = tr + dr, f = tf + df;
            while (r >= 0 && r < 8 && f >= 0 && f < 8) {
                const s = board[r][f];
                if (s) {
                    if (s.color === attackerColor && (s.type === 'r' || s.type === 'q'))
                        return true;
                    break;
                }
                r += dr;
                f += df;
            }
        }
        // sliders: bishops/queens on diagonals
        const diagDirs = [
            [1, 1],
            [1, -1],
            [-1, 1],
            [-1, -1],
        ];
        for (const [dr, df] of diagDirs) {
            let r = tr + dr, f = tf + df;
            while (r >= 0 && r < 8 && f >= 0 && f < 8) {
                const s = board[r][f];
                if (s) {
                    if (s.color === attackerColor && (s.type === 'b' || s.type === 'q'))
                        return true;
                    break;
                }
                r += dr;
                f += df;
            }
        }
        return false;
    };
    // -------------------------
    // 🧩 Material + PST
    // -------------------------
    try {
        for (let rank = 0; rank < 8; rank++) {
            for (let file = 0; file < 8; file++) {
                const square = board[rank][file];
                if (!square)
                    continue;
                const type = square.type;
                const baseValue = PIECE_VAL[type];
                const pstBonus = square.color === 'w'
                    ? PST[type][mirror(rank)][file]
                    : PST[type][rank][mirror(file)];
                const pieceValue = baseValue + 0.1 * pstBonus;
                score += square.color === 'b' ? pieceValue : -pieceValue;
            }
        }
    }
    catch (err) {
        console.error('[evaluatePosition] Error during Material + PST calculation:', err);
        throw err;
    }
    // -------------------------
    // 🧩 Pair of bishops (you had a placeholder — keep or extend as needed)
    // -------------------------
    try {
        // simple bishop pair bonus
        let bCount = { w: 0, b: 0 };
        for (let r = 0; r < 8; r++)
            for (let f = 0; f < 8; f++) {
                const s = board[r][f];
                if (s && s.type === 'b')
                    bCount[s.color]++;
            }
        if (bCount.b >= 2)
            score += 0.25;
        if (bCount.w >= 2)
            score -= 0.25;
    }
    catch (err) {
        console.error('[evaluatePosition] Error in bishop-pair:', err);
        throw err;
    }
    // -------------------------
    // 🧩 Rook file control
    // -------------------------
    const fileHasPawn = (color, file) => {
        for (let r = 0; r < 8; r++) {
            const s = board[r][file];
            if (s && s.type === 'p' && s.color === color)
                return true;
        }
        return false;
    };
    try {
        for (let file = 0; file < 8; file++) {
            const whitePawn = fileHasPawn('w', file);
            const blackPawn = fileHasPawn('b', file);
            const open = !whitePawn && !blackPawn;
            const semiOpenW = !whitePawn && blackPawn;
            const semiOpenB = !blackPawn && whitePawn;
            for (let rank = 0; rank < 8; rank++) {
                const s = board[rank][file];
                if (!s || s.type !== 'r')
                    continue;
                if (s.color === 'b') {
                    if (open)
                        score += 0.35;
                    else if (semiOpenB)
                        score += 0.2;
                }
                else {
                    if (open)
                        score -= 0.35;
                    else if (semiOpenW)
                        score -= 0.2;
                }
            }
        }
    }
    catch (err) {
        console.error('[evaluatePosition] Error in rook file control:', err);
        throw err;
    }
    // -------------------------
    // 🧩 Center control
    // -------------------------
    try {
        for (const [r, f] of [
            [3, 3],
            [3, 4],
            [4, 3],
            [4, 4],
        ]) {
            const s = board[r][f];
            if (s)
                score += s.color === 'b' ? 0.15 : -0.15;
        }
    }
    catch (err) {
        console.error('[evaluatePosition] Error evaluating center control:', err);
        throw err;
    }
    // -------------------------
    // 🧩 King pawn shield
    // -------------------------
    const kingPos = (color) => {
        for (let r = 0; r < 8; r++)
            for (let f = 0; f < 8; f++) {
                const s = board[r][f];
                if (s && s.type === 'k' && s.color === color)
                    return [r, f];
            }
        return null;
    };
    const wKing = kingPos('w');
    const bKing = kingPos('b');
    const pawnShieldPenalty = (color, k) => {
        if (!k)
            return 0;
        const [r, f] = k;
        const dir = color === 'w' ? 1 : -1;
        let shield = 0;
        for (const df of [-1, 0, 1]) {
            const rr = r + dir, ff = f + df;
            if (rr >= 0 && rr < 8 && ff >= 0 && ff < 8) {
                const s = board[rr][ff];
                if (s && s.type === 'p' && s.color === color)
                    shield++;
            }
        }
        return (3 - shield) * 0.15;
    };
    try {
        score += pawnShieldPenalty('b', bKing);
        score -= pawnShieldPenalty('w', wKing);
    }
    catch (err) {
        console.error('[evaluatePosition] Error evaluating pawn shield:', err);
        throw err;
    }
    // -------------------------
    // 🧩 Batteries (aligned heavy pieces)
    // -------------------------
    const isClearLine = (r1, f1, r2, f2) => {
        const dr = Math.sign(r2 - r1), df = Math.sign(f2 - f1);
        let r = r1 + dr, f = f1 + df;
        while (r !== r2 || f !== f2) {
            if (board[r][f])
                return false;
            r += dr;
            f += df;
        }
        return true;
    };
    const addBatteryBonus = (color, bonus) => {
        const pieces = [];
        for (let r = 0; r < 8; r++)
            for (let f = 0; f < 8; f++) {
                const s = board[r][f];
                if (s &&
                    s.color === color &&
                    (s.type === 'r' || s.type === 'b' || s.type === 'q'))
                    pieces.push({ r, f, t: s.type });
            }
        for (let i = 0; i < pieces.length; i++)
            for (let j = i + 1; j < pieces.length; j++) {
                const a = pieces[i], b = pieces[j];
                const sameRank = a.r === b.r, sameFile = a.f === b.f, sameDiag = Math.abs(a.r - b.r) === Math.abs(a.f - b.f);
                const compatible = sameRank || sameFile
                    ? a.t === 'r' || b.t === 'r' || a.t === 'q' || b.t === 'q'
                    : sameDiag
                        ? a.t === 'b' || b.t === 'b' || a.t === 'q' || b.t === 'q'
                        : false;
                if (!compatible)
                    continue;
                if (isClearLine(a.r, a.f, b.r, b.f))
                    score += color === 'b' ? bonus : -bonus;
            }
    };
    try {
        addBatteryBonus('b', 0.25);
        addBatteryBonus('w', 0.25);
    }
    catch (err) {
        console.error('[evaluatePosition] Error adding battery bonus:', err);
        throw err;
    }
    // -------------------------
    // 🧩 Discovered attack potential
    // -------------------------
    const addDiscoveredBonus = (color, bonus) => {
        const dirsR = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
        ];
        const dirsB = [
            [1, 1],
            [1, -1],
            [-1, 1],
            [-1, -1],
        ];
        const sliders = [];
        for (let r = 0; r < 8; r++)
            for (let f = 0; f < 8; f++) {
                const s = board[r][f];
                if (!s || s.color !== color)
                    continue;
                if (s.type === 'r' || s.type === 'q')
                    sliders.push({ r, f, dirs: dirsR });
                if (s.type === 'b' || s.type === 'q')
                    sliders.push({ r, f, dirs: dirsB });
            }
        for (const sl of sliders) {
            for (const [dr, df] of sl.dirs) {
                let r = sl.r + dr, f = sl.f + df, blockers = 0;
                while (r >= 0 && r < 8 && f >= 0 && f < 8) {
                    const s = board[r][f];
                    if (s) {
                        if (s.color === color)
                            blockers++;
                        else {
                            if (blockers === 1)
                                score += color === 'b' ? bonus : -bonus;
                            break;
                        }
                    }
                    r += dr;
                    f += df;
                }
            }
        }
    };
    try {
        addDiscoveredBonus('b', 0.2);
        addDiscoveredBonus('w', 0.2);
    }
    catch (err) {
        console.error('[evaluatePosition] Error adding discovered bonus:', err);
        throw err;
    }
    // -------------------------
    // 🧩 Pawn structure (passed, doubled, isolated)
    // -------------------------
    const filesWithPawns = { w: new Set(), b: new Set() };
    const pawnCountsByFile = {
        w: Array(8).fill(0),
        b: Array(8).fill(0),
    };
    try {
        for (let r = 0; r < 8; r++)
            for (let f = 0; f < 8; f++) {
                const s = board[r][f];
                if (!s || s.type !== 'p')
                    continue;
                pawnCountsByFile[s.color][f]++;
                filesWithPawns[s.color].add(f);
                let passed = true;
                const dir = s.color === 'w' ? -1 : 1;
                for (let rr = r + dir; rr >= 0 && rr < 8; rr += dir) {
                    for (const df of [-1, 0, 1]) {
                        const ff = f + df;
                        if (ff < 0 || ff > 7)
                            continue;
                        const t = board[rr][ff];
                        if (t && t.type === 'p' && t.color !== s.color)
                            passed = false;
                    }
                }
                if (passed)
                    score += s.color === 'b' ? 0.35 : -0.35;
            }
        for (let f = 0; f < 8; f++) {
            if (pawnCountsByFile.w[f] >= 2)
                score -= 0.15;
            if (pawnCountsByFile.b[f] >= 2)
                score += 0.15;
            const isoW = !filesWithPawns.w.has(f - 1) &&
                !filesWithPawns.w.has(f + 1) &&
                pawnCountsByFile.w[f] > 0;
            const isoB = !filesWithPawns.b.has(f - 1) &&
                !filesWithPawns.b.has(f + 1) &&
                pawnCountsByFile.b[f] > 0;
            if (isoW)
                score -= 0.15;
            if (isoB)
                score += 0.15;
        }
    }
    catch (err) {
        console.error('[evaluatePosition] Error in pawn structure:', err);
        throw err;
    }
    // -------------------------
    // 🧩 Knight outposts & bad bishop
    // -------------------------
    const isPawn = (color, r, f) => {
        var _a;
        const s = (_a = board[r]) === null || _a === void 0 ? void 0 : _a[f];
        return !!(s && s.type === 'p' && s.color === color);
    };
    try {
        for (let r = 0; r < 8; r++)
            for (let f = 0; f < 8; f++) {
                const s = board[r][f];
                if (!s)
                    continue;
                if (s.type === 'n') {
                    const enemy = s.color === 'w' ? 'b' : 'w';
                    const dir = enemy === 'w' ? -1 : 1;
                    const hasEnemyPawnControl = isPawn(enemy, r - dir, f - 1) || isPawn(enemy, r - dir, f + 1);
                    if (!hasEnemyPawnControl) {
                        const centerDist = Math.min(Math.abs(3.5 - r), Math.abs(3.5 - f));
                        const bonus = 0.2 + (1.0 - Math.min(1.0, centerDist / 3)) * 0.1;
                        score += s.color === 'b' ? bonus : -bonus;
                    }
                }
                if (s.type === 'b') {
                    const dark = (r + f) % 2 === 1;
                    let sameColorPawns = 0;
                    for (let rr = 0; rr < 8; rr++)
                        for (let ff = 0; ff < 8; ff++) {
                            const t = board[rr][ff];
                            if (t && t.type === 'p' && t.color === s.color) {
                                const tDark = (rr + ff) % 2 === 1;
                                if (tDark === dark)
                                    sameColorPawns++;
                            }
                        }
                    if (sameColorPawns >= 4)
                        score += s.color === 'b' ? -0.2 : 0.2;
                }
            }
    }
    catch (err) {
        console.error('[evaluatePosition] Error in knight/bishop evaluation:', err);
        throw err;
    }
    // -------------------------
    // 🧩 King tropism
    // -------------------------
    const kingSquare = (color) => {
        for (let r = 0; r < 8; r++)
            for (let f = 0; f < 8; f++) {
                const s = board[r][f];
                if (s && s.type === 'k' && s.color === color)
                    return { r, f };
            }
        return null;
    };
    const wk = kingSquare('w'), bk = kingSquare('b');
    const tropism = (attacker, piece, r, f) => {
        const target = attacker === 'w' ? bk : wk;
        if (!target)
            return 0;
        const dist = Math.abs(target.r - r) + Math.abs(target.f - f);
        const base = piece === 'q' ? 0.06 : piece === 'r' ? 0.04 : piece === 'n' ? 0.03 : 0;
        return base * (6 - Math.min(6, dist));
    };
    try {
        for (let r = 0; r < 8; r++)
            for (let f = 0; f < 8; f++) {
                const s = board[r][f];
                if (!s)
                    continue;
                if (s.type === 'q' || s.type === 'r' || s.type === 'n') {
                    const t = tropism(s.color, s.type, r, f);
                    score += s.color === 'b' ? t : -t;
                }
            }
    }
    catch (err) {
        console.error('[evaluatePosition] Error in king tropism:', err);
        throw err;
    }
    // -------------------------
    // 🔸 NEW: Double check detection
    // -------------------------
    try {
        const analyzeDoubleCheckFor = (attacker) => {
            const victim = attacker === 'w' ? 'b' : 'w';
            const kpos = kingPos(victim);
            if (!kpos)
                return 0;
            const [kr, kf] = kpos;
            // count distinct attackers of king square by scanning (using isAttackedBy but count pieces)
            let attackers = 0;
            // check knights
            const knightOffsets = [
                [2, 1],
                [1, 2],
                [-1, 2],
                [-2, 1],
                [-2, -1],
                [-1, -2],
                [1, -2],
                [2, -1],
            ];
            for (const [dr, df] of knightOffsets) {
                const r = kr + dr, f = kf + df;
                if (r >= 0 && r < 8 && f >= 0 && f < 8) {
                    const s = board[r][f];
                    if (s && s.color === attacker && s.type === 'n')
                        attackers++;
                }
            }
            // pawns
            const pawnDir = attacker === 'w' ? -1 : 1;
            for (const df of [-1, 1]) {
                const pr = kr - pawnDir, pf = kf - df;
                if (pr >= 0 && pr < 8 && pf >= 0 && pf < 8) {
                    const s = board[pr][pf];
                    if (s && s.color === attacker && s.type === 'p')
                        attackers++;
                }
            }
            // kings (adjacent)
            for (let dr = -1; dr <= 1; dr++)
                for (let df = -1; df <= 1; df++) {
                    if (dr === 0 && df === 0)
                        continue;
                    const r = kr + dr, f = kf + df;
                    if (r >= 0 && r < 8 && f >= 0 && f < 8) {
                        const s = board[r][f];
                        if (s && s.color === attacker && s.type === 'k')
                            attackers++;
                    }
                }
            // sliders
            const straightDirs = [
                [1, 0],
                [-1, 0],
                [0, 1],
                [0, -1],
            ];
            for (const [dr, df] of straightDirs) {
                let r = kr + dr, f = kf + df;
                while (r >= 0 && r < 8 && f >= 0 && f < 8) {
                    const s = board[r][f];
                    if (s) {
                        if (s.color === attacker && (s.type === 'r' || s.type === 'q'))
                            attackers++;
                        break;
                    }
                    r += dr;
                    f += df;
                }
            }
            const diagDirs = [
                [1, 1],
                [1, -1],
                [-1, 1],
                [-1, -1],
            ];
            for (const [dr, df] of diagDirs) {
                let r = kr + dr, f = kf + df;
                while (r >= 0 && r < 8 && f >= 0 && f < 8) {
                    const s = board[r][f];
                    if (s) {
                        if (s.color === attacker && (s.type === 'b' || s.type === 'q'))
                            attackers++;
                        break;
                    }
                    r += dr;
                    f += df;
                }
            }
            return attackers >= 2 ? (attacker === 'b' ? 0.5 : -0.5) : 0;
        };
        score += analyzeDoubleCheckFor('b');
        score += analyzeDoubleCheckFor('w');
    }
    catch (err) {
        console.error('[evaluatePosition] Error detecting double checks:', err);
        throw err;
    }
    // -------------------------
    // 🔸 NEW: Pin detection
    // -------------------------
    try {
        const addPinPenalty = (color) => {
            const k = kingPos(color);
            if (!k)
                return 0;
            const [kr, kf] = k;
            let penalty = 0;
            const directions = [
                [1, 0],
                [-1, 0],
                [0, 1],
                [0, -1],
                [1, 1],
                [1, -1],
                [-1, 1],
                [-1, -1],
            ];
            for (const [dr, df] of directions) {
                let r = kr + dr, f = kf + df;
                let blocker = null;
                while (r >= 0 && r < 8 && f >= 0 && f < 8) {
                    const s = board[r][f];
                    if (s) {
                        if (s.color === color) {
                            if (!blocker)
                                blocker = { r, f };
                            else
                                break; // second friendly blocks this line
                        }
                        else {
                            // enemy piece
                            if (blocker) {
                                // is the enemy a slider that can attack along this direction?
                                const enemyType = s.type;
                                const straight = dr === 0 || df === 0;
                                const diagonal = Math.abs(dr) === Math.abs(df);
                                if (enemyType === 'q' ||
                                    (enemyType === 'r' && straight) ||
                                    (enemyType === 'b' && diagonal)) {
                                    // a pinned friendly piece
                                    penalty += color === 'b' ? -0.3 : 0.3;
                                }
                            }
                            break;
                        }
                    }
                    r += dr;
                    f += df;
                }
            }
            return penalty;
        };
        score += addPinPenalty('b');
        score += addPinPenalty('w');
    }
    catch (err) {
        console.error('[evaluatePosition] Error detecting pins:', err);
        throw err;
    }
    // -------------------------
    // 🔸 NEW: Trapped piece detection (by legal-move count)
    // -------------------------
    try {
        const addTrappedPiecePenalty = (color) => {
            let penalty = 0;
            for (let r = 0; r < 8; r++)
                for (let f = 0; f < 8; f++) {
                    const s = board[r][f];
                    if (!s || s.color !== color)
                        continue;
                    if (s.type === 'n' || s.type === 'b' || s.type === 'q') {
                        const legal = getLegalMovesForSquare(color, r, f);
                        // If a piece has very few legal moves => likely trapped or low-mobility
                        if (legal.length <= 2)
                            penalty += color === 'b' ? -0.2 : 0.2;
                    }
                }
            return penalty;
        };
        score += addTrappedPiecePenalty('b');
        score += addTrappedPiecePenalty('w');
    }
    catch (err) {
        console.error('[evaluatePosition] Error detecting trapped pieces:', err);
        throw err;
    }
    // -------------------------
    // 🔸 NEW: Knight fork detection
    // -------------------------
    try {
        const addKnightForkBonus = (color) => {
            let bonus = 0;
            const knightMoves = [
                [2, 1],
                [1, 2],
                [-1, 2],
                [-2, 1],
                [-2, -1],
                [-1, -2],
                [1, -2],
                [2, -1],
            ];
            for (let r = 0; r < 8; r++)
                for (let f = 0; f < 8; f++) {
                    const s = board[r][f];
                    if (!s || s.color !== color || s.type !== 'n')
                        continue;
                    let threats = 0;
                    for (const [dr, df] of knightMoves) {
                        const rr = r + dr, ff = f + df;
                        if (rr < 0 || rr > 7 || ff < 0 || ff > 7)
                            continue;
                        const target = board[rr][ff];
                        // count high-value targets: queen or rook (you can add pawns/minors if desired)
                        if (target &&
                            target.color !== color &&
                            (target.type === 'q' || target.type === 'r'))
                            threats++;
                        // also consider if the knight attacks king (very strong)
                        if (target && target.color !== color && target.type === 'k')
                            threats += 2;
                    }
                    // reward forks that threaten 2 or more significant targets
                    if (threats >= 2)
                        bonus += color === 'b' ? 0.4 : -0.4;
                }
            return bonus;
        };
        score += addKnightForkBonus('b');
        score += addKnightForkBonus('w');
    }
    catch (err) {
        console.error('[evaluatePosition] Error detecting knight forks:', err);
        throw err;
    }
    // -------------------------
    // 🔸 NEW: Additional pawn structure checks already above, rook/center/battery done
    // -------------------------
    // (already implemented earlier)
    console.log('[evaluatePosition] Final evaluation score:', score);
    return score;
}
// ---------------------------
// 🔹 MINIMAX + ALPHA-BETA + CACHE + REPETITION AVOIDANCE
// ---------------------------
const transpositionTable = new Map(); // cache
function minimax(chess, depth, alpha, beta, maximizing, seen = new Set()) {
    const fen = chess.fen();
    try {
        // Avoid loops — if position was seen before, return neutral score
        if (seen.has(fen)) {
            console.warn('[minimax] Avoiding repeated position for FEN:', fen);
            return 0;
        }
        // Cache lookup
        if (transpositionTable.has(fen)) {
            console.log('[minimax] Cache hit for FEN:', fen);
            return transpositionTable.get(fen);
        }
        if (depth === 0 || chess.isGameOver()) {
            const evalScore = evaluatePosition(fen);
            transpositionTable.set(fen, evalScore);
            console.log('[minimax] Leaf node at depth 0 or game over. Eval score:', evalScore, 'FEN:', fen);
            return evalScore;
        }
        seen.add(fen);
        const moves = chess.moves({ verbose: true });
        let bestEval = maximizing ? -Infinity : Infinity;
        for (const move of moves) {
            try {
                chess.move(move);
                const evalVal = minimax(chess, depth - 1, alpha, beta, !maximizing, new Set(seen));
                chess.undo();
                let adjustedEval = evalVal;
                if (move.captured)
                    adjustedEval += PIECE_VAL[move.captured] * 0.8;
                if (move.flags.includes('p'))
                    adjustedEval += 9;
                if (maximizing) {
                    bestEval = Math.max(bestEval, adjustedEval);
                    alpha = Math.max(alpha, adjustedEval);
                }
                else {
                    bestEval = Math.min(bestEval, adjustedEval);
                    beta = Math.min(beta, adjustedEval);
                }
                if (beta <= alpha) {
                    console.log('[minimax] Alpha-beta pruning at move:', move, 'alpha:', alpha, 'beta:', beta);
                    break;
                }
            }
            catch (err) {
                console.error('[minimax] Error during move search. Move:', move, 'Error:', err);
                // Optionally continue searching through other moves rather than throw
                continue;
            }
        }
        seen.delete(fen);
        transpositionTable.set(fen, bestEval);
        console.log('[minimax] Returning bestEval =', bestEval, 'for maximizing =', maximizing, 'at depth =', depth, 'FEN:', fen);
        return bestEval;
    }
    catch (err) {
        console.error('[minimax] Exception at FEN:', fen, 'Error:', err);
        throw err;
    }
}
// ---------------------------
// 🔹 SEARCH BEST MOVE (Computer always Black)
// ---------------------------
function searchBestMove(fen, depth = 4) {
    console.log('[searchBestMove] Start searching best move from FEN:', fen, 'Depth:', depth);
    let chess;
    try {
        chess = new chess_js_1.Chess(fen);
    }
    catch (err) {
        console.error('[searchBestMove] Error creating Chess object:', err);
        return null;
    }
    let moves;
    try {
        moves = chess.moves({ verbose: true });
    }
    catch (err) {
        console.error('[searchBestMove] Error getting moves:', err);
        return null;
    }
    if (moves.length === 0) {
        console.warn('[searchBestMove] No legal moves for FEN:', fen);
        return null;
    }
    const maximizing = chess.turn() === 'b'; // computer always black
    let bestMove = null;
    let bestValue = maximizing ? -Infinity : Infinity;
    for (const move of moves) {
        try {
            chess.move(move);
            const evalVal = minimax(chess, depth - 1, -Infinity, Infinity, !maximizing);
            chess.undo();
            console.log('[searchBestMove] Move tried:', move.san, 'Eval:', evalVal, 'Current Best:', bestValue);
            if (maximizing && evalVal > bestValue) {
                bestValue = evalVal;
                bestMove = move.san;
            }
            else if (!maximizing && evalVal < bestValue) {
                bestValue = evalVal;
                bestMove = move.san;
            }
        }
        catch (err) {
            console.error('[searchBestMove] Error evaluating move:', move, 'Error:', err);
            continue;
        }
    }
    if (!bestMove) {
        console.warn('[searchBestMove] Unable to find best move for FEN:', fen);
        return null;
    }
    console.log('✅ Best Move for Black:', bestMove, 'Value:', bestValue);
    try {
        chess.move(bestMove);
        console.log('New FEN after best move:', chess.fen());
        return chess.fen();
    }
    catch (err) {
        console.error('[searchBestMove] Error applying best move:', bestMove, 'Error:', err);
        return null;
    }
}
