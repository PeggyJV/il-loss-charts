import server from 'common/server';
import WebsocketServer from 'ws/server';
import config from 'config';

function startServer() {
    const port = parseInt(config.port);

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

import memoizer from 'util/memoizer-redis';

import * as apolloClients from 'services/util/apollo-client';
import { calculateMarketStats } from 'util/calculate-stats';
import { UniswapV3Fetcher } from 'services/uniswap-v3/fetcher'
import UniswapFetcher from 'services/uniswap';
import BitqueryFetcher from 'services/bitquery/fetcher';
import { _getPeriodIndicators } from 'api/controllers/market-data';

export {
    _getPeriodIndicators,
    apolloClients,
    BitqueryFetcher,
    calculateMarketStats,
    memoizer,
    UniswapFetcher,
    UniswapV3Fetcher,
};
