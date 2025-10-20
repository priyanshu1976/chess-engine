"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchBestMove = searchBestMove;
const chess_js_1 = require("chess.js");
const minimax_1 = require("./minimax");
// ---------------------------
// 🔹 EVALUATION FUNCTION
// ---------------------------
// ---------------------------
// 🔹 SEARCH BEST MOVE (Computer always Black)
// ---------------------------
function searchBestMove(fen, depth = 3) {
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
            const evalVal = (0, minimax_1.minimax)(chess, depth - 1, -Infinity, Infinity, !maximizing);
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
