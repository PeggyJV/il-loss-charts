import { Request, Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';

import { EthNetwork } from '@sommelier/shared-types';

import { HTTPError } from 'api/util/errors';
import { memoConfig, UniswapV3Fetchers } from 'services/uniswap-v3';
import {
    GetPositionsResult,
    GetPositionSnapshotsResult,
    V3PositionData,
} from '@sommelier/shared-types/src/api'; // how do we export at root level?
import catchAsyncRoute from 'api/util/catch-async-route';
import { networkValidator } from 'api/util/validators';
import validateEthAddress from 'api/util/validate-eth-address';
import { calculateStatsForNFLPs } from 'util/calculate-stats-v3';

import config from '@config';

const networks = Object.keys(config.uniswap.v3.networks);

type Path = {
    network: EthNetwork;
    address: string;
};

type V3PositionDataList = { [key: string]: V3PositionData };

const getPositionsValidator = celebrate({
    [Segments.PARAMS]: Joi.object().keys({
        network: Joi.string()
            .valid(...networks)
            .required(),
        address: Joi.string()
            .custom(validateEthAddress, 'Validate address')
            .required(),
    }),
});

// GET /positions/:address
async function getPositionStats(
    req: Request<Path, unknown, unknown, unknown>,
): Promise<V3PositionDataList> {
    const { network, address } = req.params;
    const fetcher = UniswapV3Fetchers.get(network);

    const positions = await fetcher.getPositions(address);
    const snapshots = await fetcher.getPositionSnapshots(address);

    const snapshotsByNFLP = snapshots.reduce(
        (acc: { [key: string]: GetPositionSnapshotsResult }, snapshot) => {
            // TODO: Deploy a new subgraph which uses a delineator
            // between NFLP and timestamp. Right now we assume last 10
            // digits are timestamp.
            const nflpId = snapshot.id.slice(0, -10);

            if (!acc[nflpId]) {
                acc[nflpId] = [snapshot];
            } else {
                acc[nflpId].push(snapshot);
            }

            return acc;
        },
        {},
    );

    const results: V3PositionDataList = {};
    for (const position of positions) {
        const [nflpId] = position.id.split('#');

        results[nflpId] = {
            position,
            snapshots: snapshotsByNFLP[nflpId],
            stats: await calculateStatsForNFLPs(
                position,
                snapshotsByNFLP[nflpId],
            ),
        };
    }

    return results;
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
    '/:network/positions/:address/stats',
    getPositionsValidator,
    catchAsyncRoute(getPositionStats, positionsConfig),
);

export default route;
