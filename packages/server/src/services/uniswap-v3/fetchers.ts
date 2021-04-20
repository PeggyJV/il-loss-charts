import {
    ApolloClient,
    HttpLink,
    InMemoryCache,
} from '@apollo/client/core';
import fetch from 'cross-fetch';
import Fetcher from 'services/uniswap-v3/fetcher';
import getSdkApollo from 'services/uniswap-v3/apollo-client';

// TODO: get from config
const uri = 'http://35.197.14.14:8000/subgraphs/name/sommelier/uniswap-v3';
const link = new HttpLink({ uri, fetch });
const cache = new InMemoryCache();
const client = new ApolloClient({ link, cache });
const sdk = getSdkApollo(client);

// Manages subgraph clients for multiple networks
export default class Fetchers {
  private static instance: Fetchers;
  private static clients: Record<string, Fetcher>;
  private constructor() {}

  public static get(network: string = 'mainnet') { // TODO: union type of valid networks
    let client = Fetchers.clients[network];
    if (client) {
      client = Fetchers.clients[network] = Fetchers.createClient(network);
    }

    return client;
  }

  private static createClient(network: string = 'mainnet') {
    const link = new HttpLink({ uri, fetch });
    const cache = new InMemoryCache();
    const client = new ApolloClient({ link, cache });
    const sdk = getSdkApollo(client);

    return new Fetcher(sdk);
  }
}