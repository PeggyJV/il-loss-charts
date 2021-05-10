
import AppConfig from 'types/app-config';
import { RecursivePartial } from 'types/shared';

const config: RecursivePartial<AppConfig> = {
    server: {
        host: 'https://dev.sommelier.finance',
    },
    uniswap: {
        v3: {
            networks: {
                mainnet: process.env.V3_SUBGRAPH_URL ?? 'http://graph-node-mainnet.us-west1.gcp.somm.network:8080/subgraphs/name/sommelier/uniswap-v3',
            }
        }
    },
};

export default config;
