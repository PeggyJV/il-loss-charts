/* eslint-disable @typescript-eslint/require-await */
import { celebrate, Joi, Segments } from 'celebrate';
import { Request, Router } from 'express';
import { endOfDay, startOfDay, subDays } from 'date-fns';

import * as indicators from 'util/indicators';
import { DexTrade } from 'services/bitquery/generated-types';
import { LiquidityBand } from '@sommelier/shared-types';
import { minuteMs } from 'util/date';
import validateEthAddress from 'api/util/validate-eth-address';
import BitqueryFetcher from 'services/bitquery/fetcher';
import catchAsyncRoute from 'api/util/catch-async-route';
import appConfig from 'config';
import memoizer from 'util/memoizer-redis';
import redis from 'util/redis';

// configure memoizer
const config = appConfig.memoizerRedis;
const memoTTLMs = minuteMs * 5
const memoize = memoizer(redis, { ttl: memoTTLMs, enabled: config.enabled });

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
const getLastDayOHLC = memoize(BitqueryFetcher.getLastDayOHLC.bind(BitqueryFetcher));
async function getPoolDailyOHLC(
    req: Request<unknown, unknown, unknown, GetMarketDataQuery>
) {
    const { baseToken, quoteToken } = req.query;

    const result: DexTrade = (await getLastDayOHLC(baseToken, quoteToken) );
    return result;
}

// GET /marketData/weekly
const getLastWeekOHLC = memoize(BitqueryFetcher.getLastWeekOHLC.bind(BitqueryFetcher));
async function getPoolWeeklyOHLC(
    req: Request<unknown, unknown, unknown, GetMarketDataQuery>
) {
    const { baseToken, quoteToken } = req.query;

    const result: DexTrade = (await getLastWeekOHLC(baseToken, quoteToken) );
    return result;
}

// GET /marketData/indicators
const getPeriodIndicators = memoize(_getPeriodIndicators);
async function _getPeriodIndicators(baseToken: string, quoteToken: string, startDate: number, endDate: number) {
    const marketData = await BitqueryFetcher.getPeriodDailyOHLC(
        baseToken,
        quoteToken,
        startDate,
        endDate
    );

    const poolIndicators = indicators.getAllIndicators(marketData);
    return { marketData, indicators: poolIndicators };
}

async function getPoolIndicators(
    req: Request<unknown, unknown, unknown, GetIndicatorsQuery>
) {
    const { baseToken, quoteToken, days } = req.query;

    const now = new Date();
    const endDate = endOfDay(now).getTime();
    const startDate = startOfDay(subDays(now, days)).getTime();

    const result: { marketData: DexTrade[], indicators: LiquidityBand } = (await getPeriodIndicators(baseToken, quoteToken, startDate, endDate) );
    return result;
}

const cacheConfig = { maxAge: 15, sMaxAge: memoTTLMs / 1000, public: true, mustRevalidate: true };
export default Router()
    .get(
        '/daily',
        getMarketDataValidator,
        catchAsyncRoute(getPoolDailyOHLC, cacheConfig)
    )
    .get(
        '/weekly',
        getMarketDataValidator,
        catchAsyncRoute(getPoolWeeklyOHLC, cacheConfig)
    )
    .get(
        '/indicators',
        getIndicatorsValidator,
        catchAsyncRoute(getPoolIndicators, cacheConfig)
    );
