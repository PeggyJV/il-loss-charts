import 'common/env';
import server from 'common/server';
import WebsocketServer from 'ws/server';
import config from 'config';


function startServer() {
    const port = parseInt(config.port);

    // TODO: figure out why YAML.load during mountExplorer breaks when running jest and start with tests
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

import * as memoizer from 'util/memoizer-redis';
import * as apolloClients from 'services/util/apollo-client';
import { calculateMarketStats } from 'util/calculate-stats';
import { UniswapV3Fetcher } from 'services/uniswap-v3/fetcher'
import defaultConfig from 'config/default';
import UniswapFetcher from 'services/uniswap';

export {
    apolloClients,
    calculateMarketStats,
    defaultConfig,
    memoizer,
    UniswapFetcher,
    UniswapV3Fetcher,
};
