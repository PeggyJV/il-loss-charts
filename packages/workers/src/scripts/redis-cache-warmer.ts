/* eslint-disable @typescript-eslint/restrict-template-expressions, @typescript-eslint/ban-ts-comment */
import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client/core';
import dotenv from 'dotenv';
import fetch from 'cross-fetch';
import Redis from 'ioredis';

import {
    apolloClients,
    memoizer,
    UniswapV3Fetcher,
} from '@sommelier/data-service';

// load .env
dotenv.config();

// configure apollo
const uri =
    process.env.V3_SUBGRAPH_URL ||
    'http://35.197.14.14:8000/subgraphs/name/sommelier/uniswap-v3';
const link = new HttpLink({ uri, fetch });
const cache = new InMemoryCache();
const client = new ApolloClient({ link, cache });

// @ts-ignore not sure why this is throwing... somethign off with the import, script works
const sdk = apolloClients.getUniswapV3Sdk(client);

// configure redis
const redisPort = process.env.REDIS_PORT ?? '6379';
const redisDb = process.env.REDIS_DB ?? '0';
const redisConfig = {
    host: process.env.REDIS_URL ?? '127.0.0.1',
    port: parseInt(redisPort, 10),
    db: parseInt(redisDb, 10),
};
const redis = new Redis(redisConfig);

// cache config
const cacheTimeoutStr =
    process.env.CACHE_TIMEOUT_TOP_POOLS ?? (1000 * 60 * 6).toString(); // 6 min
const cacheTimeoutMs = parseInt(cacheTimeoutStr, 10);
const network = process.env.CACHE_WARMER_NETWORK ?? 'rinkeby';

// memoizer config
const memoConfig = {
    lockTimeout: 1000 * 30, // attempt to acquire lock for 30 seconds
    lockRetry: 50, // spin on lock every 50ms
    ttl: cacheTimeoutMs,
};
const memo = memoizer(redis, { keyPrefix: network });
const v3Fetcher = new UniswapV3Fetcher(sdk);
const getTopPools = memo(v3Fetcher.getTopPools.bind(v3Fetcher), memoConfig);
const getPoolOverview = memo(
    v3Fetcher.getPoolOverview.bind(v3Fetcher),
    memoConfig
);

// This script is meant to be scheduled and run on an interval by cron.
// We want to keep the top pools query cache warmed up on mainnet at all times
// since it is the most frequently used route by the app.

// fetch top pools from subgraph with default options
const count = 1000;
const sort = 'volumeUSD';

// number of top pools to keep warm
const poolCountStr = process.env.TOP_POOL_COUNT ?? '10';
const poolCount = parseInt(poolCountStr, 10);

export default async function run(): Promise<void> {
    // this function already validates null and length 0 pools
    // it will also throw on error, so only valid data will be cached
    console.log('Fetching Top Pools and updating cache');
    console.time('update-top-pools-elapsed');

    const topPools = await getTopPools.forceUpdate(count, sort);
    console.timeEnd('update-top-pools-elapsed');

    if (topPools == null) {
        // we were unable to get a lock, throw and log error
        throw new Error('Unable to get lock to update top pool');
    }

    console.log(`Fetched Top Pools, count: ${topPools.length}`);

    const top = topPools.slice(0, poolCount);
    const topSymbols = top.map(poolName);

    console.log(`Updating pool data for top ${poolCount} pools ${topSymbols}`);
    for (const pool of top) {
        const poolId = `${poolName(pool)}-${pool.id}`;
        console.time(`update-pool-${poolId}-elapsed`);

        // must pass undefined to match signature of original call
        const result = await getPoolOverview.forceUpdate(pool.id, undefined);
        console.timeEnd(`update-pool-${poolId}-elapsed`);

        if (result == null) {
            // we were unable to get a lock, log error
            console.error(`Could not update cache for pool: ${poolId}`);
        }
    }
}

function poolName(pool: any) {
    if (!pool || !pool.token0 || !pool.token1) {
        console.error(`Could not get pool name for: ${JSON.stringify(pool)}`);
        return '';
    }

    const { token0, token1 } = pool;

    return `${token0.symbol || ''}-${token1.symbol || ''}`;
}

void (async function () {
    await run();

    process.exit();
})();
