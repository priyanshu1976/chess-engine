import { Move } from 'chess.js'

export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k'

export interface SearchNode {
  fen: string
  moveSAN?: string
  score?: number
  children?: SearchNode[]
}

export interface SearchOptions {
  depth: number
  collectTree?: boolean
  maxNodes?: number
}

export interface SearchResult {
  score: number
  bestMove?: Move
  pv: string[]
  rootTree?: SearchNode
}

export type TTEntry = {
  depth: number
  score: number
  flag: 'EXACT' | 'LOWER' | 'UPPER'
  bestSAN?: string
}
