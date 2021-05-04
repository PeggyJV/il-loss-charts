import { hourMs, minuteMs } from 'util/date';
import { Pool } from 'services/uniswap-v3/generated-types';
import {
    GetEthPriceResult,
    GetPoolDailyDataResult,
    GetPoolHourlyDataResult,
    GetPoolOverviewResult,
    GetTopPoolsResult,
} from '@sommelier/shared-types/src/api'; // how do we export at root level?
import { UniswapFetcher, UniswapV3Fetcher } from 'services/uniswap-v3/fetcher';
import appConfig from 'config';
import memoizer from 'util/memoizer-redis';
import redis from 'util/redis';

const config = appConfig.memoizerRedis;

// TODO: Move this to config and review TTLs
const memoConfig = {
    getEthPrice: { ttl: minuteMs * 1 },
    getPoolOverview: { ttl: minuteMs * 6 },
    getTopPools: { ttl: minuteMs * 6 }, // 6 minutes, the cache warmer updates every 5
    getHistoricalDailyData: { ttl: hourMs * 1 },
    getHistoricalHourlyData: { ttl: hourMs * 1 },
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
            config
        );
        return fn(blockNumber);
    }

    getPoolOverview(
        poolId: string,
        blockNumber?: number
    ): Promise<GetPoolOverviewResult> {
        const config = memoConfig.getPoolOverview;
        const fn: UniswapFetcher['getPoolOverview'] = this.memoize(
            this.fetcher.getPoolOverview.bind(this.fetcher),
            config
        );
        return fn(poolId, blockNumber);
    }

    getTopPools(
        count: number,
        orderBy: keyof Pool
    ): Promise<GetTopPoolsResult> {
        const config = memoConfig.getTopPools;
        const fn: UniswapFetcher['getTopPools'] = this.memoize(
            this.fetcher.getTopPools.bind(this.fetcher),
            config
        );
        return fn(count, orderBy);
    }

    // not memoized
    getPoolDailyData(
        poolId: string,
        start: Date,
        end: Date
    ): Promise<GetPoolDailyDataResult> {
        const fn = this.fetcher.getPoolDailyData.bind(this.fetcher);
        return fn(poolId, start, end);
    }

    // not memoized
    getPoolHourlyData(
        poolId: string,
        start: Date,
        end: Date
    ): Promise<GetPoolHourlyDataResult> {
        const fn = this.fetcher.getPoolHourlyData.bind(this.fetcher);
        return fn(poolId, start, end);
    }

    getHistoricalDailyData(
        poolId: string,
        start: Date,
        end: Date
    ): Promise<GetPoolDailyDataResult> {
        const config = memoConfig.getHistoricalDailyData;
        const fn: UniswapFetcher['getHistoricalDailyData'] = this.memoize(
            this.fetcher.getHistoricalDailyData.bind(this.fetcher),
            config
        );
        return fn(poolId, start, end);
    }

    getHistoricalHourlyData(
        poolId: string,
        start: Date,
        end: Date
    ): Promise<GetPoolHourlyDataResult> {
        const config = memoConfig.getHistoricalHourlyData;
        const fn: UniswapFetcher['getHistoricalHourlyData'] = this.memoize(
            this.fetcher.getHistoricalHourlyData.bind(this.fetcher),
            config
        );
        return fn(poolId, start, end);
    }
}
