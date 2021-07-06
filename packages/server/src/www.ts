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

    process.on('SIGINT', () => {
        // attempt graceful shutdown
        server
            .shutdown('SIGINT')
            .then(() => {
                process.exit();
            })
            .catch(() => {
                // shutdown anyway
                process.exit();
            });
    });

    process.on('SIGTERM', () => {
        // attempt graceful shutdown
        server.shutdown('SIGINT').finally(() => {
            process.exit();
        });
    });
}

if (require.main === module) {
    startServer();
}

export default server;
