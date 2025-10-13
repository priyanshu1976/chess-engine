import { Chess, Move } from 'chess.js'
import { evaluatePosition } from './evaluation'
import { orderedMoves } from './moveOrdering'
import { sanitizeFen } from './helpers'
import { SearchNode, SearchOptions, SearchResult, TTEntry } from './types'

export function searchBestMove(
  fenRaw: string,
  opts: SearchOptions
): SearchResult {
  const fen = sanitizeFen(fenRaw)
  const chess = new Chess(fen)

  const tt = new Map<string, TTEntry>()
  let nodes = 0
  const nodeCap = opts.maxNodes ?? Infinity

  const root: SearchNode | undefined = opts.collectTree ? { fen } : undefined

  function minimax(
    depth: number,
    alpha: number,
    beta: number,
    parent?: SearchNode
  ): { score: number; pv: string[]; best?: Move } {
    if (
      opts.collectTree &&
      parent &&
      (parent.children?.length ?? 0) > nodeCap - 1
    ) {
      return { score: evaluatePosition(chess), pv: [] }
    }

    const key = sanitizeFen(chess.fen())
    const ttHit = tt.get(key)
    if (ttHit && ttHit.depth >= depth) {
      if (ttHit.flag === 'EXACT')
        return { score: ttHit.score, pv: ttHit.bestSAN ? [ttHit.bestSAN] : [] }
      if (ttHit.flag === 'LOWER') alpha = Math.max(alpha, ttHit.score)
      else if (ttHit.flag === 'UPPER') beta = Math.min(beta, ttHit.score)
      if (alpha >= beta)
        return { score: ttHit.score, pv: ttHit.bestSAN ? [ttHit.bestSAN] : [] }
    }

    if (depth === 0 || chess.isGameOver()) {
      const evalScore = evaluatePosition(chess)
      if (parent) parent.score = evalScore
      return { score: evalScore, pv: [] }
    }

    nodes++
    const side = chess.turn()
    let bestMove: Move | undefined
    let bestPV: string[] = []

    const moves = orderedMoves(chess)
    if (opts.collectTree && parent) parent.children = []

    if (side === 'b') {
      let value = -Infinity
      const originalAlpha = alpha
      const originalBeta = beta
      for (const m of moves) {
        chess.move(m)
        const childNode: SearchNode | undefined =
          opts.collectTree && parent
            ? { fen: sanitizeFen(chess.fen()), moveSAN: m.san }
            : undefined
        if (childNode && parent) parent.children!.push(childNode)
        const r = minimax(depth - 1, alpha, beta, childNode)
        chess.undo()
        if (r.score > value) {
          value = r.score
          bestMove = m
          bestPV = [m.san, ...r.pv]
        }
        alpha = Math.max(alpha, value)
        if (alpha >= beta) break
      }
      const flag: TTEntry['flag'] =
        value <= originalAlpha
          ? 'UPPER'
          : value >= originalBeta
          ? 'LOWER'
          : 'EXACT'
      tt.set(key, { depth, score: value, flag, bestSAN: bestMove?.san })
      if (parent) parent.score = value
      return { score: value, pv: bestPV, best: bestMove }
    } else {
      let value = Infinity
      const originalAlpha = alpha
      const originalBeta = beta
      for (const m of moves) {
        chess.move(m)
        const childNode: SearchNode | undefined =
          opts.collectTree && parent
            ? { fen: sanitizeFen(chess.fen()), moveSAN: m.san }
            : undefined
        if (childNode && parent) parent.children!.push(childNode)
        const r = minimax(depth - 1, alpha, beta, childNode)
        chess.undo()
        if (r.score < value) {
          value = r.score
          bestMove = m
          bestPV = [m.san, ...r.pv]
        }
        beta = Math.min(beta, value)
        if (alpha >= beta) break
      }
      const flag: TTEntry['flag'] =
        value <= originalAlpha
          ? 'UPPER'
          : value >= originalBeta
          ? 'LOWER'
          : 'EXACT'
      tt.set(key, { depth, score: value, flag, bestSAN: bestMove?.san })
      if (parent) parent.score = value
      return { score: value, pv: bestPV, best: bestMove }
    }
  }

  const { score, pv, best } = minimax(opts.depth, -Infinity, Infinity, root)
  return { score, bestMove: best, pv, rootTree: root }
}

export const searchBestMoveForBlack = searchBestMove
