import http from 'http';
import ws from 'ws';
import logger from 'common/logger';
import WsMessageHandler from 'ws/message-handler';

export default class WebsocketServer {
    static WS_PATH = '/realtime';

    _server: ws.Server;
    connections: ws[] = [];
    handlers: WsMessageHandler[] = [];

    constructor(server: http.Server) {
        this._server = new ws.Server({ server, path: WebsocketServer.WS_PATH });

        this.onConnection();
    }

    onConnection(): void {
        this._server.on('connection', (ws, req) => {
            const ip = req.socket.remoteAddress;
            logger.info(`Client connected: ${ip}`);
            this.connections.push(ws);
            this.handlers.push(new WsMessageHandler(ws))
            ws.on('close', () => logger.info('Client disconnected'));
        });
    }
}
