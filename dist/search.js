"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchBestMove = searchBestMove;
const chess_js_1 = require("chess.js");
const evaluation_1 = require("./evaluation");
const moveOrdering_1 = require("./moveOrdering");
// ---------------------------
// 🔹 MINIMAX + ALPHA-BETA
// ---------------------------
function minimax(chess, depth, alpha, beta, maximizing) {
    if (depth === 0 || chess.isGameOver()) {
        return 0;
    }
    let moves = chess.moves({ verbose: true });
    moves = (0, moveOrdering_1.orderMoves)(moves);
    if (maximizing) {
        let maxEval = -Infinity;
        for (const move of moves) {
            chess.move(move);
            const checkExtension = chess.inCheck() ? 1 : 0;
            let evalVal = minimax(chess, depth - 1 + checkExtension, alpha, beta, false);
            // Capture and promotion heuristics
            if (move.captured) {
                evalVal += evaluation_1.PIECE_VAL[move.captured] * 0.8;
            }
            if (move.flags.includes('p')) {
                evalVal += 9;
            }
            chess.undo();
            maxEval = Math.max(maxEval, evalVal);
            alpha = Math.max(alpha, evalVal);
            if (beta <= alpha) {
                break;
            }
        }
        console.log(`[minimax] (max) Returning evaluation: ${maxEval}`);
        return maxEval;
    }
    else {
        let minEval = Infinity;
        for (const move of moves) {
            chess.move(move);
            const checkExtension = chess.inCheck() ? 1 : 0;
            let evalVal = minimax(chess, depth - 1 + checkExtension, alpha, beta, true);
            if (move.captured) {
                evalVal += evaluation_1.PIECE_VAL[move.captured] * 0.8;
            }
            if (move.flags.includes('p')) {
                evalVal += 9;
            }
            chess.undo();
            minEval = Math.min(minEval, evalVal);
            beta = Math.min(beta, evalVal);
            if (beta <= alpha) {
                break;
            }
        }
        return minEval;
    }
}
// ---------------------------
// 🔹 SEARCH BEST MOVE (Computer always Black)
// ---------------------------
function searchBestMove(fen, depth = 3) {
    console.log('searchBestMove called with FEN:', fen, 'and depth:', depth);
    const chess = new chess_js_1.Chess(fen);
    const moves = chess.moves({ verbose: true });
    if (moves.length === 0) {
        console.log('No moves available, returning null.');
        return null;
    }
    const maximizing = chess.turn() === 'b'; // computer always Black
    let bestMove = null;
    let bestValue = maximizing ? -Infinity : Infinity;
    for (const move of moves) {
        chess.move(move);
        let evalVal = minimax(chess, depth - 1, -Infinity, Infinity, !maximizing);
        chess.undo();
        if (maximizing && evalVal > bestValue) {
            bestValue = evalVal;
            bestMove = move.san;
        }
        else if (!maximizing && evalVal < bestValue) {
            bestValue = evalVal;
            bestMove = move.san;
        }
    }
    console.log('✅ Best Move for Black:', bestMove, 'Value:', bestValue);
    chess.move(bestMove);
    console.log('New FEN after best move:', chess.fen());
    return chess.fen();
}
