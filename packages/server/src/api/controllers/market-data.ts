import { celebrate, Joi, Segments } from 'celebrate';
import { Request } from 'express';

import validateEthAddress from 'api/util/validate-eth-address';
import cacheMiddleware from 'api/middlewares/cache';
import BitqueryFetcher from 'services/bitquery/fetcher';
import catchAsyncRoute from 'api/util/catch-async-route';

// GET /pools
// should gen the query types from the joi schema?
type GetMarketDataQuery = { baseToken: string, quoteToken: string };
const getMarketDataValidator = celebrate({
    [Segments.QUERY]: Joi.object().keys({
        baseToken: Joi.string().custom(validateEthAddress, 'Validate Token Address').required(),
        quoteToken: Joi.string().custom(validateEthAddress, 'Validate Token Address').required(),
    })
});

// GET /marketData/daily
function getPoolDailyOHLC(req: Request<unknown, unknown, unknown, GetMarketDataQuery>) {
    const { baseToken, quoteToken } = req.query;

    return BitqueryFetcher.getLastDayOHLC(baseToken, quoteToken);
}

// GET /marketData/daily
function getPoolWeeklyOHLC(req: Request<unknown, unknown, unknown, GetMarketDataQuery>) {
    const { baseToken, quoteToken } = req.query;

    return BitqueryFetcher.getLastWeekOHLC(baseToken, quoteToken);
}

export default Router()
    .get('/daily', cacheMiddleware(300), getMarketDataValidator, catchAsyncRoute(getPoolDailyOHLC))
    .get('/weekly', cacheMiddleware(300), getMarketDataValidator, catchAsyncRoute(getPoolWeeklyOHLC));

