
import AppConfig from 'types/app-config';
import { RecursivePartial } from 'types/shared';

const config: RecursivePartial<AppConfig> = {
    uniswap: {
        v3: {
            networks: {
                mainnet: 'http://graph-node-mainnet.us-west1.gcp.somm.network:8080/subgraphs/name/sommelier/uniswap-v3',
            }
        }
    },
};

export default config;
