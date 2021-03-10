import config from 'config';
import Redis from 'ioredis';

let redis: Redis.Redis;

try {
    redis = new Redis({
        port: config.redisPort,
        host: config.redisHost,
        password: process.env.REDIS_AUTH
    });
} catch (e) {
    console.error(`Error connecting to redis at ${config.redisHost}:${config.redisPort}: ${e.message as string}`);
    throw e;
}

// Authenticate with redis

export default redis;
