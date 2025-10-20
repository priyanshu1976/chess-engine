// minimax.ts
import { Chess } from 'chess.js'
import { evaluatePosition } from './evaluate'

interface TTEntry {
  depth: number
  value: number
}

const transpositionTable = new Map<string, TTEntry>()

export function minimax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean
): number {
  const fen = chess.fen()

  // Cache lookup
  const cached = transpositionTable.get(fen)
  if (cached && cached.depth >= depth) return cached.value

  if (depth === 0 || chess.isGameOver()) {
    const evalValue = evaluatePosition(fen)
    transpositionTable.set(fen, { depth, value: evalValue })
    return evalValue
  }

  const moves = chess.moves({ verbose: true })
  let bestVal = maximizing ? -Infinity : Infinity

  for (const move of moves) {
    chess.move(move)
    const evalVal = minimax(chess, depth - 1, alpha, beta, !maximizing)
    chess.undo()

    if (maximizing) {
      bestVal = Math.max(bestVal, evalVal)
      alpha = Math.max(alpha, evalVal)
    } else {
      bestVal = Math.min(bestVal, evalVal)
      beta = Math.min(beta, evalVal)
    }

    if (beta <= alpha) break // alpha-beta cutoff
  }

  transpositionTable.set(fen, { depth, value: bestVal })
  return bestVal
}
