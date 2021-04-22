export type Environments = 'production' | 'development' | 'test' | 'staging';

export default interface AppConfig {
    redisHost: string;
    redisPort: number;
    memoizerRedis: {
        enabled: boolean,
    },
    uniswap: {
        v3: {
            networks: {
                mainnet: string,
                rinkeby: string,
                goerli: string,
                ropsten: string,
                kovan: string,
            }
        }
    }
    port: string;
    requestLimit: string;
    openApiSpec: string;
    enableResponseValidation: boolean;
}
