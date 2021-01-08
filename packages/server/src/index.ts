import 'common/env';
import Server from 'common/server';
import WebsocketServer from 'ws/server';
import routes from 'routes';

const port = parseInt(process.env.PORT || '3000');

const server = new Server().router(routes);
server.listen(port);

if (!server.httpServer) {
    throw new Error(`Did not successfully initialize http server on startup.`);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const wsServer = new WebsocketServer(server.httpServer);

export default Server;
