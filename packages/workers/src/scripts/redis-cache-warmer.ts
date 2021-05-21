/* eslint-disable @typescript-eslint/restrict-template-expressions, @typescript-eslint/ban-ts-comment */
import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client/core';
import { endOfDay, startOfDay, subDays } from 'date-fns';
import fetch from 'cross-fetch';
import Redis from 'ioredis';
import logger from '../logger';
import appConfig from 'config/app';

const log = logger.child({ worker: 'redis-cache-warmer' });
const {
    v3SubgraphUrl,
    redisUrl,
    redisPort,
    redisDb,
    redisPw,
    periodDays,
    topPoolCount: poolCount,
} = appConfig.redisCacheWarmer;

import {
    _getPeriodIndicators,
    apolloClients,
    BitqueryFetcher,
    memoizer,
    UniswapV3Fetcher,
} from '@sommelier/data-service';

// configure apollo
const link = new HttpLink({ uri: v3SubgraphUrl, fetch });
const cache = new InMemoryCache();
const client = new ApolloClient({ link, cache });

// @ts-ignore not sure why this is throwing... somethign off with the import, script works
const sdk = apolloClients.getUniswapV3Sdk(client);

// configure redis
let redisConfig: Record<string, any> = {
    host: redisUrl,
    port: redisPort,
    db: redisDb,
};
if (redisPw != null && redisPw.length > 0) {
    redisConfig = { ...redisConfig, password: redisPw };
}
const redis = new Redis(redisConfig);

// memoizer config
const memoConfig = {
    lockTimeout: 1000 * 30, // attempt to acquire lock for 30 seconds
    lockRetry: 50, // spin on lock every 50ms
};
const v3Fetcher = new UniswapV3Fetcher(sdk);
const getTopPools = v3Fetcher.getTopPools.bind(v3Fetcher);

const bqMemo = memoizer(redis, { ttl: 1000 * 60 * 60 * 1, ...memoConfig }); // 1hr
const getPeriodIndicators = bqMemo(_getPeriodIndicators);
const getLastDayOHLC = bqMemo(
    BitqueryFetcher.getLastDayOHLC.bind(BitqueryFetcher),
);

// This script is meant to be scheduled and run on an interval by cron.
// We want to keep the top pools query cache warmed up on mainnet at all times
// since it is the most frequently used route by the app.

// fetch top pools from subgraph with default options
const count = 1000;
const sort = 'volumeUSD';

export async function run(): Promise<void> {
    // track token pairs we've warmed
    const filter: Set<string> = new Set();

    const topPools = await getTopPools(count, sort);
    log.info({
        msg: `Fetched ${topPools.length} top pools`,
        count: topPools.length,
    });

    const top = topPools
        .slice(0, poolCount * 5) // get more than we need
        // filter duplicate token pairs out
        .filter((pool: any) => {
            const name = poolId(pool);
            if (filter.has(name)) {
                return false;
            }

            filter.add(name);
            return true;
        })
        .slice(0, poolCount); // get what we need

    // chunk pools in groups of 5
    const chunks = chunk(top, 5);
    for (const chunk of chunks) {
        await Promise.all(chunk.map(async (pool) => updatePoolCache(pool)));
    }
}

async function updatePoolCache(pool: any) {
    const name = poolName(pool);
    // bail if we've already updated market data for this token pair

    const baseToken = pool.token1.id;
    const quoteToken = pool.token0.id;

    try {
        // TODO: remove daily data fetch after client refactor
        // get daily data
        await getLastDayOHLC.forceUpdate(baseToken, quoteToken);
        log.info({ msg: `Fetched daily data: ${name}`, pool: name });
    } catch (error) {
        log.error({
            msg: `Unable to update daily data: ${name}`,
            pool: name,
            error: error.message ?? '',
        });
    }

    // calculate period for fetching indicators, must be same as client code
    const now = new Date();
    const endDate = endOfDay(now).getTime();
    const startDate = startOfDay(subDays(now, periodDays)).getTime();

    try {
        await getPeriodIndicators.forceUpdate(
            baseToken,
            quoteToken,
            startDate,
            endDate,
        );
        log.info({ msg: `Fetched indicators: ${name}`, pool: name });
    } catch (error) {
        log.error({
            msg: `Unable to update indicator data: ${name}`,
            pool: name,
            error: error.message ?? '',
        });
    }
}

function poolName(pool: any) {
    if (!pool || !pool.token0 || !pool.token1) {
        return '';
    }

    const { token0, token1 } = pool;

    return `${token0.symbol || ''}-${token1.symbol || ''}`;
}

function poolId(pool: any) {
    if (!pool || !pool.token0 || !pool.token1) {
        return '';
    }

    const { token0, token1 } = pool;
    return `${poolName(pool)}-${token0.id.substr(-8)}-${token1.id.substr(-8)}`;
}

function chunk(a: Array<any>, size: number): Array<Array<any>> {
    if (Array.length === 0) return [];

    const chunks: Array<Array<any>> = [[]];

    for (const el of a) {
        let chunk = chunks[chunks.length - 1];
        if (chunk.length === size) {
            chunk = [];
            chunks.push(chunk);
        }

        chunk.push(el);
    }

    return chunks;
}
