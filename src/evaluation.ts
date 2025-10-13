import { Chess } from 'chess.js'
import { PieceType } from './types'
import { sanitizeFen, mirror } from './helpers'

const PIECE_VAL: Record<PieceType, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 10,
  k: 50,
}

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
} as const

export function evaluatePosition(chess: Chess): number {
  if (chess.isCheckmate()) {
    return chess.turn() === 'b' ? -1e6 : 1e6
  }
  if (
    chess.isDraw() ||
    chess.isStalemate() ||
    chess.isThreefoldRepetition() ||
    chess.isInsufficientMaterial()
  ) {
    return 0
  }

  let score = 0
  const board = chess.board()
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const s = board[r][f]
      if (!s) continue
      const t = s.type as PieceType
      const base = PIECE_VAL[t]
      const pst = s.color === 'b' ? PST[t][r][f] : PST[t][mirror(r)][mirror(f)]
      const val = base + 0.1 * pst
      score += s.color === 'b' ? val : -val
    }
  }

  const fen = sanitizeFen(chess.fen())
  const fenParts = fen.split(' ')
  const fenBParts = [...fenParts]
  fenBParts[1] = 'b'
  const fenWParts = [...fenParts]
  fenWParts[1] = 'w'
  const mobB = new Chess(sanitizeFen(fenBParts.join(' '))).moves().length
  const mobW = new Chess(sanitizeFen(fenWParts.join(' '))).moves().length
  score += 0.05 * (mobB - mobW)

  return score
}
