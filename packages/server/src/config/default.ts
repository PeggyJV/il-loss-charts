import AppConfig from 'types/app-config';

const config: AppConfig = {
    server: {
        host: 'http://localhost:3000',
    },
    redis: {
        host: process.env.REDIS_URL || '127.0.0.1',
        port: process.env.REDIS_PORT
            ? parseInt(process.env.REDIS_PORT, 10)
            : 6379,
        db: 0,
    },
    memoizerRedis: {
        enabled: true,
    },
    uniswap: {
        v3: {
            networks: {
                mainnet: process.env.V3_SUBGRAPH_URL ?? 'http://localhost:8000/subgraphs/name/sommelier/uniswap-v3',
                rinkeby: 'http://35.197.14.14:8000/subgraphs/name/sommelier/uniswap-v3-2',
                goerli: 'http://35.197.14.14:8000/subgraphs/name/sommelier/uniswap-v3-2',
                ropsten: 'http://35.197.14.14:8000/subgraphs/name/sommelier/uniswap-v3-2',
                kovan: 'http://35.197.14.14:8000/subgraphs/name/sommelier/uniswap-v3-2',
            }
        }
    },
    port: process.env.PORT || '3001',
    requestLimit: process.env.REQUEST_LIMIT || '10kb',
    openApiSpec: '/api/v1/spec',
    enableResponseValidation: false
};

export default config;
