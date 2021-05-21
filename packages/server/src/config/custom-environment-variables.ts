export default {
    env: 'NODE_ENV',
    logLevel: 'LOG_LEVEL',
    server: {
        host: 'API_SERVER_HOST',
        port: 'API_SERVER_PORT',
    },
    redis: {
        host: 'REDIS_URL',
        port: 'REDIS_PORT',
        db: ' REDIS_DB',
        password: 'REDIS_AUTH',
    },
    memoizerRedis: {
        enabled: {
            __name: 'API_MEMOIZER_ENABLED',
            __format: 'boolean',
        },
    },
    uniswap: {
        v3: {
            networks: {
                mainnet: 'V3_SUBGRAPH_URL',
            },
        },
    },
    infura: {
        projectId: 'INFURA_PROJECT_ID',
    },
    bitquery: {
        apiKey: 'BITQUERY_API_KEY',
    },
    mixpanel: {
        apiKey: 'MIXPANEL_TOKEN',
    },
    session: {
        secret: 'SESSION_SECRET',
    },
    requestLimit: 'REQUEST_LIMIT',
    enableResponseValidation: {
        __name: 'API_RESPONSE_VALIDATION',
        __format: 'boolean',
    },
};
