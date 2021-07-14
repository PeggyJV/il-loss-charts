import { hourMs, minuteMs } from 'util/date';
import { Pool } from 'services/uniswap-v3/generated-types';
import {
    GetEthPriceResult,
    GetPoolDailyDataResult,
    GetPoolHourlyDataResult,
    GetPoolOverviewResult,
    GetTopPoolsResult,
    GetPositionsResult,
    GetPositionSnapshotsResult,
} from '@sommelier/shared-types/src/api'; // how do we export at root level?
import { UniswapFetcher, UniswapV3Fetcher } from 'services/uniswap-v3/fetcher';
import appConfig from '@config';
import memoizer from 'util/memoizer-redis';
import redis from 'util/redis';

const config = appConfig.memoizerRedis;

// If these are changed, you must update the sMaxAge value configured
// when mounting the route
// TODO: Move this to config and review TTLs
// TODO: Make this automatically update cache control settings
// which is not straight forward becaouse redis ttl is in ms and cache control in s
export const memoConfig = {
    getEthPrice: { ttl: minuteMs * 1 },
    getPoolOverview: { ttl: minuteMs * 5 },
    getTopPools: { ttl: minuteMs * 5 },
    getHistoricalDailyData: { ttl: hourMs * 1 },
    getHistoricalHourlyData: { ttl: hourMs * 1 },
    getPositions: { ttl: minuteMs * 10 },
    getPositionSnapshots: { ttl: minuteMs * 10 },
};

// Proxy for UniswapV3Fetcher where functions are memoized
export class UniswapV3FetcherMemoized implements UniswapFetcher {
    private memoize: ReturnType<typeof memoizer>;
    public fetcher: UniswapV3Fetcher;
    public network: string;

    constructor(fetcher: UniswapV3Fetcher, network: string) {
        // N.B. If you change the config of this memoizer, you may need to update config
        // in the cache warmer worker for parity!
        this.memoize = memoizer(redis, {
            keyPrefix: network,
            enabled: config.enabled,
        });
        this.fetcher = fetcher;
        this.network = network;
    }

    // TODO: figure out how to DRY this up and keep types
    getEthPrice(blockNumber?: number): Promise<GetEthPriceResult> {
        const config = memoConfig.getEthPrice;
        const fn: UniswapFetcher['getEthPrice'] = this.memoize(
            this.fetcher.getEthPrice.bind(this.fetcher),
            config,
        );
        return fn(blockNumber);
    }

    getPoolOverview(
        poolId: string,
        blockNumber?: number,
    ): Promise<GetPoolOverviewResult> {
        const config = memoConfig.getPoolOverview;
        const fn: UniswapFetcher['getPoolOverview'] = this.memoize(
            this.fetcher.getPoolOverview.bind(this.fetcher),
            config,
        );
        return fn(poolId, blockNumber);
    }

    getTopPools(
        count: number,
        orderBy: keyof Pool,
    ): Promise<GetTopPoolsResult> {
        const config = memoConfig.getTopPools;
        const fn: UniswapFetcher['getTopPools'] = this.memoize(
            this.fetcher.getTopPools.bind(this.fetcher),
            config,
        );
        return fn(count, orderBy);
    }

    // not memoized
    getPoolDailyDataLastDays(
        poolId: string,
        count: number,
    ): Promise<GetPoolDailyDataResult> {
        const fn = this.fetcher.getPoolDailyDataLastDays.bind(this.fetcher);
        return fn(poolId, count);
    }

    // not memoized
    getPoolDailyData(
        poolId: string,
        start: Date,
        end: Date,
    ): Promise<GetPoolDailyDataResult> {
        const fn = this.fetcher.getPoolDailyData.bind(this.fetcher);
        return fn(poolId, start, end);
    }

    // not memoized
    getPoolHourlyData(
        poolId: string,
        start: Date,
        end: Date,
    ): Promise<GetPoolHourlyDataResult> {
        const fn = this.fetcher.getPoolHourlyData.bind(this.fetcher);
        return fn(poolId, start, end);
    }

    getHistoricalDailyData(
        poolId: string,
        start: Date,
        end: Date,
    ): Promise<GetPoolDailyDataResult> {
        const config = memoConfig.getHistoricalDailyData;
        const fn: UniswapFetcher['getHistoricalDailyData'] = this.memoize(
            this.fetcher.getHistoricalDailyData.bind(this.fetcher),
            config,
        );
        return fn(poolId, start, end);
    }

    getHistoricalHourlyData(
        poolId: string,
        start: Date,
        end: Date,
    ): Promise<GetPoolHourlyDataResult> {
        const config = memoConfig.getHistoricalHourlyData;
        const fn: UniswapFetcher['getHistoricalHourlyData'] = this.memoize(
            this.fetcher.getHistoricalHourlyData.bind(this.fetcher),
            config,
        );
        return fn(poolId, start, end);
    }

    getPositions(owner: string): Promise<GetPositionsResult> {
        const config = memoConfig.getPositions;
        const fn: UniswapFetcher['getPositions'] = this.memoize(
            this.fetcher.getPositions.bind(this.fetcher),
            config,
        );
        return fn(owner);
    }

    getPositionSnapshots(owner: string): Promise<GetPositionSnapshotsResult> {
        const config = memoConfig.getPositionSnapshots;
        const fn: UniswapFetcher['getPositionSnapshots'] = this.memoize(
            this.fetcher.getPositionSnapshots.bind(this.fetcher),
            config,
        );
        return fn(owner);
    }
}
