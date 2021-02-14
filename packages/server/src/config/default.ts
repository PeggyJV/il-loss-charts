import AppConfig from 'types/app-config';

const config: AppConfig = {
    redisHost: process.env.REDIS_URL || '127.0.0.1',
    redisPort: 6379,
};

export default config;
