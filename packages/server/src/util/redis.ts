import config from 'config';
import Redis from 'ioredis';

let redis: Redis.Redis;
const { host, port, db, password } = config.redis;

let redisConfig: Record<string, any> = { host, port, db };
if (password != null && password.length > 0) {
    redisConfig = { ...redisConfig, password };
}


try {
    redis = new Redis(redisConfig);
} catch (e) {
    console.error(`Error connecting to redis at ${host}:${port}: ${e.message as string}`);
    throw e;
}

export default redis;