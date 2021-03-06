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
    IUniswapPair,
    UniswapDailyData,
    UniswapHourlyData,
    UniswapSwap,
    UniswapMintOrBurn,
    UniswapLiquidityPositionAtTime,
} from '@sommelier/shared-types';
import { HTTPError } from 'api/util/errors';

import EthBlockFetcher, { EthBlock } from 'services/eth-blocks';
import redis from 'util/redis';
import { wrapWithCache } from 'util/redis-data-cache';

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

const getFirstBlockAfter = wrapWithCache(
    redis,
    EthBlockFetcher.getFirstBlockAfter,
    10000,
    false,
);

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

    static async getPoolOverview(
        pairId: string,
        blockNumber?: number,
    ): Promise<IUniswapPair> {
        let filterStr = `id: "${pairId}"`;

        if (blockNumber) {
            filterStr = filterStr.concat(`, block: {number: ${blockNumber}}`);
        }

        const response: ApolloResponse<{
            pair: IUniswapPair;
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
                }`,
            );
        } else if (pair == null) {
            throw new HTTPError(404);
        }

        pair.volumeUSD = new BigNumber(pair.volumeUSD).toString();
        const feesUSD = new BigNumber(pair.volumeUSD, 10)
            .times(UniswapFetcher.FEE_RATIO)
            .toString();

        return { ...pair, feesUSD };
    }

    static cachedGetPoolOverview = wrapWithCache(
        redis,
        UniswapFetcher.getPoolOverview,
        10000,
        false,
    );

    static async getTopPools(
        count = 1000,
        orderBy = 'volumeUSD',
        includeUntracked = false,
    ): Promise<IUniswapPair[]> {
        const response: ApolloResponse<{
            pairs: IUniswapPair[];
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
                                decimals
                            }
                            token1 {
                                id
                                name
                                symbol
                                decimals
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
                }`,
            );
        }

        if (!includeUntracked) {
            return pairs;
        }

        // fetch overview for each tracked pair
        // move untrackedVolumeUSD to volumeUSD field
        // add to end of list and re-sort
        const untrackedPairRequests = UNTRACKED_PAIRS.map(async (pairId) => {
            const pairData = await UniswapFetcher.getPoolOverview(pairId);

            if (pairData.untrackedVolumeUSD) {
                pairData.volumeUSD = pairData.untrackedVolumeUSD;
            }
            return pairData;
        });

        const untrackedPairs = await Promise.all(untrackedPairRequests);
        const pairsWithUntracked = pairs.concat(...untrackedPairs);

        return pairsWithUntracked.sort(
            (a, b) => parseFloat(b.volumeUSD) - parseFloat(a.volumeUSD),
        );
    }

    static async getCurrentTopPerformingPools(
        count = 100,
    ): Promise<IUniswapPair[]> {
        const response: ApolloResponse<{
            pairs: IUniswapPair[];
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
                                decimals
                            }
                            token1 {
                                id
                                name
                                symbol
                                decimals
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
                }`,
            );
        }

        return pairs;
    }

    static async getPoolDeltasByTime({
        pairId,
        startDate,
        endDate,
        startBlock,
        endBlock,
        fetchPartial = true,
    }: {
        pairId: string;
        startDate?: Date;
        endDate?: Date;
        startBlock?: EthBlock;
        endBlock?: EthBlock;
        fetchPartial?: boolean;
    }): Promise<IUniswapPair[]> {
        let blockDatas: EthBlock[];
        if (startBlock) {
            if (!endBlock) {
                throw new Error(
                    'If providing start block must also provide end block',
                );
            }

            blockDatas = [startBlock, endBlock];
        } else {
            if (!startDate || !endDate) {
                throw new Error(
                    'Must provide both start and end date if not providing block numbers',
                );
            }

            blockDatas = await Promise.all([
                getFirstBlockAfter(startDate),
                EthBlockFetcher.getLastBlockBefore(endDate),
            ]);
        }

        const pairDataP = blockDatas.map(
            (block) =>
                <Promise<IUniswapPair>>UniswapFetcher.cachedGetPoolOverview(
                    pairId,
                    block.number,
                ).catch((err: HTTPError) => {
                    if (err.status === 404) return null;
                    else throw err;
                }),
        );

        let pairDatas: IUniswapPair[];

        try {
            pairDatas = await Promise.all(pairDataP);
        } catch (e) {
            // If error message tells us we're behind, try again with no block
            const blockBehindMsg = `Failed to decode`;

            if (e.message.match(blockBehindMsg)) {
                pairDatas = await Promise.all([
                    <Promise<IUniswapPair>>UniswapFetcher.cachedGetPoolOverview(
                        pairId,
                        blockDatas[0].number,
                    ).catch((err: HTTPError) => {
                        if (err.status === 404) return null;
                        else throw err;
                    }),
                    <Promise<IUniswapPair>>UniswapFetcher.cachedGetPoolOverview(
                        pairId,
                    ).catch((err: HTTPError) => {
                        if (err.status === 404) return null;
                        else throw err;
                    }),
                ]);
            } else {
                throw e;
            }
        }

        if (
            fetchPartial &&
            pairDatas[0] == null &&
            pairDatas[1]?.createdAtTimestamp
        ) {
            // We didn't get any data at the startDate,
            // but we can get the first block the pair existed
            const pairStartDate = new Date(
                parseInt(pairDatas[1].createdAtTimestamp, 10) * 1000,
            );

            const pairStartBlock = await EthBlockFetcher.getFirstBlockAfter(
                pairStartDate,
            );

            // Make sure pairStartBlock is actually after our first block
            if (pairStartBlock.number > blockDatas[0].number) {
                pairDatas[0] = await UniswapFetcher.cachedGetPoolOverview(
                    pairId,
                    pairStartBlock.number,
                );
            } else {
                // Something is wrong, since the pair is old enough to have data at the starting block
                console.error(
                    `Could not get start block data for older pair - ${pairDatas[1].id}`,
                );

                // Try to re-fetch
                pairDatas[0] = await UniswapFetcher.cachedGetPoolOverview(
                    pairId,
                    blockDatas[0].number,
                );
            }
        }

        return pairDatas;
    }

    static async getPoolDailyData(
        pairId: string,
        startDate: Date,
        endDate: Date,
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
                                    startDate.getTime() / 1000,
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
                }`,
            );
        }

        return pairDayDatas;
    }

    static async getPoolHourlyData(
        pairId: string,
        startDate: Date,
        endDate: Date,
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
                                    endDate.getTime() / 1000,
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
                }`,
            );
        }

        return pairHourDatas;
    }

    static async getCurrentDayDataFromHourly(
        pairId: string,
        startDate: Date,
        endDate: Date,
    ): Promise<UniswapDailyData> {
        const pairHourDatas = await UniswapFetcher.getPoolHourlyData(
            pairId,
            startDate,
            endDate,
        );

        // Aggregate hour datas into current day data
        // TODO: Investigate reserve0/reserve1 discrepancy in hourly datas
        const currentDayResults = pairHourDatas.reduce(
            (acc, hourData) => {
                acc.dailyVolumeUSD = acc.dailyVolumeUSD.plus(
                    hourData.hourlyVolumeUSD,
                );
                acc.dailyVolumeToken0 = acc.dailyVolumeToken0.plus(
                    hourData.hourlyVolumeToken0,
                );
                acc.dailyVolumeToken1 = acc.dailyVolumeToken1.plus(
                    hourData.hourlyVolumeToken1,
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
            },
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
        endDate = new Date(),
    ): Promise<UniswapDailyData[]> {
        let lastStartDate = startDate;
        let dailyData = await UniswapFetcher.getPoolDailyData(
            pairId,
            startDate,
            endDate,
        );
        const endDateTimestamp = Math.floor(endDate.getTime() / 1000);
        const dayMs = 1000 * 60 * 60 * 24;

        if (dailyData.length === 0) {
            throw new HTTPError(
                404,
                `Could not fetch any historical data for the given timeframe. Make sure the window is at least 1 day.`,
            );
        }

        // Keep fetching until we pass the end date
        while (
            dailyData[dailyData.length - 1].date <= endDateTimestamp &&
            Math.floor(lastStartDate.getTime() / 1000) <= endDateTimestamp
        ) {
            lastStartDate = new Date(
                dailyData[dailyData.length - 1].date * 1000 + dayMs,
            ); // skip ahead 24 hrs
            const oldLength = dailyData.length;
            dailyData = [
                ...dailyData,
                ...(await UniswapFetcher.getPoolDailyData(
                    pairId,
                    lastStartDate,
                    endDate,
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
        endDate = new Date(),
    ): Promise<UniswapHourlyData[]> {
        let lastStartDate = startDate;
        let hourlyData = await UniswapFetcher.getPoolHourlyData(
            pairId,
            startDate,
            endDate,
        );
        const endDateTimestamp = Math.floor(endDate.getTime() / 1000);
        const dayMs = 1000 * 60 * 60 * 24;

        if (hourlyData.length === 0) {
            throw new HTTPError(
                404,
                `Could not fetch any historical hourly data for the given timeframe. Make sure the window is at least 1 hour.`,
            );
        }

        // Keep fetching until we pass the end date
        while (
            hourlyData[hourlyData.length - 1].hourStartUnix <=
                endDateTimestamp &&
            Math.floor(lastStartDate.getTime() / 1000) <= endDateTimestamp
        ) {
            lastStartDate = new Date(
                hourlyData[hourlyData.length - 1].hourStartUnix * 1000 + dayMs,
            ); // skip ahead 24 hrs
            const oldLength = hourlyData.length;
            hourlyData = [
                ...hourlyData,
                ...(await UniswapFetcher.getPoolHourlyData(
                    pairId,
                    lastStartDate,
                    endDate,
                )),
            ];

            // Nothing more to add
            if (hourlyData.length === oldLength) {
                break;
            }
        }

        return hourlyData;
    }

    static async getSwapsForPool(pairId: string): Promise<UniswapSwap[]> {
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
                }`,
            );
        } else if (swaps.length === 0) {
            throw new HTTPError(404);
        }

        return swaps;
    }

    static async getMintsForPool(pairId: string): Promise<UniswapMintOrBurn[]> {
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
                }`,
            );
        } else if (mints.length === 0) {
            throw new HTTPError(404);
        }

        return mints;
    }

    static async getBurnsForPool(pairId: string): Promise<UniswapMintOrBurn[]> {
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
                }`,
            );
        } else if (burns.length === 0) {
            throw new HTTPError(404);
        }

        return burns;
    }

    static async getEthPrice(
        blockNumber?: number,
    ): Promise<{ ethPrice: number }> {
        let filterStr = `id: "1"`;

        if (blockNumber) {
            filterStr = filterStr.concat(`, block: {number: ${blockNumber}}`);
        }

        const response: ApolloResponse<{
            bundle: { ethPrice: number };
        }> = await UniswapFetcher.client.query({
            query: gql`
                {
                    bundle(${filterStr}) {
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
                }`,
            );
        }

        return { ethPrice };
    }

    static async getLiquidityPositions(
        address: string,
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
                                    decimals
                                }
                                token1 {
                                    id
                                    symbol
                                    decimals
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
                }`,
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
            {},
        );

        return positions;
    }
}
