import { Request, Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';

import { EthNetwork } from '@sommelier/shared-types';

import { HTTPError } from 'api/util/errors';
import { memoConfig, UniswapV3Fetchers } from 'services/uniswap-v3';
import { GetPositionsResult } from '@sommelier/shared-types/src/api'; // how do we export at root level?
import catchAsyncRoute from 'api/util/catch-async-route';
import { networkValidator } from 'api/util/validators';
import validateEthAddress from 'api/util/validate-eth-address';

import config from '@config';

const networks = Object.keys(config.uniswap.v3.networks);


type Path = {
    network: EthNetwork;
    address: string;
};

const getPositionsValidator = celebrate({
    [Segments.PARAMS]: Joi.object().keys({
        network: Joi.string()
            .valid(...networks)
            .required(),
        address: Joi.string()
            .custom(validateEthAddress, 'Validate address')
            .required(),
    })
});

// GET /positions/:address
async function getPositionStats(
    req: Request<Path, unknown, unknown, unknown>,
): Promise<any> {
    const { network, address } = req.params;
    const fetcher = UniswapV3Fetchers.get(network);

    const position = await fetcher.getPositions(address);

    const snapshots = positions.reduce((acc, position) => {
        const [nflpId, ] = position.id.split('#');

        if (!acc[nflpId]) {
            acc[nflpId] = [position];
        } else {
            acc[nflpId].push(position);
        }

        return acc;
    }, {});

    


    // get sizes
    // token0 size
    // token1 size
    // usd size
    // token0 at entry
    // token1 at entry
    // usd at entry

    // get fees
    // fees collected
    // impermanent loss
    // get total return
    // calculate APY

}


const route = Router();
const cacheConfig = { public: true };
// sMaxAge: 5 min in seconds
const positionsConfig = {
    maxAge: 30,
    sMaxAge: memoConfig.getTopPools.ttl / 1000,
    ...cacheConfig,
};
// TODO: Revisit
const historyConfig = { maxAge: 5 * 60, sMaxAge: 60 * 60, ...cacheConfig };
route.get(
    '/:network/positions/:address/stats',
    networkValidator,
    catchAsyncRoute(getPositionStats, positionsConfig),
);

export default route;