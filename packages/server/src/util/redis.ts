import config from 'config';
import Redis from 'ioredis';

let redis: Redis.Redis;
const { host, port, db } = config.redis;

try {
    redis = new Redis({ host, port, db });
} catch (e) {
    console.error(`Error connecting to redis at ${host}:${port}: ${e.message as string}`);
    throw e;
}

export default redis;