import AppConfig from 'types/app-config';

const config: AppConfig = {
    redisHost: process.env.REDIS_URL || '127.0.0.1',
    redisPort: process.env.REDIS_PORT
        ? parseInt(process.env.REDIS_PORT, 10)
        : 6379,
    redisDataCache: {
        enabled: true,
    },
    port: process.env.PORT || '3001',
    requestLimit: process.env.REQUEST_LIMIT || '10kb',
    openApiSpec: '/api/v1/spec',
    enableResponseValidation: false
};

export default config;
