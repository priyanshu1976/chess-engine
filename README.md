# ♟️ Chess Engine

A TypeScript-based **Chess Engine** built from scratch that models the thinking processes of professional engines (like Stockfish): **position evaluation**, **heuristic scoring**, and **parallel move search using multi-threading**.

This project is designed for anyone curious about how computers play chess — including developers, students, and AI enthusiasts.

---

## 🔍 Overview

This project explains the **internal workings** of a chess engine: from the **evaluation function** that assigns numerical scores to positions, to the **search algorithms** that simulate possible futures and pick the best move.

You can use this engine in a frontend UI or run it as a backend service to find the best move from any FEN (Forsyth–Edwards Notation) position.

---

## 🧠 Core Concepts

- **Heuristic Evaluation Function:** Uses piece values, piece-square tables, king safety, and other positional heuristics to evaluate board states.
- **Move Generation:** Generates all legal moves using [chess.js](https://github.com/jhlywa/chess.js).
- **Minimax with Alpha-Beta Pruning:** Efficiently searches through positions to find optimal moves.
- **Multi-Threading (Worker Threads):** Evaluates moves in parallel for better performance.
- **FEN Support:** Accepts any valid FEN string for analysis.

---

## ⚙️ Features

- ✅ Accurate position evaluation
- ✅ Multi-threaded search for high performance
- ✅ FEN string parsing
- ✅ Move generation and scoring visualization
- ✅ Easily extendable and open-source

---

## 🧩 API Reference

### Evaluate a Position

**Request**

```http
POST /api/evaluate
Content-Type: application/json

{
  "fen": "<FEN_STRING>"
}
```

**Response**

```json
{
  "bestMove": "e2e4",
  "evaluation": 0.65
}
```

---

### Get Best Move (Multi-threaded)

**Request**

```http
POST /api/search
Content-Type: application/json

{
  "fen": "<FEN_STRING>",
  "depth": 3  // Optional, default is 3
}
```

**Parameters**

| Parameter | Type   | Description                           |
| --------- | ------ | ------------------------------------- |
| fen       | string | **Required.** FEN string to analyze   |
| depth     | number | _Optional._ Search depth (default: 3) |

---

## 🚀 Demo

- 🎥 [Video Explanation – How Chess Engine Works Internally](https://youtu.be/TZz2ynMxxEQ?si=iucOAwzsSGLR0o4e)

---

## 🖥️ Installation

To deploy or run locally:

```bash
git clone https://github.com/priyanshupatel/chess-engine.git
cd chess-engine
npm install
npm run dev
```
