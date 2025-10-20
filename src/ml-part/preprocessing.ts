import { Chess, Square } from 'chess.js'
import { PieceType } from '../types'
import { PST, kingPos, PIECE_VAL, pawnShieldPenalty } from '../utils'

interface FeatureVector {
  material: number
  rookOpenFiles: number
  semiOpenFiles: number
  centerControl: number
  pawnShield: number
  bishopPair: number
  battery: number
  doublePawnPenalty: number
  kingTropism: number
  doubleCheck: number
  fork: number
  pin: number
  trappedPiece: number
}

export function extractFeatures(fen: string): FeatureVector {
  const chess = new Chess(fen)
  const board = chess.board()
  let features: FeatureVector = {
    material: 0,
    rookOpenFiles: 0,
    semiOpenFiles: 0,
    centerControl: 0,
    pawnShield: 0,
    bishopPair: 0,
    battery: 0,
    doublePawnPenalty: 0,
    kingTropism: 0,
    doubleCheck: 0,
    fork: 0,
    pin: 0,
    trappedPiece: 0,
  }

  // Example: material
  for (let r = 0; r < 8; r++)
    for (let f = 0; f < 8; f++) {
      const s = board[r][f]
      if (!s) continue
      const val = PIECE_VAL[s.type]
      features.material += s.color === 'b' ? val : -val
    }

  // -------------------------
  // 🧩 Rook file control
  // -------------------------
  const fileHasPawn = (color: 'w' | 'b', file: number) => {
    for (let r = 0; r < 8; r++) {
      const s = board[r][file]
      if (s && s.type === 'p' && s.color === color) return true
    }
    return false
  }
  try {
    for (let file = 0; file < 8; file++) {
      const whitePawn = fileHasPawn('w', file)
      const blackPawn = fileHasPawn('b', file)
      const open = !whitePawn && !blackPawn
      const semiOpenW = !whitePawn && blackPawn
      const semiOpenB = !blackPawn && whitePawn
      for (let rank = 0; rank < 8; rank++) {
        const s = board[rank][file]
        if (!s || s.type !== 'r') continue
        if (s.color === 'b') {
          if (open) features.rookOpenFiles += 0.35
          else if (semiOpenB) features.semiOpenFiles += 0.2
        } else {
          if (open) features.rookOpenFiles -= 0.35
          else if (semiOpenW) features.semiOpenFiles -= 0.2
        }
      }
    }
  } catch (err) {
    console.error('[evaluatePosition] Error in rook file control:', err)
    throw err
  }

  // -------------------------
  // 🧩 Center control
  // -------------------------
  try {
    for (const [r, f] of [
      [3, 3],
      [3, 4],
      [4, 3],
      [4, 4],
    ] as Array<[number, number]>) {
      const s = board[r][f]
      if (s) features.centerControl += s.color === 'b' ? 0.15 : -0.15
    }
  } catch (err) {
    console.error('[evaluatePosition] Error evaluating center control:', err)
    throw err
  }

  // -------------------------
  // 🧩 King pawn shield
  // -------------------------

  const wKing = kingPos('w', board)
  const bKing = kingPos('b', board)

  try {
    features.pawnShield += pawnShieldPenalty('b', bKing, board)
    features.pawnShield -= pawnShieldPenalty('w', wKing, board)
  } catch (err) {
    console.error('[evaluatePosition] Error evaluating pawn shield:', err)
    throw err
  }

  // -------------------------
  // 🧩 Batteries (aligned heavy pieces)
  // -------------------------
  const isClearLine = (r1: number, f1: number, r2: number, f2: number) => {
    const dr = Math.sign(r2 - r1),
      df = Math.sign(f2 - f1)
    let r = r1 + dr,
      f = f1 + df
    while (r !== r2 || f !== f2) {
      if (board[r][f]) return false
      r += dr
      f += df
    }
    return true
  }
  const addBatteryBonus = (color: 'w' | 'b', bonus: number) => {
    const pieces: Array<{ r: number; f: number; t: PieceType }> = []
    for (let r = 0; r < 8; r++)
      for (let f = 0; f < 8; f++) {
        const s = board[r][f]
        if (
          s &&
          s.color === color &&
          (s.type === 'r' || s.type === 'b' || s.type === 'q')
        )
          pieces.push({ r, f, t: s.type as PieceType })
      }
    for (let i = 0; i < pieces.length; i++)
      for (let j = i + 1; j < pieces.length; j++) {
        const a = pieces[i],
          b = pieces[j]
        const sameRank = a.r === b.r,
          sameFile = a.f === b.f,
          sameDiag = Math.abs(a.r - b.r) === Math.abs(a.f - b.f)
        const compatible =
          sameRank || sameFile
            ? a.t === 'r' || b.t === 'r' || a.t === 'q' || b.t === 'q'
            : sameDiag
            ? a.t === 'b' || b.t === 'b' || a.t === 'q' || b.t === 'q'
            : false
        if (!compatible) continue
        if (isClearLine(a.r, a.f, b.r, b.f))
          features.battery += color === 'b' ? bonus : -bonus
      }
  }
  try {
    addBatteryBonus('b', 0.25)
    addBatteryBonus('w', 0.25)
  } catch (err) {
    console.error('[evaluatePosition] Error adding battery bonus:', err)
    throw err
  }

  // -------------------------
  // 🧩 Discovered attack potential
  // -------------------------
  const addDiscoveredBonus = (color: 'w' | 'b', bonus: number) => {
    const dirsR: Array<[number, number]> = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]
    const dirsB: Array<[number, number]> = [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ]
    const sliders: Array<{
      r: number
      f: number
      dirs: Array<[number, number]>
    }> = []
    for (let r = 0; r < 8; r++)
      for (let f = 0; f < 8; f++) {
        const s = board[r][f]
        if (!s || s.color !== color) continue
        if (s.type === 'r' || s.type === 'q')
          sliders.push({ r, f, dirs: dirsR })
        if (s.type === 'b' || s.type === 'q')
          sliders.push({ r, f, dirs: dirsB })
      }
    for (const sl of sliders) {
      for (const [dr, df] of sl.dirs) {
        let r = sl.r + dr,
          f = sl.f + df,
          blockers = 0
        while (r >= 0 && r < 8 && f >= 0 && f < 8) {
          const s = board[r][f]
          if (s) {
            if (s.color === color) blockers++
            else {
              if (blockers === 1)
                features.battery += color === 'b' ? bonus : -bonus
              break
            }
          }
          r += dr
          f += df
        }
      }
    }
  }
  try {
    addDiscoveredBonus('b', 0.2)
    addDiscoveredBonus('w', 0.2)
  } catch (err) {
    console.error('[evaluatePosition] Error adding discovered bonus:', err)
    throw err
  }

  // -------------------------
  // 🧩 Pawn structure (passed, doubled, isolated)
  // -------------------------
  const filesWithPawns = { w: new Set<number>(), b: new Set<number>() }
  const pawnCountsByFile: { w: number[]; b: number[] } = {
    w: Array(8).fill(0),
    b: Array(8).fill(0),
  }
  try {
    for (let r = 0; r < 8; r++)
      for (let f = 0; f < 8; f++) {
        const s = board[r][f]
        if (!s || s.type !== 'p') continue
        pawnCountsByFile[s.color][f]++
        filesWithPawns[s.color].add(f)
        let passed = true
        const dir = s.color === 'w' ? -1 : 1
        for (let rr = r + dir; rr >= 0 && rr < 8; rr += dir) {
          for (const df of [-1, 0, 1]) {
            const ff = f + df
            if (ff < 0 || ff > 7) continue
            const t = board[rr][ff]
            if (t && t.type === 'p' && t.color !== s.color) passed = false
          }
        }
        if (passed) features.doublePawnPenalty += s.color === 'b' ? 0.35 : -0.35
      }
    for (let f = 0; f < 8; f++) {
      if (pawnCountsByFile.w[f] >= 2) features.doublePawnPenalty -= 0.15
      if (pawnCountsByFile.b[f] >= 2) features.doublePawnPenalty += 0.15
      const isoW =
        !filesWithPawns.w.has(f - 1) &&
        !filesWithPawns.w.has(f + 1) &&
        pawnCountsByFile.w[f] > 0
      const isoB =
        !filesWithPawns.b.has(f - 1) &&
        !filesWithPawns.b.has(f + 1) &&
        pawnCountsByFile.b[f] > 0
      if (isoW) features.doublePawnPenalty -= 0.15
      if (isoB) features.doublePawnPenalty += 0.15
    }
  } catch (err) {
    console.error('[evaluatePosition] Error in pawn structure:', err)
    throw err
  }

  // -------------------------
  // 🧩 Knight outposts & bad bishop
  // -------------------------
  const isPawn = (color: 'w' | 'b', r: number, f: number) => {
    const s = board[r]?.[f]
    return !!(s && s.type === 'p' && s.color === color)
  }
  try {
    for (let r = 0; r < 8; r++)
      for (let f = 0; f < 8; f++) {
        const s = board[r][f]
        if (!s) continue
        if (s.type === 'n') {
          const enemy = s.color === 'w' ? 'b' : 'w'
          const dir = enemy === 'w' ? -1 : 1
          const hasEnemyPawnControl =
            isPawn(enemy, r - dir, f - 1) || isPawn(enemy, r - dir, f + 1)
          if (!hasEnemyPawnControl) {
            const centerDist = Math.min(Math.abs(3.5 - r), Math.abs(3.5 - f))
            const bonus = 0.2 + (1.0 - Math.min(1.0, centerDist / 3)) * 0.1
            features.bishopPair += s.color === 'b' ? bonus : -bonus
          }
        }
        if (s.type === 'b') {
          const dark = (r + f) % 2 === 1
          let sameColorPawns = 0

          for (let rr = 0; rr < 8; rr++)
            for (let ff = 0; ff < 8; ff++) {
              const t = board[rr][ff]
              if (t && t.type === 'p' && t.color === s.color) {
                const tDark = (rr + ff) % 2 === 1
                if (tDark === dark) sameColorPawns++
              }
            }

          // Gradual penalty — small for 3, stronger for 5+
          const penalty = Math.max(0, sameColorPawns - 1) * 0.05
          features.bishopPair += s.color === 'b' ? -penalty : penalty
        }
      }
  } catch (err) {
    console.error('[evaluatePosition] Error in knight/bishop evaluation:', err)
    throw err
  }

  // -------------------------
  // 🧩 King tropism
  // -------------------------
  const kingSquare = (color: 'w' | 'b') => {
    for (let r = 0; r < 8; r++)
      for (let f = 0; f < 8; f++) {
        const s = board[r][f]
        if (s && s.type === 'k' && s.color === color) return { r, f }
      }
    return null
  }
  const wk = kingSquare('w'),
    bk = kingSquare('b')
  const tropism = (
    attacker: 'w' | 'b',
    piece: PieceType,
    r: number,
    f: number
  ) => {
    const target = attacker === 'w' ? bk : wk
    if (!target) return 0
    const dist = Math.abs(target.r - r) + Math.abs(target.f - f)
    const base =
      piece === 'q' ? 0.06 : piece === 'r' ? 0.04 : piece === 'n' ? 0.03 : 0
    return base * (6 - Math.min(6, dist))
  }
  try {
    for (let r = 0; r < 8; r++)
      for (let f = 0; f < 8; f++) {
        const s = board[r][f]
        if (!s) continue
        if (s.type === 'q' || s.type === 'r' || s.type === 'n') {
          const t = tropism(s.color, s.type as PieceType, r, f)
          features.kingTropism += s.color === 'b' ? t : -t
        }
      }
  } catch (err) {
    console.error('[evaluatePosition] Error in king tropism:', err)
    throw err
  }

  // -------------------------
  // 🔸 NEW: Double check detection
  // -------------------------
  try {
    const analyzeDoubleCheckFor = (attacker: 'w' | 'b') => {
      const victim = attacker === 'w' ? 'b' : 'w'
      const kpos = kingPos(victim, board)
      if (!kpos) return 0
      const [kr, kf] = kpos
      // count distinct attackers of king square by scanning (using isAttackedBy but count pieces)
      let attackers = 0
      // check knights
      const knightOffsets = [
        [2, 1],
        [1, 2],
        [-1, 2],
        [-2, 1],
        [-2, -1],
        [-1, -2],
        [1, -2],
        [2, -1],
      ]
      for (const [dr, df] of knightOffsets) {
        const r = kr + dr,
          f = kf + df
        if (r >= 0 && r < 8 && f >= 0 && f < 8) {
          const s = board[r][f]
          if (s && s.color === attacker && s.type === 'n') attackers++
        }
      }
      // pawns
      const pawnDir = attacker === 'w' ? -1 : 1
      for (const df of [-1, 1]) {
        const pr = kr - pawnDir,
          pf = kf - df
        if (pr >= 0 && pr < 8 && pf >= 0 && pf < 8) {
          const s = board[pr][pf]
          if (s && s.color === attacker && s.type === 'p') attackers++
        }
      }
      // kings (adjacent)
      for (let dr = -1; dr <= 1; dr++)
        for (let df = -1; df <= 1; df++) {
          if (dr === 0 && df === 0) continue
          const r = kr + dr,
            f = kf + df
          if (r >= 0 && r < 8 && f >= 0 && f < 8) {
            const s = board[r][f]
            if (s && s.color === attacker && s.type === 'k') attackers++
          }
        }

      // sliders
      const straightDirs: Array<[number, number]> = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]
      for (const [dr, df] of straightDirs) {
        let r = kr + dr,
          f = kf + df
        while (r >= 0 && r < 8 && f >= 0 && f < 8) {
          const s = board[r][f]
          if (s) {
            if (s.color === attacker && (s.type === 'r' || s.type === 'q'))
              attackers++
            break
          }
          r += dr
          f += df
        }
      }
      const diagDirs: Array<[number, number]> = [
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ]
      for (const [dr, df] of diagDirs) {
        let r = kr + dr,
          f = kf + df
        while (r >= 0 && r < 8 && f >= 0 && f < 8) {
          const s = board[r][f]
          if (s) {
            if (s.color === attacker && (s.type === 'b' || s.type === 'q'))
              attackers++
            break
          }
          r += dr
          f += df
        }
      }
      return attackers >= 2 ? (attacker === 'b' ? 0.5 : -0.5) : 0
    }

    features.doubleCheck += analyzeDoubleCheckFor('b')
    features.doubleCheck += analyzeDoubleCheckFor('w')
  } catch (err) {
    console.error('[evaluatePosition] Error detecting double checks:', err)
    throw err
  }

  // -------------------------
  // 🔸 NEW: Pin detection
  // -------------------------
  try {
    const addPinPenalty = (color: 'w' | 'b') => {
      const k = kingPos(color, board)
      if (!k) return 0
      const [kr, kf] = k
      let penalty = 0
      const directions: Array<[number, number]> = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ]
      for (const [dr, df] of directions) {
        let r = kr + dr,
          f = kf + df
        let blocker: { r: number; f: number } | null = null
        while (r >= 0 && r < 8 && f >= 0 && f < 8) {
          const s = board[r][f]
          if (s) {
            if (s.color === color) {
              if (!blocker) blocker = { r, f }
              else break // second friendly blocks this line
            } else {
              // enemy piece
              if (blocker) {
                // is the enemy a slider that can attack along this direction?
                const enemyType = s.type
                const straight = dr === 0 || df === 0
                const diagonal = Math.abs(dr) === Math.abs(df)
                if (
                  enemyType === 'q' ||
                  (enemyType === 'r' && straight) ||
                  (enemyType === 'b' && diagonal)
                ) {
                  // a pinned friendly piece
                  penalty += color === 'b' ? -0.3 : 0.3
                }
              }
              break
            }
          }
          r += dr
          f += df
        }
      }
      return penalty
    }

    features.pin += addPinPenalty('b')
    features.pin += addPinPenalty('w')
  } catch (err) {
    console.error('[evaluatePosition] Error detecting pins:', err)
    throw err
  }

  const indexToSquare = (r: number, f: number) =>
    `${String.fromCharCode(97 + f)}${8 - r}`

  const getLegalMovesForSquare = (
    pieceColor: 'w' | 'b',
    r: number,
    f: number
  ) => {
    const sq = indexToSquare(r, f)
    try {
      const fenParts = chess.fen().split(' ')
      fenParts[1] = pieceColor // set side to move
      const tmpChess = new Chess(fenParts.join(' '))
      // chess.js expects the square as type Square (e.g., "e4"), not string literal
      // so must cast sq as Square to match type signature
      return tmpChess.moves({ square: sq as Square, verbose: true }) || []
    } catch (err) {
      return []
    }
  }
  // -------------------------
  // 🔸 NEW: Trapped piece detection (by legal-move count)
  // -------------------------
  try {
    const addTrappedPiecePenalty = (color: 'w' | 'b') => {
      let penalty = 0
      for (let r = 0; r < 8; r++)
        for (let f = 0; f < 8; f++) {
          const s = board[r][f]
          if (!s || s.color !== color) continue
          if (s.type === 'n' || s.type === 'b' || s.type === 'q') {
            const legal = getLegalMovesForSquare(color, r, f)
            // If a piece has very few legal moves => likely trapped or low-mobility
            if (legal.length <= 2) penalty += color === 'b' ? -0.2 : 0.2
          }
        }
      return penalty
    }

    features.trappedPiece += addTrappedPiecePenalty('b')
    features.trappedPiece += addTrappedPiecePenalty('w')
  } catch (err) {
    console.error('[evaluatePosition] Error detecting trapped pieces:', err)
    throw err
  }

  // -------------------------
  // 🔸 NEW: Knight fork detection
  // -------------------------
  try {
    const addKnightForkBonus = (color: 'w' | 'b') => {
      let bonus = 0
      const knightMoves = [
        [2, 1],
        [1, 2],
        [-1, 2],
        [-2, 1],
        [-2, -1],
        [-1, -2],
        [1, -2],
        [2, -1],
      ]
      for (let r = 0; r < 8; r++)
        for (let f = 0; f < 8; f++) {
          const s = board[r][f]
          if (!s || s.color !== color || s.type !== 'n') continue
          let threats = 0
          for (const [dr, df] of knightMoves) {
            const rr = r + dr,
              ff = f + df
            if (rr < 0 || rr > 7 || ff < 0 || ff > 7) continue
            const target = board[rr][ff]
            // count high-value targets: queen or rook (you can add pawns/minors if desired)
            if (
              target &&
              target.color !== color &&
              (target.type === 'q' || target.type === 'r')
            )
              threats++
            // also consider if the knight attacks king (very strong)
            if (target && target.color !== color && target.type === 'k')
              threats += 2
          }
          // reward forks that threaten 2 or more significant targets
          if (threats >= 2) bonus += color === 'b' ? 0.4 : -0.4
        }
      return bonus
    }

    features.fork += addKnightForkBonus('b')
    features.fork += addKnightForkBonus('w')
  } catch (err) {
    console.error('[evaluatePosition] Error detecting knight forks:', err)
    throw err
  }

  return features
}

export function evaluatePosition(fen: string): number {
  let score = 0

  const f = extractFeatures(fen)

  // Top polynomial + interaction terms
  score += 0.3884 * (f.material * f.doublePawnPenalty)
  score += 0.3776 * (f.material * f.material)
  score += 0.2123 * (f.material * f.fork)
  score += 0.1912 * (f.centerControl * f.bishopPair)
  score += 0.1629 * (f.trappedPiece * f.trappedPiece)
  score += 0.1542 * (f.material * f.trappedPiece)
  score += 0.1438 * (f.rookOpenFiles * f.battery)
  score += 0.1298 * (f.rookOpenFiles * f.doublePawnPenalty)
  score += 0.1285 * (f.bishopPair * f.battery)
  score += 0.1256 * (f.semiOpenFiles * f.battery)
  score += 0.1249 * (f.material * f.rookOpenFiles)
  score += 0.1245 * (f.semiOpenFiles * f.kingTropism)
  score += 0.1233 * (f.pawnShield * f.trappedPiece)
  score += 0.1129 * (f.rookOpenFiles * f.fork)
  score += 0.1119 * (f.centerControl * f.fork)

  // Add small base terms if needed
  score += 0.05 * f.material // base influence

  return score
}
