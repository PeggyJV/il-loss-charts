import fetch from 'cross-fetch';
import {
    ApolloClient,
    ApolloError,
    HttpLink,
    InMemoryCache,
    gql,
} from '@apollo/client/core';
import BigNumber from 'bignumber.js';

import {
    UniswapPair,
    UniswapDailyData,
    UniswapHourlyData,
    UniswapSwap,
    UniswapMintOrBurn,
    UniswapLiquidityPositionAtTime,
} from '@sommelier/shared-types';
import { HTTPError } from 'api/util/errors';

import EthBlockFetcher from 'services/eth-blocks';

interface ApolloResponse<T> {
    data: T;
    error?: ApolloError;
}

interface LiquidityPositionPairMapping {
    [pairId: string]: UniswapLiquidityPositionAtTime[];
}

const UNTRACKED_PAIRS = [
    '0xe1573b9d29e2183b1af0e743dc2754979a40d237', // FXS/FRAX
];
export default class UniswapFetcher {
    static FEE_RATIO = 0.003;

    static client = new ApolloClient({
        link: new HttpLink({
            uri: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2',
            fetch,
        }),
        cache: new InMemoryCache(),
        defaultOptions: {
            query: {
                fetchPolicy: 'no-cache',
            },
        },
    });

    static async getPairOverview(
        pairId: string,
        blockNumber?: number
    ): Promise<UniswapPair> {
        let filterStr = `id: "${pairId}"`;

        if (blockNumber) {
            filterStr = filterStr.concat(`, block: {number: ${blockNumber}}`);
        }

        const response: ApolloResponse<{
            pair: UniswapPair;
        }> = await UniswapFetcher.client.query({
            query: gql`
                    {
                        pair(${filterStr}){
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
                            untrackedVolumeUSD
                            txCount
                            createdAtTimestamp
                        }
                    }
                `,
        });

        const { pair } = response?.data;

        if (pair == null && response.error) {
            throw new Error(
                `Could not find pair with ID ${pairId}. Error from response: ${
                    response.error?.toString() || ''
                }`
            );
        } else if (pair == null) {
            throw new HTTPError(404);
        }

        pair.volumeUSD = new BigNumber(pair.volumeUSD)
            .plus(pair.untrackedVolumeUSD || 0)
            .toString();
        const feesUSD = new BigNumber(pair.volumeUSD, 10)
            .times(UniswapFetcher.FEE_RATIO)
            .toString();

        return { ...pair, feesUSD };
    }

    static async getTopPairs(
        count = 1000,
        orderBy = 'volumeUSD',
        includeUntracked = false
    ): Promise<UniswapPair[]> {
        const response: ApolloResponse<{
            pairs: UniswapPair[];
        }> = await UniswapFetcher.client.query({
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
                `,
        });

        const { pairs } = response?.data;

        if (pairs == null || pairs.length === 0) {
            throw new Error(
                `Could not fetch top pairs. Error from response: ${
                    response.error?.toString() || ''
                }`
            );
        }

        if (!includeUntracked) {
            return pairs;
        }

        // fetch overview for each tracked pair
        // move untrackedVolumeUSD to volumeUSD field
        // add to end of list and re-sort
        const untrackedPairRequests = UNTRACKED_PAIRS.map(async (pairId) => {
            const pairData = await UniswapFetcher.getPairOverview(pairId);

            if (pairData.untrackedVolumeUSD) {
                pairData.volumeUSD = pairData.untrackedVolumeUSD;
            }
            return pairData;
        });

        const untrackedPairs = await Promise.all(untrackedPairRequests);
        const pairsWithUntracked = pairs.concat(...untrackedPairs);

        return pairsWithUntracked.sort(
            (a, b) => parseFloat(b.volumeUSD) - parseFloat(a.volumeUSD)
        );
    }

    static async getCurrentTopPerformingPairs(
        count = 100
    ): Promise<UniswapPair[]> {
        const response: ApolloResponse<{
            pairs: UniswapPair[];
        }> = await UniswapFetcher.client.query({
            query: gql`
            {
                pairs(
                    first: ${count}, 
                    orderDirection: desc, 
                    orderBy: volumeUSD,
                    where: {
                                volumeUSD_lt: 100000000,
                                reserveUSD_gt: 500000
                            }
                        ) {
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
                `,
        });

        const { pairs } = response?.data;

        if (pairs == null || pairs.length === 0) {
            throw new Error(
                `Could not fetch pairs subject to alerting. Error from response: ${
                    response.error?.toString() || ''
                }`
            );
        }

        return pairs;
    }

    static async getPairDeltasByTime(
        pairId: string,
        startDate: Date,
        endDate: Date,
        fetchPartial = true
    ): Promise<UniswapPair[]> {
        const blockDatas = await Promise.all([
            EthBlockFetcher.getFirstBlockAfter(startDate),
            EthBlockFetcher.getLastBlockBefore(endDate),
        ]);

        const pairDataP = blockDatas.map((block) =>
            UniswapFetcher.getPairOverview(pairId, block.number).catch(
                (err) => {
                    if (err.status === 404) return null;
                    else throw err;
                }
            )
        );

        const pairDatas = await Promise.all(pairDataP);

        if (
            fetchPartial &&
            pairDatas[0] == null &&
            pairDatas[1]?.createdAtTimestamp
        ) {
            // We didn't get any data at the startDate,
            // but we can get the first block the pair existed
            const pairStartDate = new Date(
                parseInt(pairDatas[1].createdAtTimestamp, 10) * 1000
            );
            const pairStartBlock = await EthBlockFetcher.getFirstBlockAfter(
                pairStartDate
            );
            pairDatas[0] = await UniswapFetcher.getPairOverview(
                pairId,
                pairStartBlock.number
            );
        }

        return pairDatas as UniswapPair[];
    }

    static async _get100DaysHistoricalDailyData(
        pairId: string,
        startDate: Date,
        endDate: Date
    ): Promise<UniswapDailyData[]> {
        const response: ApolloResponse<{
            pairDayDatas: UniswapDailyData[];
        }> = await UniswapFetcher.client.query({
            query: gql`
                    {
                        pairDayDatas(orderBy: date, orderDirection: asc,
                            where: {
                                pairAddress: "${pairId}",
                                date_gt: ${Math.floor(
                                    startDate.getTime() / 1000
                                )}
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
                `,
        });

        const { pairDayDatas } = response?.data;

        if (pairDayDatas == null) {
            throw new Error(
                `Could not fetch daily data for pair ${pairId}. Error from response: ${
                    response.error?.toString() || ''
                }`
            );
        }

        return pairDayDatas;
    }

    static async getHourlyData(
        pairId: string,
        startDate: Date,
        endDate: Date
    ): Promise<UniswapHourlyData[]> {
        const response: ApolloResponse<{
            pairHourDatas: UniswapHourlyData[];
        }> = await UniswapFetcher.client.query({
            query: gql`
                    {
                        pairHourDatas(orderBy: hourStartUnix, orderDirection: asc,
                            where: {
                                pair: "${pairId}",
                                hourStartUnix_gt: ${
                                    Math.floor(startDate.getTime() / 1000) - 1
                                }
                                hourStartUnix_lt: ${Math.floor(
                                    endDate.getTime() / 1000
                                )}
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
                `,
        });

        const { pairHourDatas } = response?.data;

        if (pairHourDatas == null) {
            throw new Error(
                `Could not fetch daily data for pair ${pairId}. Error from response: ${
                    response.error?.toString() || ''
                }`
            );
        }

        return pairHourDatas;
    }

    static async getCurrentDayDataFromHourly(
        pairId: string,
        startDate: Date,
        endDate: Date
    ): Promise<UniswapDailyData> {
        const pairHourDatas = await UniswapFetcher.getHourlyData(
            pairId,
            startDate,
            endDate
        );

        // Aggregate hour datas into current day data
        // TODO: Investigate reserve0/reserve1 discrepancy in hourly datas
        const currentDayResults = pairHourDatas.reduce(
            (acc, hourData) => {
                acc.dailyVolumeUSD = acc.dailyVolumeUSD.plus(
                    hourData.hourlyVolumeUSD
                );
                acc.dailyVolumeToken0 = acc.dailyVolumeToken0.plus(
                    hourData.hourlyVolumeToken0
                );
                acc.dailyVolumeToken1 = acc.dailyVolumeToken1.plus(
                    hourData.hourlyVolumeToken1
                );
                return acc;
            },
            {
                partialDay: true,
                dailyVolumeToken0: new BigNumber(0),
                dailyVolumeToken1: new BigNumber(0),
                dailyVolumeUSD: new BigNumber(0),
                date: pairHourDatas[pairHourDatas.length - 1].hourStartUnix,
                pairAddress: pairId,
                reserve0: pairHourDatas[pairHourDatas.length - 1].reserve0,
                reserve1: pairHourDatas[pairHourDatas.length - 1].reserve1,
                reserveUSD: pairHourDatas[pairHourDatas.length - 1].reserveUSD,
                pairHourDatas: pairHourDatas,
            }
        );

        const currentDayData: UniswapDailyData = {
            ...currentDayResults,
            __typename: 'PairDayData',
            dailyVolumeToken0: currentDayResults.dailyVolumeToken0.toString(),
            dailyVolumeToken1: currentDayResults.dailyVolumeToken1.toString(),
            dailyVolumeUSD: currentDayResults.dailyVolumeUSD.toString(),
        };

        return currentDayData;
    }

    static async getHistoricalDailyData(
        pairId: string,
        startDate: Date,
        endDate = new Date()
    ): Promise<UniswapDailyData[]> {
        let lastStartDate = startDate;
        let dailyData = await UniswapFetcher._get100DaysHistoricalDailyData(
            pairId,
            startDate,
            endDate
        );
        const endDateTimestamp = Math.floor(endDate.getTime() / 1000);
        const dayMs = 1000 * 60 * 60 * 24;

        if (dailyData.length === 0) {
            throw new HTTPError(
                404,
                `Could not fetch any historical data for the given timeframe. Make sure the window is at least 1 day.`
            );
        }

        // Keep fetching until we pass the end date
        while (
            dailyData[dailyData.length - 1].date <= endDateTimestamp &&
            Math.floor(lastStartDate.getTime() / 1000) <= endDateTimestamp
        ) {
            lastStartDate = new Date(
                dailyData[dailyData.length - 1].date * 1000 + dayMs
            ); // skip ahead 24 hrs
            const oldLength = dailyData.length;
            dailyData = [
                ...dailyData,
                ...(await UniswapFetcher._get100DaysHistoricalDailyData(
                    pairId,
                    lastStartDate,
                    endDate
                )),
            ];

            // Nothing more to add
            if (dailyData.length === oldLength) {
                break;
            }
        }

        return dailyData;
    }

    static async getHistoricalHourlyData(
        pairId: string,
        startDate: Date,
        endDate = new Date()
    ): Promise<UniswapHourlyData[]> {
        let lastStartDate = startDate;
        let hourlyData = await UniswapFetcher.getHourlyData(
            pairId,
            startDate,
            endDate
        );
        const endDateTimestamp = Math.floor(endDate.getTime() / 1000);
        const dayMs = 1000 * 60 * 60 * 24;

        if (hourlyData.length === 0) {
            throw new HTTPError(
                404,
                `Could not fetch any historical hourly data for the given timeframe. Make sure the window is at least 1 day.`
            );
        }

        // Keep fetching until we pass the end date
        while (
            hourlyData[hourlyData.length - 1].hourStartUnix <=
                endDateTimestamp &&
            Math.floor(lastStartDate.getTime() / 1000) <= endDateTimestamp
        ) {
            lastStartDate = new Date(
                hourlyData[hourlyData.length - 1].hourStartUnix * 1000 + dayMs
            ); // skip ahead 24 hrs
            const oldLength = hourlyData.length;
            hourlyData = [
                ...hourlyData,
                ...(await UniswapFetcher.getHourlyData(
                    pairId,
                    lastStartDate,
                    endDate
                )),
            ];

            // Nothing more to add
            if (hourlyData.length === oldLength) {
                break;
            }
        }

        return hourlyData;
    }

    static async getSwapsForPair(pairId: string): Promise<UniswapSwap[]> {
        const response: ApolloResponse<{
            swaps: UniswapSwap[];
        }> = await UniswapFetcher.client.query({
            query: gql`
                    {
                        swaps(first: 100, orderBy: timestamp, orderDirection: desc, where:
                            { pair: "${pairId}" }
                        ) {
                            pair {
                                token0 {
                                    id
                                    symbol
                                }
                                token1 {
                                    id
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
                `,
        });

        const { swaps } = response?.data;

        if (swaps == null) {
            throw new Error(
                `Could not fetch recent swaps for pair ${pairId}. Error from response: ${
                    response.error?.toString() || ''
                }`
            );
        } else if (swaps.length === 0) {
            throw new HTTPError(404);
        }

        return swaps;
    }

    static async getMintsForPair(pairId: string): Promise<UniswapMintOrBurn[]> {
        const response: ApolloResponse<{
            mints: UniswapMintOrBurn[];
        }> = await UniswapFetcher.client.query({
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
                `,
        });

        const { mints } = response?.data;

        if (mints == null) {
            throw new Error(
                `Could not fetch recent mints for pair ${pairId}. Error from response: ${
                    response.error?.toString() || ''
                }`
            );
        } else if (mints.length === 0) {
            throw new HTTPError(404);
        }

        return mints;
    }

    static async getBurnsForPair(pairId: string): Promise<UniswapMintOrBurn[]> {
        const response: ApolloResponse<{
            burns: UniswapMintOrBurn[];
        }> = await UniswapFetcher.client.query({
            query: gql`
                    {
                        burns(first: 100, orderBy: timestamp, orderDirection: desc, where:
                            { pair: "${pairId}" }
                        ) {
                            pair {
                                token0 {
                                    id
                                    symbol
                                }
                                token1 {
                                    id
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
                `,
        });

        const { burns } = response?.data;

        if (burns == null) {
            throw new Error(
                `Could not fetch recent burns for pair ${pairId}. Error from response: ${
                    response.error?.toString() || ''
                }`
            );
        } else if (burns.length === 0) {
            throw new HTTPError(404);
        }

        return burns;
    }

    static async getEthPrice(): Promise<{ ethPrice: number }> {
        const response: ApolloResponse<{
            bundle: { ethPrice: number };
        }> = await UniswapFetcher.client.query({
            query: gql`
                {
                    bundle(id: "1") {
                        ethPrice
                    }
                }
            `,
        });

        const {
            bundle: { ethPrice },
        } = response?.data;

        if (ethPrice == null) {
            throw new Error(
                `Could not fetch ethPrice. Error from response: ${
                    response.error?.toString() || ''
                }`
            );
        }

        return { ethPrice };
    }

    static async getLiquidityPositions(
        address: string
    ): Promise<LiquidityPositionPairMapping> {
        const response: ApolloResponse<{
            liquidityPositionSnapshots: UniswapLiquidityPositionAtTime[];
        }> = await UniswapFetcher.client.query({
            query: gql`
                    {
                        liquidityPositionSnapshots(where: { user: "${address.toLowerCase()}" }) {
                            id
                            liquidityPosition {
                                id
                                liquidityTokenBalance
                            }
                            timestamp
                            reserve0
                            reserve1
                            reserveUSD
                            liquidityTokenBalance
                            liquidityTokenTotalSupply
                            pair {
                                id
                                reserve0
                                reserve1
                                reserveUSD
                                volumeUSD
                                token0 {
                                    id
                                    symbol
                                }
                                token1 {
                                    id
                                    symbol
                                }
                            }
                        }
                    }
                `,
        });

        const { liquidityPositionSnapshots } = response?.data;

        if (liquidityPositionSnapshots == null) {
            throw new Error(
                `Could not fetch liquidity positions for address ${address}. Error from response: ${
                    response.error?.toString() || ''
                }`
            );
        } else if (liquidityPositionSnapshots.length === 0) {
            throw new HTTPError(404);
        }

        // Organize liquidity positions by pair
        const positions = liquidityPositionSnapshots.reduce(
            (acc: LiquidityPositionPairMapping, snapshot) => {
                const { pair } = snapshot;

                if (!pair.id) {
                    throw new Error('Got snapshot without pair ID');
                }

                if (!acc[pair.id]) {
                    acc[pair.id] = [snapshot];
                } else {
                    acc[pair.id].push(snapshot);
                }

                return acc;
            },
            {}
        );

        return positions;
    }
}
