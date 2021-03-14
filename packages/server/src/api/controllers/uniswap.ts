import express from 'express';
import { Request } from 'express';

import cacheMiddleware from 'api/middlewares/cache';

import UniswapFetcher from 'services/uniswap';
import EthBlockFetcher from 'services/eth-blocks';
import {
    UniswapDailyData,
    UniswapHourlyData,
    IUniswapPair,
} from '@sommelier/shared-types';
import { HTTPError } from 'api/util/errors';
import wrapRequest from 'api/util/wrap-request';
import { isValidEthAddress } from 'util/eth';
import {
    calculateLPStats,
    calculateMarketStats,
    calculateStatsForPositions,
} from 'util/calculate-stats';

import redis from 'util/redis';
import { wrapWithCache, keepCachePopulated } from 'util/redis-data-cache';

// TODO - error handling for e.g. eth address that does not match a pair

// Controllers should parse query/body, validate params, and pass to service to do the work.

const getTopPairs = wrapWithCache(redis, UniswapFetcher.getTopPairs, 300, true);
const getCurrentTopPerformingPairs = wrapWithCache(
    redis,
    UniswapFetcher.getCurrentTopPerformingPairs,
    300,
    true
);
const getEthPrice = wrapWithCache(redis, UniswapFetcher.getEthPrice, 30, true);
const getHistoricalDailyData = wrapWithCache(
    redis,
    UniswapFetcher.getHistoricalDailyData,
    3600,
    true
);
const getHistoricalHourlyData = wrapWithCache(
    redis,
    UniswapFetcher.getHistoricalHourlyData,
    300,
    true
);
const getFirstBlockAfter = wrapWithCache(
    redis,
    EthBlockFetcher.getFirstBlockAfter,
    10000,
    false
);

// Start off keeping cache populated
void keepCachePopulated(redis, UniswapFetcher.getTopPairs, [
    undefined,
    'volumeUSD',
    true,
]);

class UniswapController {
    static async getTopPairs(req: Request) {
        let count: number | undefined;

        if (typeof req.query.count === 'string') {
            count = parseInt(req.query.count, 10);
            if (Number.isNaN(count) || count < 1)
                throw new HTTPError(
                    400,
                    `Invalid 'count' parameter: ${req.query.count}`
                );
        }

        const topPairs: IUniswapPair[] = await getTopPairs(
            count,
            'volumeUSD',
            true
        );
        return topPairs;
    }

    static async getDailyTopPerformingPairs(req: Request) {
        // Like topPairs, but sorted by returns and with
        // stats included
        let count: number | undefined;

        if (typeof req.query.count === 'string') {
            count = parseInt(req.query.count, 10);
            if (Number.isNaN(count) || count < 1)
                throw new HTTPError(
                    400,
                    `Invalid 'count' parameter: ${req.query.count}`
                );
        }

        const oneDayMs = 24 * 60 * 60 * 1000;
        const startDate = new Date(Date.now() - oneDayMs);
        // Moving endDate back by 2m to make sure we've indexed
        const endDate = new Date(Date.now() - 1000 * 60 * 2);

        // Get 25 top pairs
        // TODO: make this changeable by query
        const topPairs: IUniswapPair[] = await getCurrentTopPerformingPairs(
            count
        );

        const [startBlock, endBlock] = await Promise.all([
            getFirstBlockAfter(startDate),
            EthBlockFetcher.getLastBlockBefore(endDate),
        ]);

        const historicalFetches = topPairs.map(
            (pair: IUniswapPair): Promise<IUniswapPair[]> =>
                UniswapFetcher.getPairDeltasByTime({
                    pairId: pair.id,
                    startBlock,
                    endBlock,
                }).catch((err) => {
                    // If we have no week-old data, just skip it
                    if (err.status === 404) {
                        return [];
                    }

                    throw err;
                })
        );

        const historicalData: IUniswapPair[][] = await Promise.all(
            historicalFetches
        );

        // Calculate IL for top 25 pairs by liquidity
        const marketStats = await calculateMarketStats(
            topPairs,
            historicalData,
            'delta'
        );

        const statsByReturn = [...marketStats].sort(
            (a, b) => b.pctReturn - a.pctReturn
        );

        // Pre-cache stats for the daily top 10
        statsByReturn.slice(0, 10).forEach((pair) => {
            // Things to populate:
            // - overview
            // - daily data (up to current day)
            // - hourly data (up to current hour)

            void keepCachePopulated(redis, UniswapFetcher.getPairOverview, [
                pair.id,
            ]);
            // void keepCachePopulated(redis, UniswapFetcher.getHistoricalDailyData, [pair.id]);
        });

        return statsByReturn;
    }

    static async getWeeklyTopPerformingPairs(req: Request) {
        // Like topPairs, but sorted by returns and with
        // stats included
        let count: number | undefined;

        if (typeof req.query.count === 'string') {
            count = parseInt(req.query.count, 10);
            if (Number.isNaN(count) || count < 1)
                throw new HTTPError(
                    400,
                    `Invalid 'count' parameter: ${req.query.count}`
                );
        }

        const oneWeekMs = 24 * 60 * 60 * 1000 * 7;
        const startDate = new Date(Date.now() - oneWeekMs);

        // Moving endDate back by 2m to make sure we've indexed
        const endDate = new Date(Date.now() - 1000 * 60 * 2);

        // Get 25 top pairs
        // TODO: make this changeable by query
        const topPairs: IUniswapPair[] = await getCurrentTopPerformingPairs(
            count
        );

        // // Fetch first hour and last hour
        // const historicalFetches = topPairs.map(
        //     async (pair: IUniswapPair): Promise<UniswapHourlyData[]> => {
        //         // One hour gap between first start and end date
        //         const firstStartDate = startDate;
        //         const firstEndDate = new Date(
        //             startDate.getTime() + 1000 * 60 * 60
        //         );
        //         const firstHour = UniswapFetcher.getHourlyData(
        //             pair.id,
        //             firstStartDate,
        //             firstEndDate
        //         );

        //         const secondStartDate = new Date(
        //             endDate.getTime() - 1000 * 60 * 60
        //         );
        //         const secondEndDate = endDate;
        //         const lastHour = UniswapFetcher.getHourlyData(
        //             pair.id,
        //             secondStartDate,
        //             secondEndDate
        //         );

        //         const [firstFetch, lastFetch] = await Promise.all([
        //             firstHour,
        //             lastHour,
        //         ]);
        //         return [...firstFetch, ...lastFetch];
        //     }
        // );

        // const historicalData: UniswapHourlyData[][] = await Promise.all(
        //     historicalFetches
        // );

        const [startBlock, endBlock] = await Promise.all([
            getFirstBlockAfter(startDate),
            EthBlockFetcher.getLastBlockBefore(endDate),
        ]);

        const historicalFetches = topPairs.map(
            (pair: IUniswapPair): Promise<IUniswapPair[]> =>
                UniswapFetcher.getPairDeltasByTime({
                    pairId: pair.id,
                    startBlock,
                    endBlock,
                }).catch((err) => {
                    // If we have no week-old data, just skip it
                    if (err.status === 404) {
                        return [];
                    }

                    throw err;
                })
        );
        const historicalData: IUniswapPair[][] = await Promise.all(
            historicalFetches
        );

        // Calculate IL for top 25 pairs by liquidity
        const marketStats = await calculateMarketStats(
            topPairs,
            historicalData,
            'delta'
        );

        // TODO: Determine cause of nulls and fix
        const statsByReturn = [...marketStats].sort(
            (a, b) => b.pctReturn - a.pctReturn
        );

        // Pre-cache stats for the daily top 10
        statsByReturn.slice(0, 10).forEach((pair) => {
            void keepCachePopulated(redis, UniswapFetcher.getPairOverview, [
                pair.id,
            ]);
        });

        return statsByReturn;
    }

    static async getPairOverview(req: Request) {
        const pairId: string = req.params.id;
        // Validate ethereum address
        const validId = isValidEthAddress(pairId);
        if (!validId)
            throw new HTTPError(400, `'id' must be a valid ETH address.`);

        const pairData = await UniswapFetcher.getPairOverview(pairId);
        return pairData;
    }

    static async getSwapsForPair(req: Request) {
        const pairId: string = req.params.id;
        // Validate ethereum address
        const validId = isValidEthAddress(pairId);
        if (!validId)
            throw new HTTPError(400, `'id' must be a valid ETH address.`);

        const swaps = await UniswapFetcher.getSwapsForPair(pairId);
        return swaps;
    }

    static async getMintsAndBurnsForPair(req: Request) {
        const pairId: string = req.params.id;
        // Validate ethereum address
        const validId = isValidEthAddress(pairId);
        if (!validId)
            throw new HTTPError(400, `'id' must be a valid ETH address.`);

        const [mints, burns] = await Promise.all([
            UniswapFetcher.getMintsForPair(pairId),
            UniswapFetcher.getBurnsForPair(pairId),
        ]);

        const combined = [...mints, ...burns].sort(
            (a, b) => parseInt(b.timestamp, 10) - parseInt(a.timestamp, 10)
        );

        return { mints, burns, combined };
    }

    static async getHistoricalDailyData(req: Request) {
        const pairId: string = req.params.id;
        // Validate ethereum address
        const validId = isValidEthAddress(pairId);
        if (!validId)
            throw new HTTPError(400, `'id' must be a valid ETH address.`);

        const start: string | undefined = req.query.startDate?.toString();
        if (!start) throw new HTTPError(400, `'startDate' is required.`);

        const oneDayMs = 24 * 60 * 60 * 1000;

        const startDate = new Date(start);
        if (startDate.getTime() !== startDate.getTime())
            throw new HTTPError(400, `Received invalid date for 'startDate'.`);

        const startDateDayStart = new Date(
            Math.floor(startDate.getTime() / oneDayMs) * oneDayMs
        );

        const endDate: Date = req.query.endDate
            ? new Date(req.query.endDate.toString())
            : new Date();
        if (endDate.getTime() !== endDate.getTime())
            throw new HTTPError(400, `Received invalid date for 'endDate'.`);

        const endDateDayEnd = new Date(
            Math.ceil(endDate.getTime() / oneDayMs) * oneDayMs
        );

        const historicalDailyData: UniswapDailyData[] = await getHistoricalDailyData(
            pairId,
            startDateDayStart,
            endDateDayEnd
        );

        return historicalDailyData;
    }

    static async getHistoricalHourlyData(req: Request) {
        const pairId: string = req.params.id;
        // Validate ethereum address
        const validId = isValidEthAddress(pairId);
        if (!validId)
            throw new HTTPError(400, `'id' must be a valid ETH address.`);

        // TODO: Validate we can't go >1 week backs
        const start: string | undefined = req.query.startDate?.toString();
        if (!start) throw new HTTPError(400, `'startDate' is required.`);

        const oneHourMs = 60 * 60 * 1000;

        const startDate = new Date(start);
        if (startDate.getTime() !== startDate.getTime())
            throw new HTTPError(400, `Received invalid date for 'startDate'.`);

        const startDateHourStart = new Date(
            Math.floor(startDate.getTime() / oneHourMs) * oneHourMs
        );

        const endDate: Date = req.query.endDate
            ? new Date(req.query.endDate.toString())
            : new Date();
        if (endDate.getTime() !== endDate.getTime())
            throw new HTTPError(400, `Received invalid date for 'endDate'.`);

        const endDateHourEnd = new Date(
            Math.ceil(endDate.getTime() / oneHourMs) * oneHourMs
        );

        const historicalHourlyData: UniswapHourlyData[] = await getHistoricalHourlyData(
            pairId,
            startDateHourStart,
            endDateHourEnd
        );
        return historicalHourlyData;
    }

    static async getMarketStats(req: Request) {
        const start: string | undefined = req.query.startDate?.toString();
        if (!start) throw new HTTPError(400, `'startDate' is required.`);

        const startDate = new Date(start);
        if (startDate.getTime() !== startDate.getTime())
            throw new HTTPError(400, `Received invalid date for 'startDate'.`);

        const endDate: Date = req.query.endDate
            ? new Date(req.query.endDate.toString())
            : // Move endDate back 2m to make sure the subgraph has indexed
              new Date(Date.now() - 1000 * 60 * 2);
        if (endDate.getTime() !== endDate.getTime())
            throw new HTTPError(400, `Received invalid date for 'endDate'.`);

        // Get 25 top pairs
        // TODO: make this changeable by query
        const topPairs = await getTopPairs(100, 'volumeUSD');
        const pairsByVol = topPairs.slice(0, 40);

        const [startBlock, endBlock] = await Promise.all([
            getFirstBlockAfter(startDate),
            EthBlockFetcher.getLastBlockBefore(endDate),
        ]);

        const historicalFetches = topPairs.map(
            (pair: IUniswapPair): Promise<IUniswapPair[]> =>
                UniswapFetcher.getPairDeltasByTime({
                    pairId: pair.id,
                    startBlock,
                    endBlock,
                    fetchPartial: false,
                }).catch((err) => {
                    // If we have no week-old data, just skip it
                    if (err.status === 404) {
                        return [];
                    }

                    throw err;
                })
        );

        const historicalData: IUniswapPair[][] = await Promise.all(
            historicalFetches
        );

        // Calculate IL for top 25 pairs by liquidity
        const marketStats = await calculateMarketStats(
            pairsByVol,
            historicalData,
            'delta'
        );

        return marketStats.slice(0, 25);
    }

    static async getPairStats(req: Request) {
        const pairId: string | undefined = req.params.id?.toString();
        if (!pairId) throw new HTTPError(400, `'id' is required.`);

        // Validate ethereum address
        const validId = isValidEthAddress(pairId);
        if (!validId)
            throw new HTTPError(400, `'id' must be a valid ETH address.`);

        const start: string | undefined = req.query.startDate?.toString();
        if (!start) throw new HTTPError(400, `'startDate' is required.`);

        const startDate = new Date(start);
        if (startDate.getTime() !== startDate.getTime())
            throw new HTTPError(400, `Received invalid date for 'startDate'.`);

        const endDate: Date = req.query.endDate
            ? new Date(req.query.endDate.toString())
            : new Date();
        if (endDate.getTime() !== endDate.getTime())
            throw new HTTPError(400, `Received invalid date for 'endDate'.`);

        if (!req.query.lpLiquidityUSD)
            throw new HTTPError(400, `'lpLiquidityUSD' is required.`);
        const lpLiquidityUSD: number = parseInt(
            req.query.lpLiquidityUSD?.toString(),
            10
        );
        if (Number.isNaN(lpLiquidityUSD) || lpLiquidityUSD < 0)
            throw new HTTPError(400, `Invalid 'lpLiquidityUSD' value.`);

        const [pairData, historicalDailyData] = await Promise.all([
            UniswapFetcher.getPairOverview(pairId),
            UniswapFetcher.getHistoricalDailyData(pairId, startDate, endDate),
        ]);

        const lpStats = calculateLPStats({
            pairData,
            dailyData: historicalDailyData,
            lpShare: lpLiquidityUSD,
            lpDate: startDate,
        });
        return lpStats;
    }

    static async getEthPrice() {
        const ethPrice: { ethPrice: number } = await getEthPrice();
        return ethPrice;
    }

    static async getLiquidityPositions(req: Request) {
        const userAddress: string | undefined = req.params.address?.toString();
        if (!userAddress) throw new HTTPError(400, `'address' is required.`);

        // Validate ethereum address
        const validId = isValidEthAddress(userAddress);
        if (!validId)
            throw new HTTPError(400, `'address' must be a valid ETH address.`);

        const liquidityPositions = await UniswapFetcher.getLiquidityPositions(
            userAddress
        );

        return liquidityPositions;
    }

    static async getLiquidityPositionStats(req: Request) {
        const liquidityPositions = await UniswapController.getLiquidityPositions(
            req
        );

        const positionStats = await calculateStatsForPositions(
            liquidityPositions
        );

        return { positions: liquidityPositions, stats: positionStats };
    }
}

export default express
    .Router()
    .get('/ethPrice', wrapRequest(UniswapController.getEthPrice))
    .get('/market', wrapRequest(UniswapController.getMarketStats))
    .get('/pairs', wrapRequest(UniswapController.getTopPairs))
    .get(
        '/pairs/performance/daily',
        cacheMiddleware(300),
        wrapRequest(UniswapController.getDailyTopPerformingPairs)
    )
    .get(
        '/pairs/performance/weekly',
        cacheMiddleware(300),
        wrapRequest(UniswapController.getWeeklyTopPerformingPairs)
    )
    .get('/pairs/:id', wrapRequest(UniswapController.getPairOverview))
    .get(
        '/pairs/:id/swaps',
        cacheMiddleware(60),
        wrapRequest(UniswapController.getSwapsForPair)
    )
    .get(
        '/pairs/:id/addremove',
        cacheMiddleware(60),
        wrapRequest(UniswapController.getMintsAndBurnsForPair)
    )
    .get(
        '/pairs/:id/historical/daily',
        wrapRequest(UniswapController.getHistoricalDailyData)
    )
    .get(
        '/pairs/:id/historical/hourly',
        wrapRequest(UniswapController.getHistoricalHourlyData)
    )
    .get('/pairs/:id/stats', wrapRequest(UniswapController.getPairStats))
    .get(
        '/positions/:address',
        cacheMiddleware(60),
        wrapRequest(UniswapController.getLiquidityPositions)
    )
    .get(
        '/positions/:address/stats',
        cacheMiddleware(300),
        wrapRequest(UniswapController.getLiquidityPositionStats)
    );
