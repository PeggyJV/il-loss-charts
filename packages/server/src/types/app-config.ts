export type Environments = 'production' | 'development' | 'test' | 'staging';

export default interface AppConfig {
    server: {
        host: string;
    };
    redis: {
        host: string;
        port: number;
        db: number;
        password: string;
    };
    memoizerRedis: {
        enabled: boolean;
    };
    uniswap: {
        v3: {
            networks: {
                mainnet: string;
                rinkeby: string;
                goerli: string;
                ropsten: string;
                kovan: string;
            };
        };
    };
    requestLimit: string;
    openApiSpec: string;
    enableResponseValidation: boolean;
}
