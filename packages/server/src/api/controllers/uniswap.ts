import express from 'express';
import { Request } from 'express';

import cacheMiddleware from 'api/middlewares/cache';

import UniswapFetcher from 'services/uniswap';
import {
    UniswapDailyData,
    UniswapHourlyData,
    UniswapPair,
} from '@sommelier/shared-types';
import { HTTPError } from 'api/util/errors';
import wrapRequest from 'api/util/wrap-request';
import { isValidEthAddress } from 'util/eth';
import {
    calculateLPStats,
    calculateMarketStats,
    calculateStatsForPositions,
} from 'util/calculate-stats';

// TODO - error handling for e.g. eth address that does not match a pair

// Controllers should parse query/body, validate params, and pass to service to do the work.
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

        const topPairs = await UniswapFetcher.getTopPairs(count);
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
        const endDate = new Date();

        // Get 25 top pairs
        // TODO: make this changeable by query
        const topPairs = await UniswapFetcher.getDailyTopPerformingPairs(count);

        // TODO: Save requests by only fetching first and last day
        const historicalFetches = topPairs.map(
            (pair: UniswapPair): Promise<UniswapHourlyData[]> =>
                UniswapFetcher.getHourlyData(pair.id, startDate, endDate)
        );
        const historicalData: UniswapHourlyData[][] = await Promise.all(
            historicalFetches
        );

        // Calculate IL for top 25 pairs by liquidity
        const marketStats = await calculateMarketStats(
            topPairs,
            historicalData,
            'hourly'
        );

        const statsByReturn = [...marketStats].sort(
            (a, b) => b.pctReturn - a.pctReturn
        );

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

        const startDate = new Date(start);
        if (startDate.getTime() !== startDate.getTime())
            throw new HTTPError(400, `Received invalid date for 'startDate'.`);

        const endDate: Date = req.query.endDate
            ? new Date(req.query.endDate.toString())
            : new Date();
        if (endDate.getTime() !== endDate.getTime())
            throw new HTTPError(400, `Received invalid date for 'endDate'.`);
        const historicalDailyData = await UniswapFetcher.getHistoricalDailyData(
            pairId,
            startDate,
            endDate
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

        const startDate = new Date(start);
        if (startDate.getTime() !== startDate.getTime())
            throw new HTTPError(400, `Received invalid date for 'startDate'.`);

        const endDate: Date = req.query.endDate
            ? new Date(req.query.endDate.toString())
            : new Date();
        if (endDate.getTime() !== endDate.getTime())
            throw new HTTPError(400, `Received invalid date for 'endDate'.`);
        const historicalHourlyData = await UniswapFetcher.getHistoricalHourlyData(
            pairId,
            startDate,
            endDate
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
            : new Date();
        if (endDate.getTime() !== endDate.getTime())
            throw new HTTPError(400, `Received invalid date for 'endDate'.`);

        // Get 25 top pairs
        // TODO: make this changeable by query
        const topPairs = await UniswapFetcher.getTopPairs(100, 'volumeUSD');
        const pairsByVol = topPairs.slice(0, 25);

        // TODO: Save requests by only fetching first and last day
        const historicalFetches = pairsByVol.map((pair) =>
            UniswapFetcher.getHistoricalDailyData(pair.id, startDate, endDate)
        );
        const historicalData: UniswapDailyData[][] = await Promise.all(
            historicalFetches
        );

        // Calculate IL for top 25 pairs by liquidity
        const marketStats = await calculateMarketStats(
            pairsByVol,
            historicalData,
            'daily'
        );

        return marketStats;
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
        const ethPrice = await UniswapFetcher.getEthPrice();
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
    .get(
        '/market',
        cacheMiddleware(3600),
        wrapRequest(UniswapController.getMarketStats)
    )
    .get(
        '/pairs',
        cacheMiddleware(300),
        wrapRequest(UniswapController.getTopPairs)
    )
    .get(
        '/pairs/performance/daily',
        cacheMiddleware(300),
        wrapRequest(UniswapController.getDailyTopPerformingPairs)
    )
    .get(
        '/pairs/:id',
        cacheMiddleware(15),
        wrapRequest(UniswapController.getPairOverview)
    )
    .get(
        '/pairs/:id/swaps',
        cacheMiddleware(15),
        wrapRequest(UniswapController.getSwapsForPair)
    )
    .get(
        '/pairs/:id/addremove',
        cacheMiddleware(15),
        wrapRequest(UniswapController.getMintsAndBurnsForPair)
    )
    .get(
        '/pairs/:id/historical/daily',
        cacheMiddleware(300),
        wrapRequest(UniswapController.getHistoricalDailyData)
    )
    .get(
        '/pairs/:id/historical/hourly',
        cacheMiddleware(300),
        wrapRequest(UniswapController.getHistoricalHourlyData)
    )
    .get('/pairs/:id/stats', wrapRequest(UniswapController.getPairStats))
    .get(
        '/positions/:address',
        wrapRequest(UniswapController.getLiquidityPositions)
    )
    .get(
        '/positions/:address/stats',
        wrapRequest(UniswapController.getLiquidityPositionStats)
    );
