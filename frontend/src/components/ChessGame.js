"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChessGame = void 0;
const react_1 = require("react");
const chess_js_1 = require("chess.js");
const chessboardjsx_1 = __importDefault(require("chessboardjsx"));
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const sonner_1 = require("sonner");
const ChessGame = () => {
    const [game, setGame] = (0, react_1.useState)(new chess_js_1.Chess());
    const [gamePosition, setGamePosition] = (0, react_1.useState)(game.fen());
    const [isThinking, setIsThinking] = (0, react_1.useState)(false);
    const [gameStatus, setGameStatus] = (0, react_1.useState)('Your turn (White)');
    const [selectedSquare, setSelectedSquare] = (0, react_1.useState)(null);
    const [lastMove, setLastMove] = (0, react_1.useState)(null);
    const [fenInput, setFenInput] = (0, react_1.useState)('');
    const calculateScore = (0, react_1.useMemo)(() => {
        const pieceValues = {
            p: 1,
            n: 3,
            b: 3,
            r: 5,
            q: 9,
            k: 0,
        };
        let score = 0;
        const board = game.board();
        board.forEach((row) => {
            row.forEach((square) => {
                if (square) {
                    const value = pieceValues[square.type];
                    score += square.color === 'w' ? value : -value;
                }
            });
        });
        return score;
    }, [gamePosition, game]); // also depend on game so calculation has current state
    // Now bestMoveSAN is a FEN string, so use it as position, not as a move
    const makeComputerMove = (currentFen, move) => __awaiter(void 0, void 0, void 0, function* () {
        setIsThinking(true);
        setGameStatus('Computer is thinking...');
        setLastMove(move);
        try {
            const response = yield fetch('http://localhost:3000/best-move', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ fen: currentFen }),
            });
            if (!response.ok) {
                throw new Error('Failed to get computer move');
            }
            const data = yield response.json();
            console.log(data.bestMoveSAN, 'this is the best move (FEN position)');
            let nextGame;
            if ((data === null || data === void 0 ? void 0 : data.bestMoveSAN) && typeof data.bestMoveSAN === 'string') {
                // Instead of making a move, load the new FEN position given by the server
                nextGame = new chess_js_1.Chess(data.bestMoveSAN);
            }
            else {
                throw new Error('Invalid response from server.');
            }
            // Try to deduce which move changed the position (from previous FEN to now):
            const origGame = new chess_js_1.Chess(currentFen);
            const origMoves = origGame.moves({ verbose: true });
            let foundMove = null;
            for (const m of origMoves) {
                const tryGame = new chess_js_1.Chess(currentFen);
                tryGame.move(m);
                if (tryGame.fen() === data.bestMoveSAN) {
                    foundMove = { from: m.from, to: m.to };
                    break;
                }
            }
            setGame(nextGame);
            setGamePosition(nextGame.fen());
            setLastMove(foundMove);
            if (nextGame.isGameOver()) {
                handleGameOver(nextGame);
            }
            else {
                setGameStatus('Your turn (White)');
            }
        }
        catch (error) {
            console.error('Error getting computer move:', error);
            sonner_1.toast.error('Failed to get computer move. Please try again.');
            setGameStatus('Error - Your turn (White)');
        }
        finally {
            setIsThinking(false);
        }
    });
    const handleGameOver = (gameInstance) => {
        if (gameInstance.isCheckmate()) {
            const winner = gameInstance.turn() === 'w' ? 'Black' : 'White';
            setGameStatus(`Checkmate! ${winner} wins!`);
            sonner_1.toast.success(`Checkmate! ${winner} wins!`);
        }
        else if (gameInstance.isDraw()) {
            setGameStatus('Draw!');
            sonner_1.toast.info('Game ended in a draw');
        }
        else if (gameInstance.isStalemate()) {
            setGameStatus('Stalemate!');
            sonner_1.toast.info('Game ended in stalemate');
        }
        else if (gameInstance.isThreefoldRepetition()) {
            setGameStatus('Draw by repetition!');
            sonner_1.toast.info('Draw by threefold repetition');
        }
        else if (gameInstance.isInsufficientMaterial()) {
            setGameStatus('Draw by insufficient material!');
            sonner_1.toast.info('Draw by insufficient material');
        }
    };
    const onSquareClick = (square) => {
        if (isThinking || game.isGameOver())
            return;
        // If a square is already selected, try to move
        if (selectedSquare) {
            const gameCopy = new chess_js_1.Chess(game.fen());
            try {
                const move = gameCopy.move({
                    from: selectedSquare,
                    to: square,
                    promotion: 'q',
                });
                if (move === null) {
                    // If move failed, select the new square if it has a white piece
                    const piece = game.get(square);
                    if (piece && piece.color === 'w') {
                        setSelectedSquare(square);
                    }
                    else {
                        setSelectedSquare(null);
                        sonner_1.toast.error('Illegal move!');
                    }
                    return;
                }
                setGame(gameCopy);
                setGamePosition(gameCopy.fen());
                setSelectedSquare(null);
                if (gameCopy.isGameOver()) {
                    handleGameOver(gameCopy);
                    return;
                }
                makeComputerMove(gameCopy.fen(), { from: selectedSquare, to: square });
            }
            catch (error) {
                console.error('Error making move:', error);
                setSelectedSquare(null);
                sonner_1.toast.error('Invalid move!');
            }
        }
        else {
            // Select a square if it has a white piece
            const piece = game.get(square);
            if (piece && piece.color === 'w') {
                setSelectedSquare(square);
            }
        }
    };
    const onDrop = (0, react_1.useCallback)(({ sourceSquare, targetSquare, }) => {
        if (isThinking)
            return;
        const gameCopy = new chess_js_1.Chess(game.fen());
        try {
            const move = gameCopy.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: 'q',
            });
            if (move === null) {
                sonner_1.toast.error('Illegal move!');
                return;
            }
            setGame(gameCopy);
            setGamePosition(gameCopy.fen());
            setSelectedSquare(null);
            if (gameCopy.isGameOver()) {
                handleGameOver(gameCopy);
                return;
            }
            makeComputerMove(gameCopy.fen(), {
                from: sourceSquare,
                to: targetSquare,
            });
        }
        catch (error) {
            console.error('Error making move:', error);
            sonner_1.toast.error('Invalid move!');
        }
    }, [game, isThinking]);
    const resetGame = () => {
        const newGame = new chess_js_1.Chess();
        setGame(newGame);
        setGamePosition(newGame.fen());
        setGameStatus('Your turn (White)');
        setSelectedSquare(null);
        setLastMove(null);
        setFenInput('');
        sonner_1.toast.success('New game started!');
    };
    // FEN input handlers
    const handleFenInputChange = (e) => __awaiter(void 0, void 0, void 0, function* () {
        const input = e.target.value;
        setFenInput(input);
        setGamePosition(input);
        // Check if FEN indicates black to move
        const fenParts = input.trim().split(' ');
        if (fenParts.length >= 2 && fenParts[1] === 'b') {
            try {
                const response = yield fetch('http://localhost:3000/best-move', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ fen: input }),
                });
                if (!response.ok) {
                    throw new Error('Failed to get computer move');
                }
                const data = yield response.json();
                console.log(data.bestMoveSAN, 'this is the best move (FEN position)');
                let newGame = null;
                if ((data === null || data === void 0 ? void 0 : data.bestMoveSAN) && typeof data.bestMoveSAN === 'string') {
                    newGame = new chess_js_1.Chess(data.bestMoveSAN);
                }
                else {
                    throw new Error('Server did not return bestMove');
                }
                // Try to deduce what the move was
                let foundMove = null;
                try {
                    const origGame = new chess_js_1.Chess(input);
                    const origMoves = origGame.moves({ verbose: true });
                    for (const m of origMoves) {
                        const tryGame = new chess_js_1.Chess(input);
                        tryGame.move(m);
                        if (tryGame.fen() === data.bestMoveSAN) {
                            foundMove = { from: m.from, to: m.to };
                            break;
                        }
                    }
                }
                catch (_a) { }
                setGame(newGame);
                setGamePosition(newGame.fen());
                setSelectedSquare(null);
                setGameStatus('Your turn (White)');
                setLastMove(foundMove);
                sonner_1.toast.success('Computer (Black) played automatically!');
            }
            catch (error) {
                sonner_1.toast.error('Could not get best move for black from server.');
            }
        }
    });
    const handleSetFen = () => {
        try {
            const trimmedFen = fenInput.trim();
            const newGame = new chess_js_1.Chess(trimmedFen);
            setGame(newGame);
            setGamePosition(newGame.fen());
            setSelectedSquare(null);
            setGameStatus('Your turn (White)');
            setLastMove(null);
            sonner_1.toast.success('FEN position set!');
        }
        catch (e) {
            sonner_1.toast.error('Invalid FEN position!');
        }
    };
    const getSquareStyles = (0, react_1.useMemo)(() => {
        const styles = {};
        // Highlight last move
        if (lastMove) {
            styles[lastMove.from] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
            styles[lastMove.to] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
        }
        // Highlight selected square
        if (selectedSquare) {
            styles[selectedSquare] = { backgroundColor: 'rgba(130, 151, 105, 0.6)' };
            // Show possible moves
            const moves = game.moves({ square: selectedSquare, verbose: true });
            moves.forEach((move) => {
                const targetSquare = move.to;
                const hasTargetPiece = game.get(targetSquare);
                if (hasTargetPiece) {
                    // Capture move - red circle border and highlight
                    styles[targetSquare] = Object.assign(Object.assign({}, styles[targetSquare]), { background: 'radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)', backgroundSize: '100%', border: '2px solid rgba(220, 38, 38, 0.8)' });
                }
                else {
                    // Regular move - dot
                    styles[targetSquare] = Object.assign(Object.assign({}, styles[targetSquare]), { background: 'radial-gradient(circle, rgba(0,0,0,.2) 25%, transparent 25%)', backgroundSize: '100%' });
                }
            });
        }
        return styles;
    }, [selectedSquare, lastMove, game]);
    return (<div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <card_1.Card className="p-6 max-w-2xl w-full">
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-bold mb-2 text-foreground">
            Chess Game
          </h1>
          <div className="flex items-center justify-center gap-6 mb-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">You (White)</p>
              <p className="text-2xl font-bold text-foreground">
                {calculateScore >= 0 ? `+${calculateScore}` : calculateScore}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Computer (Black)</p>
              <p className="text-2xl font-bold text-foreground">
                {calculateScore <= 0
            ? `+${Math.abs(calculateScore)}`
            : `-${calculateScore}`}
              </p>
            </div>
          </div>
          <p className="text-lg text-muted-foreground mb-2">{gameStatus}</p>
          {game.isCheck() && !game.isGameOver() && (<p className="text-lg font-semibold text-accent">Check!</p>)}
        </div>

        {/* FEN input box */}
        <div className="flex flex-row items-center justify-center gap-2 mb-6">
          <input type="text" placeholder="Paste FEN position here" className="border border-input rounded px-2 py-1 w-full max-w-xs bg-background text-foreground" value={fenInput} onChange={handleFenInputChange} disabled={isThinking}/>
          <button_1.Button onClick={handleSetFen} variant="default" size="sm" disabled={isThinking || !fenInput.trim()} type="button">
            Set FEN
          </button_1.Button>
        </div>

        <div className="mb-6 max-w-[500px] mx-auto">
          <chessboardjsx_1.default position={gamePosition} onDrop={onDrop} onSquareClick={onSquareClick} draggable={!isThinking && !game.isGameOver()} squareStyles={getSquareStyles} lightSquareStyle={{ backgroundColor: 'hsl(var(--chess-light))' }} darkSquareStyle={{ backgroundColor: 'hsl(var(--chess-dark))' }} boardStyle={{
            borderRadius: '0.75rem',
            boxShadow: '0 10px 30px -10px hsl(var(--primary) / 0.3)',
        }}/>
        </div>

        <div className="flex justify-center gap-4">
          <button_1.Button onClick={resetGame} variant="outline" size="lg" disabled={isThinking}>
            New Game
          </button_1.Button>
        </div>

        <div className="mt-6 text-sm text-muted-foreground text-center">
          <p>
            Click or drag pieces to move. Click a piece to see possible moves.
          </p>
        </div>
      </card_1.Card>
    </div>);
};
exports.ChessGame = ChessGame;
