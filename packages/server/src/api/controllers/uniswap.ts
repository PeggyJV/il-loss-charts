import express from 'express';
import { Request, Response } from 'express';

import cacheMiddleware from 'api/middlewares/cache';

import UniswapFetcher from 'services/uniswap';
import { HTTPError } from 'api/util/errors';
import wrapRequest from 'api/util/wrap-request';
import { isValidEthAddress } from 'util/eth';
import { calculateLPStats, calculateMarketStats } from 'util/calculate-stats';


// TODO - caching
// TODO - wrap controllers
// TODO - create data types for all response shapes
// TODO - error handling for e.g. eth address that does not match a pair

// Controllers should parse query/body, validate params, and pass to service to do the work.
class UniswapController {
    static async getTopPairs(req: Request) {
        const count: number = req.query.count && parseInt(req.query.count?.toString(), 10);
        if (Number.isNaN(count) || count < 1) throw new HTTPError(400, `Invalid count parameter: ${req.query.count}`);

        const topPairs = await UniswapFetcher.getTopPairs(count);
        return topPairs;
    }

    static async getPairOverview(req: Request) {
        const pairId: string = req.params.id;
        // Validate ethereum address
        const validId = isValidEthAddress(pairId);
        if (!validId) throw new HTTPError(400, `ID must be a valid ETH address.`);

        const pairData = await UniswapFetcher.getPairOverview(pairId);
        return pairData;
    }

    static async getSwapsForPair(req: Request) {
        const pairId: string = req.params.id;
        // Validate ethereum address
        const validId = isValidEthAddress(pairId);
        if (!validId) throw new HTTPError(400, `ID must be a valid ETH address.`);

        const swaps = await UniswapFetcher.getSwapsForPair(pairId);
        return swaps;
    }

    static async getMintsAndBurnsForPair(req: Request) {
        const pairId: string = req.params.id;
        // Validate ethereum address
        const validId = isValidEthAddress(pairId);
        if (!validId) throw new HTTPError(400, `ID must be a valid ETH address.`);

        const [mints, burns] = await Promise.all([
            UniswapFetcher.getMintsForPair(pairId),
            UniswapFetcher.getBurnsForPair(pairId)
        ]);

        const combined = [...mints, ...burns].sort((a, b) => parseInt(b.timestamp, 10) - parseInt(a.timestamp, 10));

        return { mints, burns, combined };
    }

    static async getHistoricalDailyData(req: Request) {
        const pairId: string = req.params.id;
        // Validate ethereum address
        const validId = isValidEthAddress(pairId);
        if (!validId) throw new HTTPError(400, `id must be a valid ETH address.`);

        const start: string = req.query.startDate?.toString();
        if (!start) throw new HTTPError(400, `startDate is required.`);

        const startDate = new Date(start);
        if (startDate.getTime() !== startDate.getTime()) throw new HTTPError(400, `Received invalid date for startDate.`);

        const endDate: Date = req.query.endDate ? new Date(req.query.endDate.toString()) : new Date();
        if (endDate.getTime() !== endDate.getTime()) throw new HTTPError(400, `Received invalid date for endDate.`);

        const historicalDailyData = await UniswapFetcher.getHistoricalDailyData(pairId, startDate, endDate);
        return historicalDailyData;
    }

    static async getMarketStats(req: Request) {
        const start: string = req.query.startDate?.toString();
        if (!start) throw new HTTPError(400, `startDate is required.`);

        const startDate = new Date(start);
        if (startDate.getTime() !== startDate.getTime()) throw new HTTPError(400, `Received invalid date for startDate.`);

        const endDate: Date = req.query.endDate ? new Date(req.query.endDate.toString()) : new Date();
        if (endDate.getTime() !== endDate.getTime()) throw new HTTPError(400, `Received invalid date for endDate.`);

        // Get 25 top pairs
        // TODO: make this changeable by query
        const topPairs = await UniswapFetcher.getTopPairs(100, 'volumeUSD');
        const pairsByVol = topPairs.slice(0, 25);

        // TODO: Save requests by only fetching first and last day
        const historicalFetches = pairsByVol.map((pair) => UniswapFetcher.getHistoricalDailyData(pair.id, startDate, endDate));
        const historicalData: any[] = await Promise.all(historicalFetches);

        // Calculate IL for top 25 pairs by liquidity
        const marketStats = await calculateMarketStats(pairsByVol, historicalData, 'daily');

        return marketStats;
    }

    static async getPairStats(req: Request) {
        const pairId: string = req.query.id.toString();
        // Validate ethereum address
        const validId = isValidEthAddress(pairId);
        if (!validId) throw new HTTPError(400, `ID must be a valid ETH address.`);

        const start: string = req.query.startDate?.toString();
        if (!start) throw new HTTPError(400, `startDate is required.`);

        const startDate = new Date(start);
        if (startDate.getTime() !== startDate.getTime()) throw new HTTPError(400, `Received invalid date for startDate.`);

        const endDate: Date = req.query.endDate ? new Date(req.query.endDate.toString()) : new Date();
        if (endDate.getTime() !== endDate.getTime()) throw new HTTPError(400, `Received invalid date for endDate.`);


        if (!req.query.lpLiquidityUSD) throw new HTTPError(400, `lpLiquidityUSD is required.`);
        const lpLiquidityUSD: number = parseInt(req.query.lpLiquidityUSD?.toString(), 10);
        if (Number.isNaN(lpLiquidityUSD) || lpLiquidityUSD < 0) throw new HTTPError(400, `Invalid lpLiquidityUSD value.`);

        const [pairData, historicalDailyData] = await Promise.all([
            UniswapFetcher.getPairOverview(pairId),
            UniswapFetcher.getHistoricalDailyData(pairId, startDate, endDate)
        ]);

        const lpStats = calculateLPStats(pairData, historicalDailyData, lpLiquidityUSD);
        return lpStats;
    }

    static async getEthPrice(req: Request) {
        const ethPrice = await UniswapFetcher.getEthPrice();
        return ethPrice;
    }
}


export default express
    .Router()
    .get('/ethPrice', wrapRequest(UniswapController.getEthPrice))
    .get('/market', cacheMiddleware(3600), wrapRequest(UniswapController.getMarketStats))
    .get('/pairs', cacheMiddleware(300), wrapRequest(UniswapController.getTopPairs))
    .get('/pairs/:id', cacheMiddleware(15), wrapRequest(UniswapController.getPairOverview))
    .get('/pairs/:id/swaps', cacheMiddleware(15), wrapRequest(UniswapController.getSwapsForPair))
    .get('/pairs/:id/addremove', cacheMiddleware(15), wrapRequest(UniswapController.getMintsAndBurnsForPair))
    .get('/historical/:id', cacheMiddleware(300), wrapRequest(UniswapController.getHistoricalDailyData))
    .get('/stats', wrapRequest(UniswapController.getPairStats));
