import { RecursivePartial } from 'types/shared';

import type { AppConfig } from '@config';

const config: RecursivePartial<AppConfig> = {
    server: {
        host: 'https://app.sommelier.finance',
    },
    uniswap: {
        v3: {
            networks: {
                mainnet:
                    'https://api.thegraph.com/subgraphs/name/benesjan/uniswap-v3-subgraph',
            },
        },
    },
    pools: {
        shortLinkBaseUrl: 'https://somm.fi',
    },
};

export default config;
