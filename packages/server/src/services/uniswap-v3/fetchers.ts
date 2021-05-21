import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client/core';
import fetch from 'cross-fetch';

import { EthNetwork } from '@sommelier/shared-types';

import {
    UniswapV3Fetcher,
    UniswapV3FetcherMemoized,
} from 'services/uniswap-v3';
import appConfig from 'config/app';
import { getUniswapV3Sdk } from 'services/util/apollo-client';

const config: Record<string, string> = appConfig.uniswap.v3.networks;

// Manages subgraph clients for multiple networks
export class UniswapV3Fetchers {
    private static instance: UniswapV3Fetchers;
    private static clients: Map<
        EthNetwork,
        UniswapV3FetcherMemoized
    > = new Map();
    private constructor() {
        // eslint-ignore no-empty-function
    }

    public static get(
        network: EthNetwork = 'mainnet',
    ): UniswapV3FetcherMemoized {
        // TODO: union type of valid networks
        let client = UniswapV3Fetchers.clients.get(network);
        if (!client) {
            const existingClient = UniswapV3Fetchers.createClient(network);

            if (existingClient instanceof UniswapV3FetcherMemoized === false) {
                throw new Error(
                    `Could not get UniswapV3Fetcher for network: ${network}`,
                );
            }

            client = existingClient;

            UniswapV3Fetchers.clients.set(network, existingClient);
        }

        return client;
    }

    private static createClient(network: EthNetwork = 'mainnet') {
        const uri = getUri(network);
        if (uri == null) {
            throw new Error(`${network} is an invalid network.`);
        }
        const link = new HttpLink({ uri, fetch });
        const cache = new InMemoryCache();
        const client = new ApolloClient({ link, cache });
        const sdk = getUniswapV3Sdk(client);

        return new UniswapV3FetcherMemoized(new UniswapV3Fetcher(sdk), network);
    }
}

export function getUri(network: EthNetwork): string {
    return config[network];
}
