"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_js_1 = require("react-dom/client.js");
const App_js_1 = __importDefault(require("./App.js"));
require("./index.css");
(0, client_js_1.createRoot)(document.getElementById('root')).render(<App_js_1.default />);
