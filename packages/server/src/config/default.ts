import AppConfig from 'types/app-config';

const config: AppConfig = {
    redisHost: process.env.REDIS_URL || '127.0.0.1',
    redisPort: process.env.REDIS_PORT
        ? parseInt(process.env.REDIS_PORT, 10)
        : 6379,
};

export default config;
