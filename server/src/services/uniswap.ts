import fetch from 'node-fetch';
import { ApolloClient, HttpLink, InMemoryCache, gql } from '@apollo/client/core';
import BigNumber from 'bignumber.js';

export default class UniswapFetcher {
    static FEE_RATIO = 0.003;

    static client = new ApolloClient({
        link: new HttpLink({
            uri: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2',
            fetch
        }),
        cache: new InMemoryCache(),
        defaultOptions: {
            query: {
                fetchPolicy: 'no-cache'
            }
        }
    });

    static async getPairOverview(pairId) {
        const response = await UniswapFetcher.client
            .query({
                query: gql`
                    {
                        pair(id: "${pairId}"){
                            id
                            token0 {
                                id
                                name
                                symbol
                                decimals
                                derivedETH
                                tradeVolumeUSD
                                totalLiquidity
                            }
                            token1 {
                                id
                                symbol
                                name
                                decimals
                                derivedETH
                                tradeVolumeUSD
                                totalLiquidity
                            }
                            reserve0
                            reserve1
                            reserveUSD
                            trackedReserveETH
                            token0Price
                            token1Price
                            volumeUSD
                            txCount
                            createdAtTimestamp
                        }
                    }
                `
            });

        const { pair } = response?.data;

        if (pair == null) {
            throw new Error(`Could not find pair with ID ${pairId}. Error from response: ${response.error}`);
        }

        const feesUSD = new BigNumber(pair.volumeUSD, 10).times(UniswapFetcher.FEE_RATIO).toString();

        return { ...pair, feesUSD };
    }

    static async getTopPairs(count = 1000, orderBy = 'volumeUSD') {
        const response = await UniswapFetcher.client
            .query({
                query: gql`
                    {
                        pairs(first: ${count}, orderBy: ${orderBy}, orderDirection: desc) {
                            id
                            volumeUSD
                            reserveUSD
                            token0 {
                                id
                                name
                                symbol
                            }
                            token1 {
                                id
                                name
                                symbol
                            }

                        }
                    }
                `
            });

        const { pairs } = response?.data;

        if (pairs == null || pairs.length === 0) {
            throw new Error(`Could not fetch top pairs. Error from response: ${response.error}`);
        }

        return pairs;
    }

    static async _get100DaysHistoricalDailyData(pairId, startDate, endDate) {
        const response = await UniswapFetcher.client
            .query({
                query: gql`
                    {
                        pairDayDatas(orderBy: date, orderDirection: asc,
                            where: {
                                pairAddress: "${pairId}",
                                date_gt: ${Math.floor(startDate.getTime() / 1000)}
                                date_lt: ${Math.floor(endDate.getTime() / 1000)}
                            }
                        ) {
                            date
                            pairAddress
                            dailyVolumeToken0
                            dailyVolumeToken1
                            dailyVolumeUSD
                            reserveUSD
                            reserve0
                            reserve1
                        }
                }
                `
            });

        const { pairDayDatas } = response?.data;

        if (pairDayDatas == null) {
            throw new Error(`Could not fetch daily data for pair ${pairId}. Error from response: ${response.error}`);
        }

        return pairDayDatas;
    }

    static async getHourlyData(pairId, startDate, endDate) {
        const response = await UniswapFetcher.client
            .query({
                query: gql`
                    {
                        pairHourDatas(orderBy: hourStartUnix, orderDirection: asc,
                            where: {
                                pair: "${pairId}",
                                hourStartUnix_gt: ${Math.floor(startDate.getTime() / 1000) - 1}
                                hourStartUnix_lt: ${Math.floor(endDate.getTime() / 1000)}
                            }
                        ) {
                            pair {
                                id
                            }
                            hourStartUnix
                            hourlyVolumeToken0
                            hourlyVolumeToken1
                            hourlyVolumeUSD
                            reserveUSD
                            reserve0
                            reserve1
                        }
                }
                `
            });

        const { pairHourDatas } = response?.data;

        if (pairHourDatas == null) {
            throw new Error(`Could not fetch daily data for pair ${pairId}. Error from response: ${response.error}`);
        }

        return pairHourDatas;
    }

    static async getCurrentDayDataFromHourly(pairId, startDate, endDate) {
        const pairHourDatas = await UniswapFetcher.getHourlyData(pairId, startDate, endDate);

        // Aggregate hour datas into current day data
        // TODO: Investigate reserve0/reserve1 discrepancy in hourly datas
        const currentDayData = pairHourDatas.reduce((acc, hourData) => {
            acc.dailyVolumeUSD = acc.dailyVolumeUSD.plus(hourData.hourlyVolumeUSD);
            acc.dailyVolumeToken0 = acc.dailyVolumeToken0.plus(hourData.hourlyVolumeToken0);
            acc.dailyVolumeToken1 = acc.dailyVolumeToken1.plus(hourData.hourlyVolumeToken1);
            return acc;
        }, {
            __typename: 'PairDayData',
            partialDay: true,
            dailyVolumeToken0: new BigNumber(0),
            dailyVolumeToken1: new BigNumber(0),
            dailyVolumeUSD: new BigNumber(0),
            date: pairHourDatas[pairHourDatas.length - 1].hourStartUnix,
            pairAddress: pairId,
            reserve0: pairHourDatas[pairHourDatas.length - 1].reserve0,
            reserve1: pairHourDatas[pairHourDatas.length - 1].reserve1,
            reserveUSD: pairHourDatas[pairHourDatas.length - 1].reserveUSD,
            pairHourDatas: pairHourDatas
        });

        return currentDayData;
    }

    static async getHistoricalDailyData(pairId, startDate, endDate = new Date()) {
        let lastStartDate = startDate;
        let dailyData = await UniswapFetcher._get100DaysHistoricalDailyData(pairId, startDate, endDate);
        const endDateTimestamp = Math.floor(endDate.getTime() / 1000);
        const dayMs = 1000 * 60 * 60 * 24;

        if (dailyData.length === 0) {
            throw new Error(`Could not fetch any historical data for the given timeframe. Make sure the window is at least 1 day.`);
        }

        // Keep fetching until we pass the end date
        while (dailyData[dailyData.length - 1].date <= endDateTimestamp && Math.floor(lastStartDate.getTime() / 1000) <= endDateTimestamp) {
            lastStartDate = new Date(dailyData[dailyData.length - 1].date * 1000 + dayMs); // skip ahead 24 hrs
            const oldLength = dailyData.length;
            dailyData = [...dailyData, ...(await UniswapFetcher._get100DaysHistoricalDailyData(pairId, lastStartDate, endDate))]

            // Nothing more to add
            if (dailyData.length === oldLength) {
                break;
            }
        }

        return dailyData;
    }

    static async getSwapsForPair(pairId) {
        const response = await UniswapFetcher.client
            .query({
                query: gql`
                    {
                        swaps(first: 100, orderBy: timestamp, orderDirection: desc, where:
                            { pair: "${pairId}" }
                        ) {
                            pair {
                                token0 {
                                    symbol
                                }
                                token1 {
                                    symbol
                                }
                            }
                            amount0In
                            amount0Out
                            amount1In
                            amount1Out
                            amountUSD
                            to
                        }
                    }
                `
            });

        const { swaps } = response?.data;

        if (swaps == null) {
            throw new Error(`Could not fetch recent swaps for pair ${pairId}. Error from response: ${response.error}`);
        }

        return swaps;
    }


    static async getMintsForPair(pairId) {
        const response = await UniswapFetcher.client
            .query({
                query: gql`
                    {
                        mints(first: 100, orderBy: timestamp, orderDirection: desc, where:
                            { pair: "${pairId}" }
                        ) {
                            pair {
                                token0 {
                                    symbol
                                }
                                token1 {
                                    symbol
                                }
                            }
                            timestamp
                            liquidity
                            amount0
                            amount1
                            amountUSD
                            to
                        }
                    }
                `
            });

        const { mints } = response?.data;

        if (mints == null) {
            throw new Error(`Could not fetch recent mints for pair ${pairId}. Error from response: ${response.error}`);
        }

        return mints;
    }

    static async getBurnsForPair(pairId) {
        const response = await UniswapFetcher.client
            .query({
                query: gql`
                    {
                        burns(first: 100, orderBy: timestamp, orderDirection: desc, where:
                            { pair: "${pairId}" }
                        ) {
                            pair {
                                token0 {
                                    symbol
                                }
                                token1 {
                                    symbol
                                }
                            }
                            timestamp
                            liquidity
                            amount0
                            amount1
                            amountUSD
                            to
                        }
                    }
                `
            });

        const { burns } = response?.data;

        if (burns == null) {
            throw new Error(`Could not fetch recent burns for pair ${pairId}. Error from response: ${response.error}`);
        }

        return burns;
    }

    static async getEthPrice() {
        const response = await UniswapFetcher.client
            .query({
                query: gql`
                    {
                        bundle(id: "1" ) {
                            ethPrice
                        }
                    }
                `
            });

        const { bundle: { ethPrice } } = response?.data;

        if (ethPrice == null) {
            throw new Error(`Could not fetch ethPrice. Error from response: ${response.error}`);
        }

        return { ethPrice };
    }
}