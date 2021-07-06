import { Request, Router } from 'express';
import { EthNetwork } from '@sommelier/shared-types';

// import { HTTPError } from 'api/util/errors';
import { memoConfig, UniswapV3Fetchers } from 'services/uniswap-v3';
// import { GetPositionsResult } from '@sommelier/shared-types/src/api'; // how do we export at root level?
import catchAsyncRoute from 'api/util/catch-async-route';
import { networkValidator } from 'api/util/validators';

type Path = {
    network: EthNetwork;
};

// GET /positions/:address
async function getPositions(
    req: Request<Path, unknown, unknown, unknown>,
    // ): Promise<GetPositionsResult> {
): Promise<boolean> {
    // const { network } = req.params;
    // const fetcher = UniswapV3Fetchers.get(network);

    return await Promise.resolve(true);
}

const route = Router();
const cacheConfig = { public: true };
// sMaxAge: 5 min in seconds
const positionsConfig = {
    maxAge: 30,
    sMaxAge: memoConfig.getTopPools.ttl / 1000,
    ...cacheConfig,
};

route.get(
    '/:network/positions/:address',
    networkValidator,
    catchAsyncRoute(getPositions, positionsConfig),
);

export default route;
