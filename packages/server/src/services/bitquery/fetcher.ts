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
import appConfig from '@config';

import { format, endOfDay, startOfDay, subDays } from 'date-fns';

const config = appConfig.bitquery;

// TODO replace with bitquery URI
const uri = 'https://graphql.bitquery.io';
const httpLink = new HttpLink({
    uri,
    fetch,
});

const authMiddleware = new ApolloLink((operation, forward) => {
    // add the authorization to the headers
    operation.setContext({
        headers: {
            'X-API-KEY': config.apiKey,
        },
    });

    return forward(operation);
});

const cache = new InMemoryCache({
    typePolicies: {
        Ethereum: {
            merge: false,
        },
        DexTrade: {
            keyFields: [
                'date',
                'exchangeName',
                'timeInterval',
                'baseCurrency',
                ['address'],
                'quoteCurrency',
                ['address'],
            ],
        },
    },
});
const client = new ApolloClient({
    link: concat(authMiddleware, httpLink),
    cache,
});
const sdk = getBitquerySdk(client);

export default class BitqueryFetcher {
    static formatDate(date: Date): string {
        return format(date, 'yyyy-MM-dd');
    }

    static async getLastDayOHLC(
        baseTokenId: string,
        quoteTokenId: string,
    ): Promise<DexTrade> {
        // Calculate start Date and endDate
        const endDate = endOfDay(new Date());
        const startDate = subDays(startOfDay(new Date()), 1);

        const dexTrades = await BitqueryFetcher.getPeriodDailyOHLC(
            baseTokenId,
            quoteTokenId,
            startDate,
            endDate,
        );

        return dexTrades[0];
    }

    static async getLastWeekOHLC(
        baseTokenId: string,
        quoteTokenId: string,
    ): Promise<DexTrade> {
        // Calculate start Date and endDate
        // Todo make this weekly
        const endDate = endOfDay(new Date());
        const startDate = subDays(startOfDay(new Date()), 7);

        const dexTrades = await BitqueryFetcher.getPeriodDailyOHLC(
            baseTokenId,
            quoteTokenId,
            startDate,
            endDate,
        );

        const weeklyOHLC = { ...dexTrades[0] };

        let min = weeklyOHLC.minimum_price;
        let max = weeklyOHLC.maximum_price;

        for (const daily of dexTrades) {
            if (daily.minimum_price < min) {
                min = daily.minimum_price;
                weeklyOHLC.minimum_price = min;
            }

            if (daily.maximum_price > max) {
                max = daily.maximum_price;
                weeklyOHLC.maximum_price = max;
            }
        }

        weeklyOHLC.open_price = dexTrades[dexTrades.length - 1].open_price;

        return weeklyOHLC;
    }

    static async getPeriodDailyOHLC(
        baseTokenId: string,
        quoteTokenId: string,
        start: Date | number,
        end: Date | number,
    ): Promise<DexTrade[]> {
        end = typeof end === 'number' ? new Date(end) : end;
        start = typeof start === 'number' ? new Date(start) : start;

        // Calculate start Date and endDate
        const endDate = BitqueryFetcher.formatDate(end);
        const startDate = BitqueryFetcher.formatDate(start);

        let result;
        try {
            result = await sdk.getPoolDailyOHLC({
                baseTokenId,
                quoteTokenId,
                startDate,
                endDate,
            });
        } catch (error) {
            // eslint-ignore-next-line
            console.error('Bitquery:', error.message);
            throw UpstreamError.clone();
        }

        const dexTrades = result?.ethereum?.dexTrades;
        if (dexTrades == null || dexTrades.length === 0) {
            throw UpstreamMissingPoolDataError.clone();
        }

        return dexTrades;
    }
}
