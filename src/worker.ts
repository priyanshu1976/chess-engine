// worker.ts
import { Chess } from 'chess.js'
import { minimax } from './minimax'

interface WorkerData {
  fen: string
  move: any
  depth: number
}

export default function run({ fen, move, depth }: WorkerData) {
  const chess = new Chess(fen)
  chess.move(move)
  const value = minimax(chess, depth - 1, -Infinity, Infinity, false)
  return { move: move.san, value }
}
