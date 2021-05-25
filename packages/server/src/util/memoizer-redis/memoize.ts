import appConfig from '@config';
import memoizer from './index';
import redis from 'util/redis';

const config = appConfig.memoizerRedis;

// Root Memoizer
export const memoize = memoizer(redis, {
    enabled: config.enabled,
});
