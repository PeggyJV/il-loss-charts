import {
    ApolloClient,
    HttpLink,
    InMemoryCache,
} from '@apollo/client/core';
import fetch from 'cross-fetch';

import { UniswapV3Fetcher, UniswapV3FetcherMemoized } from 'services/uniswap-v3';
import appConfig from 'config';
import getSdkApollo from 'services/uniswap-v3/apollo-client';

const config = appConfig.uniswap.v3.networks;

// Manages subgraph clients for multiple networks
export class UniswapV3Fetchers {
  private static instance: UniswapV3Fetchers;
  private static clients: Map<keyof config, UniswapV3Fetcher> = new Map();
  private constructor() {
    // eslint-ignore no-empty-function
  }

  public static get(network = 'mainnet'): UniswapV3Fetcher { // TODO: union type of valid networks
    let client = UniswapV3Fetchers.clients.get(network);
    if (!client) {
      client = UniswapV3Fetchers.createClient(network);
      UniswapV3Fetchers.clients.set(network, client);
    }

    return client;
  }

  private static createClient(network = 'mainnet') {
    const uri = getUri(network);
    if (uri == null) {
      throw new Error(`${network} is an invalid network.`)
    }
    const link = new HttpLink({ uri, fetch });
    const cache = new InMemoryCache();
    const client = new ApolloClient({ link, cache });
    const sdk = getSdkApollo(client);

    return new UniswapV3FetcherMemoized(new UniswapV3Fetcher(sdk), network);
  }
}

export function getUri(network: string): string {
  return config[network];
}