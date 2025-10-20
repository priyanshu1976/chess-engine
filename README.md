# ♟️ Chess Engine

A TypeScript-based **Chess Engine** built from scratch that simulates how professional engines like Stockfish think — including **position evaluation**, **heuristic scoring**, and **parallel move search using multi-threading**.  

This project is perfect for anyone curious about how computers play chess, from developers and students to AI enthusiasts.

---

## 🔍 Overview

This project explores the **internal working** of a chess engine — from the **evaluation function** that assigns numerical scores to positions, to the **search algorithms** that simulate future moves and pick the best one.  

You can integrate this engine into a frontend UI or run it as a backend service to get the best move for any FEN (Forsyth–Edwards Notation) position.

---

## 🧠 Core Concepts

- **Heuristic Evaluation Function:** Uses piece values, piece-square tables, king safety, and positional heuristics to assign a score to any board position.  
- **Move Generation:** Generates all legal moves using the chess.js library.  
- **Minimax with Alpha-Beta Pruning:** Searches through possible future positions to find the optimal move.  
- **Multi-Threading (Worker Threads):** Parallelizes move evaluation to improve search efficiency and performance.  
- **FEN Support:** Takes any valid FEN string as input for analysis.  

---

## ⚙️ Features

- ✅ Accurate position evaluation  
- ✅ Multi-threaded search for faster performance  
- ✅ FEN string parsing  
- ✅ Move generation and scoring visualization  
- ✅ Easily extendable and open-source  

---

## 🧩 API Reference

#### Evaluate a position

```http
POST /api/evaluate



Response:

{
  "bestMove": "e2e4",
  "evaluation": 0.65
}

Get Best Move (Multi-threaded)
POST /api/search

Parameter	Type	Description
fen	string	Required. FEN string for which to find the best move
depth	number	Optional. Default is 3
🚀 Demo

🎥 Video Explanation: YouTube – How Chess Engine Works Internally

🧠 Live Demo: Coming soon...

🖥️ Installation

To deploy or run locally:

git clone https://github.com/priyanshupatel/chess-engine.git
cd chess-engine
npm install
npm run dev

🧾 Environment Variables

Create a .env file in the root directory and add:
