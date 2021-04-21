import 'common/env';
import server from 'common/server';
import WebsocketServer from 'ws/server';
import config from 'config';


function startServer() {
    const port = parseInt(config.port);

    server.mountExplorer();
    server.listen(port);

    if (!server.httpServer) {
        throw new Error(
            `Did not successfully initialize http server on startup.`
        );
    }

    new WebsocketServer(server.httpServer);
}

if (require.main === module) {
    startServer();
}

export default server;

// Other exports for other packages

import UniswapFetcher from 'services/uniswap';
import { calculateMarketStats } from 'util/calculate-stats';

export { UniswapFetcher, calculateMarketStats };
