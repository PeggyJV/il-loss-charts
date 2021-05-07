import { celebrate, Joi, Segments } from 'celebrate';
import { Request, Router } from 'express';
import { endOfDay, subDays } from 'date-fns';

import validateEthAddress from 'api/util/validate-eth-address';
import cacheMiddleware from 'api/middlewares/cache';
import BitqueryFetcher from 'services/bitquery/fetcher';
import catchAsyncRoute from 'api/util/catch-async-route';
import * as indicators from 'util/indicators';

// GET /pools
// should gen the query types from the joi schema?
type GetMarketDataQuery = { baseToken: string; quoteToken: string };
type GetIndicatorsQuery = GetMarketDataQuery & { days: number };

const getMarketDataValidator = celebrate({
    [Segments.QUERY]: Joi.object().keys({
        baseToken: Joi.string()
            .custom(validateEthAddress, 'Validate Token Address')
            .required(),
        quoteToken: Joi.string()
            .custom(validateEthAddress, 'Validate Token Address')
            .required(),
    }),
});
const getIndicatorsValidator = celebrate({
    [Segments.QUERY]: Joi.object().keys({
        baseToken: Joi.string()
            .custom(validateEthAddress, 'Validate Token Address')
            .required(),
        quoteToken: Joi.string()
            .custom(validateEthAddress, 'Validate Token Address')
            .required(),
        days: Joi.number().integer().min(1).max(100).default(19),
    }),
});

// GET /marketData/daily
async function getPoolDailyOHLC(
    req: Request<unknown, unknown, unknown, GetMarketDataQuery>
) {
    const { baseToken, quoteToken } = req.query;

    return BitqueryFetcher.getLastDayOHLC(baseToken, quoteToken);
}

// GET /marketData/weekly
async function getPoolWeeklyOHLC(
    req: Request<unknown, unknown, unknown, GetMarketDataQuery>
) {
    const { baseToken, quoteToken } = req.query;

    return BitqueryFetcher.getLastWeekOHLC(baseToken, quoteToken);
}

// GET /marketData/indicators
async function getPoolIndicators(
    req: Request<unknown, unknown, unknown, GetIndicatorsQuery>
) {
    const { baseToken, quoteToken, days } = req.query;

    const now = new Date();
    const endDate = endOfDay(now);
    const startDate = subDays(now, days);

    const marketData = await BitqueryFetcher.getPeriodDailyOHLC(
        baseToken,
        quoteToken,
        startDate,
        endDate
    );
    const poolIndicators = indicators.getAllIndicators(marketData);

    return { marketData, indicators: poolIndicators };
}

const cacheConfig = { maxAge: 20, sMaxAge: 300, public: true, mustRevalidate: true };
export default Router()
    .get(
        '/daily',
        cacheMiddleware(300),
        getMarketDataValidator,
        catchAsyncRoute(getPoolDailyOHLC, cacheConfig)
    )
    .get(
        '/weekly',
        cacheMiddleware(300),
        getMarketDataValidator,
        catchAsyncRoute(getPoolWeeklyOHLC, cacheConfig)
    )
    .get(
        '/indicators',
        cacheMiddleware(300),
        getIndicatorsValidator,
        catchAsyncRoute(getPoolIndicators, cacheConfig)
    );
