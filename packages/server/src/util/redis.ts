import config from 'config';
import Redis from 'ioredis';

const redis = new Redis({
    port: config.redisPort,
    host: config.redisHost,
});

export default redis;
