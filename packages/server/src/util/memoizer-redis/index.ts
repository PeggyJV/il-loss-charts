import Redis from 'ioredis';
import crypto from 'crypto';

import { hourMs, secondMs } from 'util/date';
import lockFactory from 'util/memoizer-redis/lock';

// Not allowed to specify keyPrefix when memoizing a function
interface MemoizerOptions {
  lookupTimeout: number, // how long to wait on redis.get
  ttl: number, // how long the value should be cached for in ms
  hashArgs: (args: Array<any>) => string, // function to hash args
};

// Set keyPrefix when creating the memoizer factory
interface MemoizerFactoryOptions extends MemoizerOptions {
  keyPrefix: string, // namespace, recommend commit sha
  lockTimeout: number, // how long to attempt to get a lock
  lockRetry: number, // how long to wait before trying to aquire a lock again
}

export const defaultOptions: MemoizerFactoryOptions = {
  lookupTimeout: secondMs * 4,
  ttl: hourMs,
  keyPrefix: '',
  hashArgs: sha1,
  lockTimeout: secondMs * 2,
  lockRetry: 50,
};

export default function memoizerFactory(client: Redis.Redis, opts: Partial<MemoizerFactoryOptions> = {}) {
  const prefix = opts.keyPrefix?.length ? `:${opts.keyPrefix}` : defaultOptions.keyPrefix;
  const keyPrefix = `memo${prefix}`;
  const memoizerFactoryOptions = {
    ...defaultOptions,
    ...opts,
    keyPrefix,
  };

  const lock = lockFactory(client, memoizerFactoryOptions);

  // memoizes a fn
  return function memoizer<T>(fn: T, opts: Partial<MemoizerOptions> = {}) {
    if (typeof fn !== 'function') {
      throw new Error('Only functions can be memoized');
    }
    const fnKey = fn.name;
    const {
      lookupTimeout,
      lockTimeout,
      lockRetry,
      keyPrefix,
      ttl,
      hashArgs
    } = { ...memoizerFactoryOptions, ...opts };

    // the actual memoized function
    return async function memoized(...args: Array<any>): Promise<ReturnType<<T>() => T>> {
      const cacheKey = getCacheKey(keyPrefix, fnKey, hashArgs(args));

      // lookup in redis first
      const firstLookup = await lookup(client, cacheKey, lookupTimeout);
      if (firstLookup != null) {
        // cache hit, return result
        return firstLookup;
      }

      // couldn't find the value in redis, we may need to execute the fn ourselves and update redis
      const unlock = await lock(cacheKey, lockTimeout, lockRetry);

      // Check once more to see if it was written during another lock
      let finalResult = await lookup(client, cacheKey, lookupTimeout);

      // if our 2nd lookup was empty, we have to do work and update the cache
      if (finalResult == null) {
        // fine, we have to do the work now
        finalResult = await fn(...args);
        await writeKey(client, cacheKey, finalResult, ttl);
      }

      // dont wait for the unlock
      unlock();

      return finalResult;
    }
  }
}

export function sha1(args: Array<any>): string {
  return crypto.createHash('sha1').update(JSON.stringify(args)).digest('hex');
}

export function getCacheKey(keyPrefix: string, fnKey: string, argsKey: string): string {
  return `${keyPrefix}:${fnKey}:${argsKey}`;
}

export async function lookup(client: Redis.Redis, cacheKey: string, lookupTimeout: number): Promise<any | void> {
  const getPromise = client.get(cacheKey);
  const timeout = new Promise(resolve => setTimeout(resolve, lookupTimeout));

  // try to fetch from redis until timeout is exceeded
  const result = await Promise.race([getPromise, timeout]);
  if (result != null) {
    return deserialize(result);
  }
}

export async function writeKey(client: Redis.Redis, cacheKey: string, data: any, ttl: number) {
  const serialized = serialize(data);
  await client.set(cacheKey, serialized, 'PX', ttl);
}

// TODO: Compress serialized data
export function serialize(data: any): string {
  return JSON.stringify(data);
}
export function deserialize(data: any): any {
  try {
    return JSON.parse(data);
  } catch (error) {
    const msg = 'Could not deserialize data from Redis.'
    console.error(msg);

    throw new Error(msg);
  }
}