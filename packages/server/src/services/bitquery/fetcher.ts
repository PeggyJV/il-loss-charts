import {
    ApolloClient,
    HttpLink,
    ApolloLink,
    concat,
    InMemoryCache,
} from '@apollo/client/core';
import fetch from 'cross-fetch';
import { getBitquerySdk } from 'services/util/apollo-client';
import { DexTrades } from 'services/bitquery/generated-types';
import { HTTPError } from 'api/util/errors';

import { format, endOfDay, startOfDay, subDays } from 'date-fns';

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
const sdk = getBitquerySdk(client);

export default class BitqueryFetcher {
    formatDate(date: Date): string {
        return format(date, 'YYYY-MM-dd')
    }

    async getLastDayOHLC(baseToken: string, quoteToken: string): Promise<DexTrades> {
        // Calculate start Date and endDate
        const endDate = this.formatDate(endOfDay(new Date()));
        const startDate = this.formatDate(subDays(startOfDay(new Date()), 1));

        const result = await sdk.getPoolDailyOHLC(baseToken, quoteToken, startDate, endDate);
        const dexTrades = result?.ethereum?.dexTrades;

        if (dexTrades == null) {
            throw new HTTPError(404, 'Could not get daily OHLC data.')
        }

        return dexTrades;
    }

    async getLastWeekOHLC(baseToken: string, quoteToken: string): Promise<DexTrades> {
        // Calculate start Date and endDate
        // Todo make this weekly
        const endDate = this.formatDate(endOfDay(new Date()));
        const startDate = this.formatDate(subDays(startOfDay(new Date()), 1));

        const result = await sdk.getPoolDailyOHLC(baseToken, quoteToken, startDate, endDate);
        const dexTrades = result?.ethereum?.dexTrades;

        if (dexTrades == null) {
            throw new HTTPError(404, 'Could not get weekly OHLC data.')
        }

        return dexTrades;
    }
}
