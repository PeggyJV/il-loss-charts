import { deferConfig as defer } from 'config/defer';
// Custom environment variable resolution is defined in config/custom-environment-variables.json
// N.B. node-config's parser will correctly detect strings / numbers and parse them correctly
// booleans are parsed as strings must be defined with a __format: boolean to be parsed correctly.
const config = {
    pid: process.pid,
    env: 'development',
    logLevel: 'info',
    server: {
        host: 'http://localhost:3000',
        port: 3001,
        shutdownTimeout: 30 * 1000, // 30 seconds
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
                    'https://api.thegraph.com/subgraphs/name/benesjan/uniswap-v3-subgraph',
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
        contracts: {
            NONFUNGIBLE_POSITION_MANAGER:
                '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
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
    firebase: {
        serviceAccount: '',
    },
    session: {
        secret: '',
    },
    pools: {
        shortLinkBaseUrl: 'https://dev.somm.fi',
        deepLinkBaseUrl: defer(function (): string {
            const conf = this.default ?? this;
            const host: string = conf?.server?.host ?? '';
            return `${host}/pools`;
        }),
    },
    requestLimit: '10kb',
    openApiSpec: '/api/v1/spec',
    enableResponseValidation: false,
};

export default config;
