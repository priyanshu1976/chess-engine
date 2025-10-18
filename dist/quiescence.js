"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quiescence = quiescence;
const evaluation_1 = require("./evaluation");
function quiescence(chess, alpha, beta, maximizing, evaluate) {
    let standPat = evaluate(chess.fen());
    if (maximizing) {
        if (standPat >= beta)
            return beta;
        if (standPat > alpha)
            alpha = standPat;
    }
    else {
        if (standPat <= alpha)
            return alpha;
        if (standPat < beta)
            beta = standPat;
    }
    const moves = chess.moves({ verbose: true }).filter((m) => m.captured);
    moves.sort((a, b) => (evaluation_1.PIECE_VAL[b.captured] || 0) -
        (evaluation_1.PIECE_VAL[a.captured] || 0));
    if (maximizing) {
        for (const m of moves) {
            chess.move(m);
            const score = quiescence(chess, alpha, beta, false, evaluate);
            chess.undo();
            if (score > alpha)
                alpha = score;
            if (alpha >= beta)
                break;
        }
        return alpha;
    }
    else {
        for (const m of moves) {
            chess.move(m);
            const score = quiescence(chess, alpha, beta, true, evaluate);
            chess.undo();
            if (score < beta)
                beta = score;
            if (alpha >= beta)
                break;
        }
        return beta;
    }
}
