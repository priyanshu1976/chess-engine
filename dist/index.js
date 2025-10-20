"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const searchBestMoveParallel_1 = require("./searchBestMoveParallel");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: '*',
}));
// ✅ Health check
app.get('/health', (_req, res) => {
    res.json({ ok: true });
});
// ✅ POST /best-move
app.post('/best-move', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { fen, depth = 5 } = (_a = req.body) !== null && _a !== void 0 ? _a : {};
        if (typeof fen !== 'string' || !fen.trim()) {
            return res.status(400).json({ error: 'Invalid or missing FEN' });
        }
        console.log(`♟️ Searching best move for FEN: ${fen} (Depth: ${depth})`);
        const bestFen = yield (0, searchBestMoveParallel_1.searchBestMoveParallel)(fen, depth);
        if (!bestFen) {
            return res.status(500).json({ error: 'Failed to find best move' });
        }
        console.log('✅ Best move found. New FEN:', bestFen);
        return res.json({
            success: true,
            bestMoveSAN: bestFen,
        });
    }
    catch (err) {
        console.error('❌ Error in /best-move route:', err);
        return res.status(500).json({ error: (_b = err === null || err === void 0 ? void 0 : err.message) !== null && _b !== void 0 ? _b : 'Server error' });
    }
}));
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}
