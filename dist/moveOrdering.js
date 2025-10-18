"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderMoves = orderMoves;
function orderMoves(moves) {
    return moves.sort((a, b) => {
        const aCap = a.captured ? 1 : 0;
        const bCap = b.captured ? 1 : 0;
        if (bCap - aCap)
            return bCap - aCap;
        const aCheck = a.san.includes('+') || a.san.includes('#') ? 1 : 0;
        const bCheck = b.san.includes('+') || b.san.includes('#') ? 1 : 0;
        if (bCheck - aCheck)
            return bCheck - aCheck;
        const aPromo = a.flags.includes('p') ? 1 : 0;
        const bPromo = b.flags.includes('p') ? 1 : 0;
        if (bPromo - aPromo)
            return bPromo - aPromo;
        return 0;
    });
}
