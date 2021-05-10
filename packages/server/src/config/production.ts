import AppConfig from 'types/app-config';
import { RecursivePartial } from 'types/shared';

const config: RecursivePartial<AppConfig> = {
    server: {
        host: 'https://app.sommelier.finance',
    },
    redis: {
        host: '10.5.80.12',
        port: 6379
    },
    uniswap: {
        v3: {
            networks: {
                mainnet: 'http://graph-node-mainnet.us-west1.gcp.somm.network:8080/subgraphs/name/sommelier/uniswap-v3',
            }
        }
    },
};

export default config;
