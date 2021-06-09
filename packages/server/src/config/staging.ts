import { RecursivePartial } from 'types/shared';

import type { AppConfig } from '@config';

const config: RecursivePartial<AppConfig> = {
    server: {
        host: 'https://dev.sommelier.finance',
    },
    uniswap: {
        v3: {
            networks: {
                mainnet:
                    'http://graph-node-mainnet.us-west1.gcp.somm.network:8080/subgraphs/name/sommelier/uniswap-v3',
            },
        },
    },
};

export default config;
