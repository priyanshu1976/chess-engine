// searchBestMoveParallel.ts
import Piscina from 'piscina'
import path from 'path'
import os from 'os'
import { Chess } from 'chess.js'

const piscina = new Piscina({
  filename: path.resolve(__dirname, './worker.js'),
  maxThreads: Math.min(os.cpus().length, 10),
})

export async function searchBestMoveParallel(
  fen: string,
  maxDepth = 5
): Promise<string | null> {
  console.log(`🔍 Searching best move up to depth ${maxDepth} (parallel)`)

  const chess = new Chess(fen)
  const maximizing = chess.turn() === 'b'
  const moves = chess.moves({ verbose: true })
  if (moves.length === 0) return null

  let bestMove: string | null = null
  let bestValue = maximizing ? -Infinity : Infinity

  // Iterative deepening
  for (let depth = 2; depth <= maxDepth; depth++) {
    console.log(`\n🧠 Depth ${depth} evaluation...`)

    const evaluations = await Promise.allSettled(
      moves.map((move) => piscina.run({ fen, move, depth }))
    )

    const results = evaluations
      .filter((r) => r.status === 'fulfilled')
      .map(
        (r) =>
          (r as PromiseFulfilledResult<{ move: string; value: number }>).value
      )

    if (results.length === 0) continue

    const currentBest = maximizing
      ? results.reduce((a, b) => (b.value > a.value ? b : a))
      : results.reduce((a, b) => (b.value < a.value ? b : a))

    console.log(
      `Depth ${depth} → Best Move: ${currentBest.move}, Eval: ${currentBest.value}`
    )

    bestMove = currentBest.move
    bestValue = currentBest.value
  }

  if (!bestMove) return null

  console.log(`✅ Final Best Move: ${bestMove} (Value: ${bestValue})`)
  chess.move(bestMove)
  console.log('New FEN:', chess.fen())
  return chess.fen()
}
