import server from 'common/server';
import WebsocketServer from 'ws/server';
import config from '@config';

function startServer() {
    const port = config.server.port;

    server.listen(port);

    if (!server.httpServer) {
        throw new Error(
            `Did not successfully initialize http server on startup.`,
        );
    }

    new WebsocketServer(server.httpServer);
}

if (require.main === module) {
    startServer();
}

export default server;
