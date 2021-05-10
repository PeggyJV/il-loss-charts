/* eslint-disable @typescript-eslint/restrict-template-expressions, @typescript-eslint/ban-ts-comment */
import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client/core';
import { endOfDay, startOfDay, subDays } from 'date-fns';
import dotenv from 'dotenv';
import fetch from 'cross-fetch';
import Redis from 'ioredis';

import {
    _getPeriodIndicators,
    apolloClients,
    BitqueryFetcher,
    memoizer,
    UniswapV3Fetcher,
} from '@sommelier/data-service';

// load .env
dotenv.config();

// configure apollo
const uri =
    process.env.V3_SUBGRAPH_URL ||
    'http://localhost:8000/subgraphs/name/sommelier/uniswap-v3';
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


// memoizer config
const memoConfig = {
    lockTimeout: 1000 * 30, // attempt to acquire lock for 30 seconds
    lockRetry: 50, // spin on lock every 50ms
};
const v3Fetcher = new UniswapV3Fetcher(sdk);
const getTopPools = v3Fetcher.getTopPools.bind(v3Fetcher);

const bqMemo = memoizer(redis, { ttl: 1000 * 60 * 60 * 1, ...memoConfig }) // 1hr
const getPeriodIndicators = bqMemo(_getPeriodIndicators);
const getLastDayOHLC = bqMemo(BitqueryFetcher.getLastDayOHLC.bind(BitqueryFetcher));

// This script is meant to be scheduled and run on an interval by cron.
// We want to keep the top pools query cache warmed up on mainnet at all times
// since it is the most frequently used route by the app.

// fetch top pools from subgraph with default options
const count = 1000;
const sort = 'volumeUSD';

// number of top pools to keep warm
const poolCountStr = process.env.TOP_POOL_COUNT ?? '40';
const poolCount = parseInt(poolCountStr, 10);

export async function run(): Promise<void> {
    console.log('Fetching Top Pools and updating cache');
    // track token pairs we've warmed
    const filter: Set<string> = new Set();

    const topPools = await getTopPools(count, sort);
    console.log(`Fetched Top Pools, count: ${topPools.length}`);

    const top = topPools.slice(0, poolCount * 5) // get more than we need
        // filter duplicate token pairs out
        .filter((pool: any) => {
            const name = poolId(pool);
            if (filter.has(name)) {
                return false;
            }

            filter.add(name);
            return true;
        }).slice(0, poolCount); // get what we need

    // chunk pools in groups of 5
    const chunks = chunk(top, 5);
    for (const chunk of chunks) {
        await Promise.all(chunk.map(async (pool) => updatePoolCache(pool)));
    }
}
// this needs to stay in lockstep with the default days for the /marketData/indicators routte
const periodDaysStr = process.env.PERIOD_DAYS ?? '19';
const periodDays = parseInt(periodDaysStr, 10);

async function updatePoolCache(pool: any) {
    const name = poolId(pool);
    // bail if we've already updated market data for this token pair

    const baseToken = pool.token1.id;
    const quoteToken = pool.token0.id;

    try {
        console.log(`Fetching Daily: ${name}`)
        // TODO: remove daily data fetch after client refactor
        // get daily data
        await getLastDayOHLC.forceUpdate(baseToken, quoteToken);
    } catch (error) {
        console.error(`Unable to update daily data: ${name}: ${error.message ?? ''}`);
    }

    // calculate period for fetching indicators, must be same as client code
    const now = new Date();
    const endDate = endOfDay(now).getTime();
    const startDate = startOfDay(subDays(now, periodDays)).getTime();

    try {
        console.log(`Fetching Indicators: ${name}`)
        await getPeriodIndicators.forceUpdate(baseToken, quoteToken, startDate, endDate);
    } catch (error) {
        console.error(`Unable to update indicator data: ${name} - ${error.message ?? ''}`);

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

function poolId(pool: any) {
    if (!pool || !pool.token0 || !pool.token1) {
        console.error(`Could not get pool name for: ${JSON.stringify(pool)}`);
        return '';
    }

    const { token0, token1 } = pool;
    return `${poolName(pool)}-${token0.id.substr(-8)}-${token1.id.substr(-8)}`;
}

function chunk (a: Array<any>, size: number): Array<Array<any>> {
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