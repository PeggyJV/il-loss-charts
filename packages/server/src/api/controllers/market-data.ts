import { celebrate, Joi, Segments } from 'celebrate';
import express, { Request, Response, Router } from 'express';

import { HTTPError } from 'api/util/errors';
import { isValidEthAddress } from 'util/eth';
import cacheMiddleware from 'api/middlewares/cache';
import BitqueryFetcher from 'services/bitquery/fetcher';
import catchAsyncRoute from 'api/util/catch-async-route';

// GET /pools
// should gen the query types from the joi schema?
type GetMarketDataQuery = { baseToken: string, quoteToken: string };
const getMarketDataValidator = celebrate({
    [Segments.QUERY]: Joi.object().keys({
        baseToken: Joi.string(),
        quoteToken: Joi.string()
    })
});

// GET /marketData/daily
function getPoolDailyOHLC(req: Request<unknown, unknown, unknown, GetMarketDataQuery>) {
    const { baseToken, quoteToken } = req.query;
    validateEthAddress(baseToken, 'baseToken');
    validateEthAddress(quoteToken, 'quoteToken');

    return BitqueryFetcher.getLastDayOHLC(baseToken, quoteToken);
}

// GET /marketData/daily
function getPoolWeeklyOHLC(req: Request<unknown, unknown, unknown, GetMarketDataQuery>) {
    const { baseToken, quoteToken } = req.query;
    validateEthAddress(baseToken, 'baseToken');
    validateEthAddress(quoteToken, 'quoteToken');

    return BitqueryFetcher.getLastWeekOHLC(baseToken, quoteToken);
}

export default express.Router()
    .get('/daily', cacheMiddleware(300), getMarketDataValidator, catchAsyncRoute(getPoolDailyOHLC))
    .get('/weekly', cacheMiddleware(300), getMarketDataValidator, catchAsyncRoute(getPoolWeeklyOHLC));

// TODO: put this somewhere else
function validateEthAddress(id: any, paramName = 'id') {
    const isValidId = isValidEthAddress(id);
    if (!isValidId) {
        throw new HTTPError(400, `'${paramName}' must be a valid ETH address.`);
    }
}