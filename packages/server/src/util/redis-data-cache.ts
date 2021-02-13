import Redis from 'ioredis';

export function keepCachePopulated(
    redis: Redis.Redis,
    fn: (...args: any[]) => any,
    args: any[],
    interval = 60
): void {
    const callFn = async (attempt = 0) => {
        const redisKey = [
            fn.name,
            ...args.map((arg) => JSON.stringify(arg)),
        ].join(':');

        try {
            const result = await fn(...args);

            await redis.set(
                redisKey,
                JSON.stringify(result),
                'EX',
                (interval + 300) * 1000
            );

            return; // cache succcessfully populated
        } catch (err) {
            // If more than 5 attempts, don't try to populate cache
            if (attempt >= 5) {
                console.error(`Could not populate cache for ${redisKey}`);
                return;
            }

            console.log(`Retrying attempt ${attempt} for ${redisKey}`);

            // Wait for 5 seconds then try again
            await new Promise((resolve) => setTimeout(resolve, 5000));
            await callFn(++attempt);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const callInterval: NodeJS.Timeout = <any>setInterval(() => {
        void callFn();
    }, interval);

    // Unref prevents the interval from blocking app shutdown
    callInterval.unref();
}

export function wrapWithCache(
    redis: Redis.Redis,
    fn: (...args: any[]) => any,
    expiry = 30,
    populate = false
): (...args: any[]) => any {
    const wrappedFn = async (...args: any[]): Promise<any> => {
        // Try cache first
        const redisKey = [
            fn.name,
            ...args.map((arg) => JSON.stringify(arg)),
        ].join(':');
        let result: any;
        try {
            const cachedResult = await redis.get(redisKey);
            if (cachedResult) {
                result = JSON.parse(cachedResult);
            }
        } catch (e) {
            console.error(`Could not fetch value from cache for ${redisKey}`);
        }

        if (!result) {
            // Need to explicitly fetch
            result = await fn(...args);
            // Set result in cache
            await redis.set(redisKey, JSON.stringify(result), 'EX', expiry);

            // Since cache not populated, keep it populated if arg is set
            if (populate) {
                console.log(`Auto-populating cache for ${redisKey}`);
                keepCachePopulated(redis, fn, args, expiry);
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return result;
    };

    return wrappedFn;
}

// API Cache should
// Take a redis connection
// Take a list of functions with arguments and an interval
// For each function:
// Set up polling to fetch result of calling function every 'interval'
// Translate funtion with arg to redis signature (:-delineated)
// Every interval, set the key in redis
