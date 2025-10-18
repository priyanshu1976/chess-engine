"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchBestMove = void 0;
const express_1 = __importDefault(require("express"));
const search2_1 = require("./search2");
Object.defineProperty(exports, "searchBestMove", { enumerable: true, get: function () { return search2_1.searchBestMove; } });
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: '*',
}));
app.get('/health', (_req, res) => {
    res.json({ ok: true });
});
app.post('/best-move', (req, res) => {
    var _a, _b;
    try {
        const { fen, depth = 3, collectTree = false, maxNodes = 200, } = (_a = req.body) !== null && _a !== void 0 ? _a : {};
        if (typeof fen !== 'string' || !fen.trim()) {
            return res.status(400).json({ error: 'Invalid or missing fen' });
        }
        console.log(fen);
        const result = (0, search2_1.searchBestMove)(fen);
        return res.json({
            bestMoveSAN: result,
        });
    }
    catch (err) {
        return res.status(500).json({ error: (_b = err === null || err === void 0 ? void 0 : err.message) !== null && _b !== void 0 ? _b : 'Server error' });
    }
});
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server listening on http://localhost:${PORT}`);
    });
}
