import { Chess, Move } from 'chess.js'

export function orderedMoves(chess: Chess): Move[] {
  const moves = chess.moves({ verbose: true }) as Move[]
  return moves.sort((a, b) => {
    const aCap = (a as any).captured ? 1 : 0
    const bCap = (b as any).captured ? 1 : 0
    if (bCap - aCap) return bCap - aCap
    const aCheck = a.san.includes('+') || a.san.includes('#') ? 1 : 0
    const bCheck = b.san.includes('+') || b.san.includes('#') ? 1 : 0
    if (bCheck - aCheck) return bCheck - aCheck
    return 0
  })
}
