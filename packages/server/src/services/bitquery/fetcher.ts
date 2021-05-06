import {
    ApolloClient,
    HttpLink,
    ApolloLink,
    concat,
    InMemoryCache,
} from '@apollo/client/core';
import fetch from 'cross-fetch';
import { getBitquerySdk } from 'services/util/apollo-client';
import { DexTrade } from 'services/bitquery/generated-types';
import { UpstreamError, UpstreamMissingPoolDataError } from 'api/util/errors';

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
    static formatDate(date: Date): string {
        return format(date, 'yyyy-MM-dd')
    }

    static async getLastDayOHLC(baseTokenId: string, quoteTokenId: string): Promise<DexTrade> {
        // Calculate start Date and endDate
        const endDate = endOfDay(new Date());
        const startDate = subDays(startOfDay(new Date()), 1);

        const dexTrades = await BitqueryFetcher.getPeriodDailyOHLC(baseTokenId, quoteTokenId, startDate, endDate);

        return dexTrades[0];
    }

    static async getLastWeekOHLC(baseTokenId: string, quoteTokenId: string): Promise<DexTrade> {
        // Calculate start Date and endDate
        // Todo make this weekly
        const endDate = BitqueryFetcher.formatDate(endOfDay(new Date()));
        const startDate = BitqueryFetcher.formatDate(subDays(startOfDay(new Date()), 7));

        const dexTrades = await getPoolDailyOHLC({ baseTokenId, quoteTokenId, startDate, endDate });

        const weeklyOHLC = { ...dexTrades[0] };

        let min = weeklyOHLC.minimum_price;
        let max = weeklyOHLC.maximum_price;

        for (const daily of dexTrades) {
            if (daily.minimum_price < min) {
                min = daily.minimum_price;
                weeklyOHLC.minimum_price = min
            }

            if (daily.maximum_price > max) {
                max = daily.maximum_price;
                weeklyOHLC.maximum_price = max
            }
        }

        weeklyOHLC.open_price = dexTrades[dexTrades.length - 1].open_price;

        return weeklyOHLC;
    }

    static async getPeriodDailyOHLC(baseTokenId: string, quoteTokenId: string, start: Date, end: Date): Promise<DexTrade[]> {
        // Calculate start Date and endDate
        const endDate = BitqueryFetcher.formatDate(end);
        const startDate = BitqueryFetcher.formatDate(start);

        return getPoolDailyOHLC({ baseTokenId, quoteTokenId, startDate, endDate });
    }

}

type OHLCParams = {
    baseTokenId: string,
    quoteTokenId: string,
    startDate: string,
    endDate: string,
}
async function getPoolDailyOHLC({ baseTokenId, quoteTokenId, startDate, endDate }: OHLCParams) {
    let result;
    try {
        result = await sdk.getPoolDailyOHLC({ baseTokenId, quoteTokenId, startDate, endDate });
    } catch (error) {
        // eslint-ignore-next-line
        console.error('Bitquery:', error.message);
        throw UpstreamError;
    }

    const dexTrades = result?.ethereum?.dexTrades;
    if (dexTrades == null || dexTrades.length === 0) {
        throw UpstreamMissingPoolDataError;
    }

    return dexTrades;
}