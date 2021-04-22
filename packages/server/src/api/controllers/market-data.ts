import { celebrate, Joi, Segments } from 'celebrate';
import express, { Request, Response, Router } from 'express';

import { HTTPError } from 'api/util/errors';
import { isValidEthAddress } from 'util/eth';
import cacheMiddleware from 'api/middlewares/cache';
import BitqueryFetcher from 'services/bitquery/fetcher';
import wrapRequest from 'api/util/wrap-request';

// TODO: move this somewhere else, maybe to the fetchers manager.
import { wrapWithCache, keepCachePopulated } from 'util/redis-data-cache';
import redis from 'util/redis';

// GET /pools
// should gen the query types from the joi schema?
type GetMarketDataQuery = { baseToken: string, quoteToken: string };
const getMarketDataValidator = celebrate({
    [Segments.QUERY]: Joi.object().keys({
        baseToken: Joi.string(),
        quoteToken: Joi.string()
    })
});

const fetcher = new BitqueryFetcher();

// GET /marketData/daily
function getPoolDailyOHLC(req: Request<unknown, unknown, unknown, GetMarketDataQuery>) {
    const { baseToken, quoteToken } = req.query;
    validateEthAddress(baseToken);
    validateEthAddress(quoteToken);

    return fetcher.getLastDayOHLC(baseToken, quoteToken);
}

// GET /marketData/daily
function getPoolWeeklyOHLC(req: Request<unknown, unknown, unknown, GetMarketDataQuery>) {
    const { baseToken, quoteToken } = req.query;
    validateEthAddress(baseToken);
    validateEthAddress(quoteToken);

    return fetcher.getLastWeekOHLC(baseToken, quoteToken);
}

export default express.Router()
    .get('/daily', cacheMiddleware(300), getMarketDataValidator, wrapRequest(getPoolDailyOHLC))
    .get('/weekly', cacheMiddleware(300), getMarketDataValidator, wrapRequest(getPoolWeeklyOHLC));

// TODO: put this somewhere else
function validateEthAddress(id: any) {
    const isValidId = isValidEthAddress(id);
    if (!isValidId) {
        throw new HTTPError(400, `'id' must be a valid ETH address.`);
    }
}