// Custom environment variable resolution is defined in config/custom-environment-variables.json
// N.B. node-config's parser will correctly detect strings / numbers and parse them correctly
// booleans are parsed as strings must be defined with a __format: boolean to be parsed correctly.
const config = {
    env: 'development',
    logLevel: 'info',
    server: {
        host: 'http://localhost:3000',
        port: 3001,
    },
    redis: {
        host: '127.0.0.1',
        port: 6379,
        db: 0,
        password: '',
    },
    memoizerRedis: {
        enabled: true,
    },
    uniswap: {
        v3: {
            networks: {
                mainnet:
                    'http://localhost:8000/subgraphs/name/sommelier/uniswap-v3-history',
                rinkeby:
                    'http://35.197.14.14:8000/subgraphs/name/sommelier/uniswap-v3-2',
                goerli:
                    'http://35.197.14.14:8000/subgraphs/name/sommelier/uniswap-v3-2',
                ropsten:
                    'http://35.197.14.14:8000/subgraphs/name/sommelier/uniswap-v3-2',
                kovan:
                    'http://35.197.14.14:8000/subgraphs/name/sommelier/uniswap-v3-2',
            },
        },
    },
    infura: {
        projectId: '',
    },
    bitquery: {
        apiKey: '',
    },
    mixpanel: {
        apiKey: '',
    },
    session: {
        secret: '',
    },
    requestLimit: '10kb',
    openApiSpec: '/api/v1/spec',
    enableResponseValidation: false,
};

export default config;
