import {
    ApolloClient,
    HttpLink,
    ApolloLink,
    concat,
    InMemoryCache,
} from '@apollo/client/core';
import fetch from 'cross-fetch';
import getSdkApollo from 'services/util/apollo-client';

// TODO replace with bitquery URI
const uri = 'https://graphql.bitquery.io';
const httpLink = new HttpLink({ 
    uri, 
    fetch 
});

const authMiddleware = new ApolloLink((operation, forward) => {
    // add the authorization to the headers
    operation.setContext({
        headers: {
            'X-API-KEY': process.env.BITQUERY_API_KEY,
        }
    });

    return forward(operation);
})

const cache = new InMemoryCache();
const client = new ApolloClient({ 
    link: concat(authMiddleware, httpLink), 
    cache 
});
const sdk = getSdkApollo(client);

export default class BitqueryFetcher {
    getLastDayOHLC() {

    }

    getLastWeekOHLC() {

    }
}
