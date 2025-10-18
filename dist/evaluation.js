"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PIECE_VAL = void 0;
exports.evaluatePosition = evaluatePosition;
const chess_js_1 = require("chess.js");
exports.PIECE_VAL = {
    p: 1,
    n: 3,
    b: 3,
    r: 5,
    q: 9,
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
        [0, 0, 0, 0, 0, 0, 0, 0],
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
function evaluatePosition(fen) {
    const chess = new chess_js_1.Chess(fen);
    if (chess.isCheckmate())
        return chess.turn() === 'b' ? -1e6 : 1e6;
    if (chess.isDraw() ||
        chess.isStalemate() ||
        chess.isThreefoldRepetition() ||
        chess.isInsufficientMaterial()) {
        return 0;
    }
    const mirror = (i) => 7 - i;
    let score = 0;
    const board = chess.board();
    // material + PST
    for (let rank = 0; rank < 8; rank++) {
        for (let file = 0; file < 8; file++) {
            const square = board[rank][file];
            if (!square)
                continue;
            const type = square.type;
            const baseValue = exports.PIECE_VAL[type];
            const pstBonus = square.color === 'w'
                ? PST[type][mirror(rank)][file]
                : PST[type][rank][mirror(file)];
            const pieceValue = baseValue + 0.1 * pstBonus;
            score += square.color === 'b' ? pieceValue : -pieceValue;
        }
    }
    // bishop pair
    const countPieces = (color, type) => {
        let c = 0;
        for (let r = 0; r < 8; r++)
            for (let f = 0; f < 8; f++) {
                const s = board[r][f];
                if (s && s.color === color && s.type === type)
                    c++;
            }
        return c;
    };
    if (countPieces('b', 'b') >= 2)
        score += 0.5;
    if (countPieces('w', 'b') >= 2)
        score -= 0.5;
    // rook file bonuses
    const fileHasPawn = (color, file) => {
        for (let r = 0; r < 8; r++) {
            const s = board[r][file];
            if (s && s.type === 'p' && s.color === color)
                return true;
        }
        return false;
    };
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
    // center control
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
    // mobility
    const fenParts = chess.fen().split(' ');
    const setTurn = (t) => {
        const p = [...fenParts];
        p[1] = t;
        return p.join(' ');
    };
    const mobB = new chess_js_1.Chess(setTurn('b')).moves().length;
    const mobW = new chess_js_1.Chess(setTurn('w')).moves().length;
    score += 0.03 * (mobB - mobW);
    // king pawn shield
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
    score += pawnShieldPenalty('w', wKing) * -1;
    score += pawnShieldPenalty('b', bKing);
    // batteries
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
    addBatteryBonus('b', 0.25);
    addBatteryBonus('w', 0.25);
    // discovered attack potential
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
    addDiscoveredBonus('b', 0.2);
    addDiscoveredBonus('w', 0.2);
    // pawn structure
    const filesWithPawns = { w: new Set(), b: new Set() };
    const pawnCountsByFile = {
        w: Array(8).fill(0),
        b: Array(8).fill(0),
    };
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
    // knight outposts & bad bishop
    const isPawn = (color, r, f) => {
        var _a;
        const s = (_a = board[r]) === null || _a === void 0 ? void 0 : _a[f];
        return !!(s && s.type === 'p' && s.color === color);
    };
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
    // king tropism
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
    return score;
}
