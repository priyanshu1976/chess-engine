import fs from 'fs'
import csv from 'csv-parser'
import { Chess } from 'chess.js'
import { spawn } from 'child_process'
import { extractFeatures } from './preprocessing'

interface DataRow {
  FEN: string
  'Next move': string
}

async function evaluateFEN(fen: string, depth = 15) {
  return new Promise<number>((resolve) => {
    const stockfish = spawn(
      '/Users/priyanshupatel/Desktop/chess-engine/src/ml-part/stockfish/stockfish-macos-m1-apple-silicon'
    )

    let evalScore = 0

    stockfish.stdout.on('data', (data) => {
      const lines = data.toString().split('\n')
      for (const line of lines) {
        if (line.includes('score cp')) {
          const match = line.match(/score cp (-?\d+)/)
          if (match) evalScore = parseInt(match[1]) / 100
        }

        if (line.includes('bestmove')) {
          stockfish.kill()
          resolve(evalScore)
        }
      }
    })

    stockfish.stdin.write(`uci\n`)
    stockfish.stdin.write(`position fen ${fen}\n`)
    stockfish.stdin.write(`go depth ${depth}\n`)
  })
}

async function generateYFromCSV(csvFilePath: string) {
  const dataset: DataRow[] = []

  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on('data', (row) => {
      dataset.push(row)
    })
    .on('end', async () => {
      console.log('CSV file successfully read (up to 100 rows).')
      const results: any[] = []

      for (const row of dataset) {
        const chess = new Chess(row.FEN)
        chess.move(row['Next move'])
        const newFEN = chess.fen()
        const val = await evaluateFEN(newFEN, 15)
        const features = extractFeatures(row.FEN)
        console.log(`FEN: ${row.FEN}, Move: ${row['Next move']}, Eval: ${val}`)

        results.push({ ...features, val })
      }

      // Convert results to CSV table format
      const headers = Object.keys(results[0]).join(',')
      const rows = results.map((obj) => Object.values(obj).join(','))
      const csvOutput = [headers, ...rows].join('\n')

      fs.writeFileSync('y.csv', csvOutput)
      console.log('Saved y.csv as a clean table!')
    })
}

const path =
  '/Users/priyanshupatel/Desktop/chess-engine/src/ml-part/dataset.csv'

generateYFromCSV(path)
