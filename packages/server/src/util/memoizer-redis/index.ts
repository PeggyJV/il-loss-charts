/* eslint-disable @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-unsafe-return  */
import Redis from 'ioredis';
import crypto from 'crypto';

import { delay } from 'util/promise';
import { hourMs, secondMs } from 'util/date';
import lockFactory from 'util/memoizer-redis/lock';

// https://github.com/microsoft/TypeScript/issues/27711
// Fixes issue with Promise<Promise<T>>
// TODO: Put this in util once we have to utilize it again
export type Promise<A extends any> = globalThis.Promise<
    A extends globalThis.Promise<infer X> ? X : A
>;

// Not allowed to specify keyPrefix when memoizing a function
export interface MemoizerOptions {
    lookupTimeout: number; // how long to wait on redis.get
    lockTimeout: number; // how long to attempt to get a lock
    lockRetry: number; // how long to wait before trying to aquire a lock again
    ttl: number; // how long the value should be cached for in ms
    hashArgs: (args: Array<any>) => string; // function to hash args
}

// Set keyPrefix when creating the memoizer factory
interface MemoizerFactoryOptions extends MemoizerOptions {
    enabled: boolean; // enables or disables memoization
    keyPrefix: string; // namespace, recommend commit sha
}

export const defaultOptions: MemoizerFactoryOptions = {
    enabled: true,
    lookupTimeout: secondMs * 4,
    ttl: hourMs,
    keyPrefix: '',
    hashArgs: sha1,
    lockTimeout: secondMs * 2,
    lockRetry: 50,
};

export default function memoizerFactory(
    client: Redis.Redis,
    opts: Partial<MemoizerFactoryOptions> = {},
) {
    // map of memoized functions
    // TODO: rip this out, you may want to memoized versions of a fns with different options
    const memoizedFns = new Map();

    const prefix = opts.keyPrefix?.length
        ? `:${opts.keyPrefix}`
        : defaultOptions.keyPrefix;
    const keyPrefix = `memo${prefix}`;
    const memoizerFactoryOptions = {
        ...defaultOptions,
        ...opts,
        keyPrefix,
    };

    const lock = lockFactory(client, memoizerFactoryOptions);

    // memoizes a fn
    return function memoizer<T>(
        fn: (...args: Array<any>) => Promise<T>,
        fnOpts: Partial<MemoizerOptions> = {},
    ) {
        if (typeof fn !== 'function') {
            throw new Error('Only functions can be memoized');
        }

        // noop if the memoizer is disabled (for testing)
        if (!memoizerFactoryOptions.enabled) {
            return fn;
        }

        // fn.bind(this) name becomes "bound fn"
        // split on the space and get the last part to find correct name
        const fnParts = fn.name.split(' ');
        const fnKey = fnParts[fnParts.length - 1];

        const {
            lookupTimeout,
            lockTimeout,
            lockRetry,
            keyPrefix,
            ttl,
            hashArgs,
        } = { ...memoizerFactoryOptions, ...fnOpts };

        // Don't memoize functions in this namespace more than once
        const fnNamespace = getFnNamespace(keyPrefix, fnKey);
        let memoized = memoizedFns.get(fnNamespace);
        if (typeof memoized === 'function') {
            return memoized;
        }

        // the actual memoized function
        memoized = async function memoized(...args: Array<any>): Promise<T> {
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
            }

            // only update cache if we were able to get a lock
            if (typeof unlock === 'function') {
                await writeKey(client, cacheKey, finalResult, ttl);

                // dont wait for the unlock
                void unlock();
            }

            return finalResult;
        };

        // Force a cache update
        memoized.forceUpdate = async (
            ...args: any[]
        ): Promise<T | undefined> => {
            // get the cache key
            const cacheKey = getCacheKey(keyPrefix, fnKey, hashArgs(args));

            // do the work
            const data = await fn(...args);

            // lock so other processes can't update
            const unlock = await lock(cacheKey, lockTimeout, lockRetry);

            if (unlock) {
                // only update cache if we were able to get a lock
                await writeKey(client, cacheKey, data, ttl);

                // don't wait for the unlock
                void unlock();

                // we return the data for the happy case
                return data;
            }

            // return null if we were unable to update the cache
        };

        memoizedFns.set(fnNamespace, memoized);
        return memoized;
    };
}

export function sha1(args: Array<any>): string {
    return crypto.createHash('sha1').update(JSON.stringify(args)).digest('hex');
}

export function getFnNamespace(keyPrefix: string, fnKey: string): string {
    return `${keyPrefix}:${fnKey}`;
}

export function getCacheKey(
    keyPrefix: string,
    fnKey: string,
    argsKey: string,
): string {
    return `${getFnNamespace(keyPrefix, fnKey)}:${argsKey}`;
}

export async function lookup(
    client: Redis.Redis,
    cacheKey: string,
    lookupTimeout: number,
): Promise<any | void> {
    const getPromise = client.get(cacheKey);
    const timeout = delay(lookupTimeout);

    // try to fetch from redis until timeout is exceeded
    const result = await Promise.race([getPromise, timeout]);
    if (result != null) {
        return deserialize(result);
    }
}

export async function writeKey(
    client: Redis.Redis,
    cacheKey: string,
    data: any,
    ttl: number,
) {
    const serialized = serialize(data);
    await client.set(cacheKey, serialized, 'PX', ttl);
}

// TODO: Compress serialized data
export function serialize(data: any): string {
    return JSON.stringify(data);
}

export function deserialize(data: any): any {
    return JSON.parse(data);
}

export { lockFactory };

export * from './memoize';
