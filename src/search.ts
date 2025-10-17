import { Chess, Move } from 'chess.js'
import { PieceType } from './types'

interface IQueue<T> {
  enqueue(item: T): void
  dequeue(): T | undefined
  size(): number
}

class Queue<T> implements IQueue<T> {
  private storage: T[] = []

  constructor(private capacity: number = Infinity) {}

  enqueue(item: T): void {
    if (this.size() === this.capacity) {
      throw Error('Queue has reached max capacity, you cannot add more items')
    }
    this.storage.push(item)
  }
  dequeue(): T | undefined {
    return this.storage.shift()
  }
  size(): number {
    return this.storage.length
  }
}

const PIECE_VAL: Record<PieceType, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 50000,
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

class ChessNode {
  public fen: string
  public value: number
  public children: ChessNode[]

  constructor(fen: string, value: number) {
    this.fen = fen
    this.value = value
    this.children = []
  }

  addChild(child: ChessNode) {
    this.children.push(child)
  }
}

// Minimax Algorithm applied on the root node created
function minimax(
  node: ChessNode,
  depth: number,
  maximizingPlayer: boolean
): number {
  if (depth === 0 || node.children.length === 0) {
    return node.value
  }

  if (maximizingPlayer) {
    let maxEval = -Infinity
    for (const child of node.children) {
      const evalValue = minimax(child, depth - 1, false)
      if (evalValue > maxEval) {
        maxEval = evalValue
      }
    }
    return maxEval
  } else {
    let minEval = Infinity
    for (const child of node.children) {
      const evalValue = minimax(child, depth - 1, true)
      if (evalValue < minEval) {
        minEval = evalValue
      }
    }
    return minEval
  }
}

export function searchBestMove(fenRaw: string) {
  const chess = new Chess(fenRaw)
  const legalMoves = chess.moves()
  const root = new ChessNode(fenRaw, evaluatePosition(fenRaw))
  const queue = new Queue<ChessNode>()
  queue.enqueue(root)

  for (let i = 0; i < 4; i++) {
    const node = queue.dequeue()
    // console.log('level ', i + 1) // Comment out for brevity
    if (!node) continue
    const chessInstance = new Chess(node.fen)
    const legalMoves = chessInstance.moves({ verbose: true })
    for (const move of legalMoves) {
      chessInstance.move(move)
      const childNode = new ChessNode(
        chessInstance.fen(),
        evaluatePosition(chessInstance.fen())
      )
      // console.log(evaluatePosition(chessInstance.fen())) // Comment out for brevity
      node.addChild(childNode)
      queue.enqueue(childNode)
      chessInstance.undo()
    }
  }

  // ! here the root is prepared

  // Now, let's apply minimax to the root's children to choose the best move
  // Assume root turn is maximizing if it is white
  const chessForTurn = new Chess(root.fen)
  const maximizingPlayer = chessForTurn.turn() === 'w'
  let bestVal = maximizingPlayer ? -Infinity : Infinity
  let bestMoveIndex = -1

  for (let i = 0; i < root.children.length; i++) {
    const child = root.children[i]
    const val = minimax(child, 7, !maximizingPlayer)
    // console.log(`Move #${i}: eval = ${val}`)
    if (maximizingPlayer) {
      if (val > bestVal) {
        bestVal = val
        bestMoveIndex = i
      }
    } else {
      if (val < bestVal) {
        bestVal = val
        bestMoveIndex = i
      }
    }
  }

  if (bestMoveIndex !== -1 && root.children[bestMoveIndex]) {
    console.log('Best move FEN:', root.children[bestMoveIndex].fen)
    return root.children[bestMoveIndex].fen
    console.log('Best move value:', bestVal)
  } else {
    console.log('No best move found.')
    return 0
  }

  // * first lets convert the fen string in to 64 char arr
}

searchBestMove('4k1rr/8/8/8/8/8/7R/R3K3 w Qk - 2 2')

export function evaluatePosition(fen: string): number {
  // * check if its black turn
  const chess = new Chess(fen)
  if (chess.isCheckmate()) {
    return chess.turn() === 'b' ? -1e6 : 1e6
  }
  // * check if winning conditions
  if (
    chess.isDraw() ||
    chess.isStalemate() ||
    chess.isThreefoldRepetition() ||
    chess.isInsufficientMaterial()
  ) {
    return 0
  }

  const mirror = (i: number) => 7 - i

  let score = 0
  const board = chess.board()
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const square = board[rank][file]
      if (!square) continue
      const type = square.type as PieceType
      const baseValue = PIECE_VAL[type]
      const pstBonus =
        square.color === 'b'
          ? PST[type][rank][file]
          : PST[type][mirror(rank)][mirror(file)]
      const pieceValue = baseValue + 1 * pstBonus
      score += square.color === 'b' ? pieceValue : -pieceValue
    }
  }

  return score
}
