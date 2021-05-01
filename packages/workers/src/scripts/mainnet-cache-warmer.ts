import {
    ApolloClient,
    HttpLink,
    InMemoryCache,
} from '@apollo/client/core';
import dotenv from 'dotenv';
import fetch from 'cross-fetch';
import Redis from 'ioredis';

import { apolloClients, defaultConfig, memoizer, UniswapV3Fetcher } from '@sommelier/data-service';

// load .env
dotenv.config();

// configure apollo
const uri = process.env.V3_SUBGRAPH_URL || 'http://35.197.14.14:8000/subgraphs/name/sommelier/uniswap-v3';
const link = new HttpLink({ uri, fetch });
const cache = new InMemoryCache();
const client = new ApolloClient({ link, cache });

// @ts-ignore not sure why this is throwing... somethign off with the import, script works
const sdk = apolloClients.getUniswapV3Sdk(client);
const v3Fetcher = new UniswapV3Fetcher(sdk);

// configure our fetch function with automatic retry
const maxRetriesStr = process.env.MAX_RETRY_TOP_POOLS ?? '5';
const maxRetries = parseInt(maxRetriesStr, 10);
async function getTopPools(retry = 0): Promise<any> {
  if (retry > maxRetries) {
    throw new Error('Could not getTopPools, max retries exceeded');
  }

  try {
    // fetch top pools data
    return v3Fetcher.getTopPools(count, sort);
  } catch (error) {
    // try again until max is hit
    return getTopPools(retry + 1);
  }
}

// configure redis
const redisPort = process.env.REDIS_PORT ?? '6379';
const redisDb = process.env.REDIS_DB ?? '0';
const redisConfig = {
  host: process.env.REDIS_URL ?? '127.0.0.1',
  port: parseInt(redisPort, 10),
  db: parseInt(redisDb, 10),
};
const redis = new Redis(redisConfig);

// setup redis locker
const { lockFactory } = memoizer;
const lockConfig = {
  lockTimeout: 1000 * 10, // 10 seconds
  lockRetry: 100, // spin every 100 ms
};
const lock = lockFactory(redis, lockConfig);

// cache config
const cacheKey = `memo:mainnet:${defaultConfig.memoizerRedis.cacheKeyOverrides.topPoolsMainnet}`;
const cacheTimeoutStr = process.env.CACHE_TIMEOUT_TOP_POOLS ?? (1000 * 60 * 6).toString() // 6 min
const cacheTimeoutMs = parseInt(cacheTimeoutStr, 10);

// This script is meant to be scheduled and run on an interval by cron.
// We want to keep the top pools query cache warmed up on mainnet at all times
// since it is the most frequently used route by the app.

// fetch top pools from subgraph with default options
const count = 1000;
const sort = 'volumeUSD';

export default async function run () {
  // this function already validates null and length 0 pools
  // it will also throw on error, so only valid data will be cached
  console.log('Fetching Top Pools');
  console.time('fetch-top-pools-elapsed');
  const topPools = await getTopPools();
  console.timeEnd('fetch-top-pools-elapsed');
  console.log(`Fetched Top Pools, count: ${topPools.length}`);

  // get a lock so server memoizer can't update in parallel and
  // pass in the same key that the server uses for this call
  console.log(`Attempting to get lock on key: ${cacheKey}`);
  console.time('lock-elapsed');
  const unlock = await lock(cacheKey);
  console.timeEnd('lock-elapsed');

  if (!unlock) {
    throw new Error(`Could not acquire lock on key: ${cacheKey}`);
  }
  
  // cache our data
  console.time('update-cache-elapsed');
  const data = memoizer.serialize(topPools);
  await memoizer.writeKey(redis, cacheKey, data, cacheTimeoutMs);
  console.timeEnd('update-cache-elapsed');

  console.time('unlock-elapsed');
  await unlock();
  console.timeEnd('unlock-elapsed');
}