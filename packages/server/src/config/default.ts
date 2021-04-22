import AppConfig from 'types/app-config';

const config: AppConfig = {
    redisHost: process.env.REDIS_URL || '127.0.0.1',
    redisPort: process.env.REDIS_PORT
        ? parseInt(process.env.REDIS_PORT, 10)
        : 6379,
    memoizerRedis: {
        enabled: true,
    },
    uniswap: {
        v3: {
            networks: {
                mainnet: 'http://35.197.14.14:8000/subgraphs/name/sommelier/uniswap-v3',
                rinkeby: 'http://35.197.14.14:8000/subgraphs/name/sommelier/uniswap-v3',
                goerli: 'http://35.197.14.14:8000/subgraphs/name/sommelier/uniswap-v3',
                ropsten: 'http://35.197.14.14:8000/subgraphs/name/sommelier/uniswap-v3',
                kovan: 'http://35.197.14.14:8000/subgraphs/name/sommelier/uniswap-v3',
            }
        }
    },
    port: process.env.PORT || '3001',
    requestLimit: process.env.REQUEST_LIMIT || '10kb',
    openApiSpec: '/api/v1/spec',
    enableResponseValidation: false
};

export default config;
