"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = __importDefault(require("ws"));
const logger_1 = __importDefault(require("common/logger"));
class WebsocketServer {
    constructor(httpServer) {
        this.connections = [];
        this._server = new ws_1.default({ server: httpServer });
        this.onConnection();
    }
    onConnection() {
        this._server.on('connection', (ws) => {
            logger_1.default.log('Client connected', ws);
            this.connections.push(ws);
            ws.on('close', () => logger_1.default.log('Client disconnected'));
        });
    }
}
exports.default = WebsocketServer;
//# sourceMappingURL=server.js.map