import config from 'config';
import Redis from 'ioredis';

const redis = new Redis({
    port: config.redisPort,
    host: config.redisHost,
    password: process.env.REDIS_AUTH
});

// Authenticate with redis

export default redis;
