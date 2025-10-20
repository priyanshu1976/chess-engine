import express, { Request, Response } from 'express'
import cors from 'cors'
import { searchBestMoveParallel } from './searchBestMoveParallel'

const app = express()
app.use(express.json())
app.use(
  cors({
    origin: '*',
  })
)

// ✅ Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true })
})

// ✅ POST /best-move
app.post('/best-move', async (req: Request, res: Response) => {
  try {
    const { fen, depth = 5 } = req.body ?? {}

    if (typeof fen !== 'string' || !fen.trim()) {
      return res.status(400).json({ error: 'Invalid or missing FEN' })
    }

    console.log(`♟️ Searching best move for FEN: ${fen} (Depth: ${depth})`)

    const bestFen = await searchBestMoveParallel(fen, depth)

    if (!bestFen) {
      return res.status(500).json({ error: 'Failed to find best move' })
    }

    console.log('✅ Best move found. New FEN:', bestFen)

    return res.json({
      success: true,
      bestMoveSAN: bestFen,
    })
  } catch (err: any) {
    console.error('❌ Error in /best-move route:', err)
    return res.status(500).json({ error: err?.message ?? 'Server error' })
  }
})

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`)
  })
}
