import express, { Request, Response } from 'express'
import { searchBestMove } from './search'

export { searchBestMove }

const app = express()
app.use(express.json())

app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true })
})

app.post('/best-move', (req: Request, res: Response) => {
  try {
    const {
      fen,
      depth = 3,
      collectTree = false,
      maxNodes = 200,
    } = req.body ?? {}
    if (typeof fen !== 'string' || !fen.trim()) {
      return res.status(400).json({ error: 'Invalid or missing fen' })
    }
    const result = searchBestMove(fen)
    return res.json({
      bestMoveSAN: result,
    })
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? 'Server error' })
  }
})

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`)
  })
}
