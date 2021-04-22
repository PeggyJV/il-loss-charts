import {
    ApolloClient,
    HttpLink,
    InMemoryCache,
} from '@apollo/client/core';
import fetch from 'cross-fetch';
import { UniswapV3Fetcher } from 'services/uniswap-v3/fetcher';
import getSdkApollo from 'services/uniswap-v3/apollo-client';

// TODO: get from config
const uri = 'http://35.197.14.14:8000/subgraphs/name/sommelier/uniswap-v3';

// Manages subgraph clients for multiple networks
export class UniswapV3Fetchers {
  private static instance: UniswapV3Fetchers;
  private static clients: Record<string, UniswapV3Fetcher> = {};
  private constructor() {
    // eslint-ignore no-empty-function
  }

  public static get(network = 'mainnet'): UniswapV3Fetcher { // TODO: union type of valid networks
    let client = UniswapV3Fetchers.clients[network];
    if (!client) {
      client = UniswapV3Fetchers.clients[network] = UniswapV3Fetchers.createClient(network);
    }

    return client;
  }

  private static createClient(network = 'mainnet') {
    const link = new HttpLink({ uri, fetch });
    const cache = new InMemoryCache();
    const client = new ApolloClient({ link, cache });
    const sdk = getSdkApollo(client);

    return new UniswapV3Fetcher(sdk);
  }
}