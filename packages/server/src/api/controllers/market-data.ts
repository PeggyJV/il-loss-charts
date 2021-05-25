/* eslint-disable @typescript-eslint/require-await */
import { celebrate, Joi, Segments } from 'celebrate';
import { Request, Router } from 'express';
import { endOfDay, startOfDay, subDays } from 'date-fns';

import * as indicators from 'util/indicators';
import { DexTrade } from 'services/bitquery/generated-types';
import { PoolDayData, Pool } from 'services/uniswap-v3/generated-types';
import { LiquidityBand, OHLCData } from '@sommelier/shared-types';
import { minuteMs } from 'util/date';
import validateEthAddress from 'api/util/validate-eth-address';
import BitqueryFetcher from 'services/bitquery/fetcher';
import { UniswapV3Fetchers } from 'services/uniswap-v3';
import catchAsyncRoute from 'api/util/catch-async-route';
import appConfig from '@config';
import memoizer from 'util/memoizer-redis';
import redis from 'util/redis';

// configure memoizer
const config = appConfig.memoizerRedis;
const memoTTLMs = minuteMs * 5;
const memoize = memoizer(redis, { ttl: memoTTLMs, enabled: config.enabled });
// Market data only exists for mainnet
const UniswapFetcher = UniswapV3Fetchers.get('mainnet');

// GET /pools
// should gen the query types from the joi schema?
type GetMarketDataQuery = {
    baseToken?: string;
    quoteToken?: string;
    poolId?: string;
};
type GetIndicatorsQuery = GetMarketDataQuery & { days: number };
type PoolDayDataResult = PoolDayData & { pool: Partial<Pool> };

const getMarketDataValidator = celebrate({
    [Segments.QUERY]: Joi.object().keys({
        baseToken: Joi.string().custom(
            validateEthAddress,
            'Validate Token Address',
        ),
        quoteToken: Joi.string().custom(
            validateEthAddress,
            'Validate Token Address',
        ),
        poolId: Joi.string().custom(
            validateEthAddress,
            'Validate Token Address',
        ),
    }),
});
const getIndicatorsValidator = celebrate({
    [Segments.QUERY]: Joi.object().keys({
        baseToken: Joi.string().custom(
            validateEthAddress,
            'Validate Token Address',
        ),
        quoteToken: Joi.string().custom(
            validateEthAddress,
            'Validate Token Address',
        ),
        poolId: Joi.string().custom(
            validateEthAddress,
            'Validate Token Address',
        ),
        // stay in lockstep with cache warmer, revist when we make this a variable api
        days: Joi.number().integer().min(19).max(19).default(19),
    }),
});

function convertBitqueryToOHLC(dexTradeData: DexTrade): OHLCData {
    return {
        baseCurrency: dexTradeData.baseCurrency.address,
        quoteCurrency: dexTradeData.quoteCurrency.address,
        current: dexTradeData.quotePrice,
        open: parseFloat(dexTradeData.open_price || '0'),
        high: dexTradeData.maximum_price,
        low: dexTradeData.minimum_price,
        close: parseFloat(dexTradeData.close_price || '0'),
    };
}

function convertUniswapToOHLC(dailyData: Record<string, any>): OHLCData {
    return {
        baseCurrency: dailyData.pool.token1.id,
        quoteCurrency: dailyData.pool.token0.id,
        current: parseFloat(dailyData.pool.token0Price),
        open: parseFloat(dailyData.open),
        high: parseFloat(dailyData.high),
        low: parseFloat(dailyData.low),
        close: parseFloat(dailyData.close),
    };
}

// GET /marketData/daily
const getLastDayOHLC = memoize(
    BitqueryFetcher.getLastDayOHLC.bind(BitqueryFetcher),
);
async function getPoolDailyOHLC(
    req: Request<unknown, unknown, unknown, GetMarketDataQuery>,
) {
    const { baseToken, quoteToken } = req.query;

    const result: DexTrade = await getLastDayOHLC(baseToken, quoteToken);
    const ohlc = convertBitqueryToOHLC(result);
    return ohlc;
}

// GET /marketData/weekly
const getLastWeekOHLC = memoize(
    BitqueryFetcher.getLastWeekOHLC.bind(BitqueryFetcher),
);
async function getPoolWeeklyOHLC(
    req: Request<unknown, unknown, unknown, GetMarketDataQuery>,
) {
    const { baseToken, quoteToken } = req.query;

    const result: DexTrade = await getLastWeekOHLC(baseToken, quoteToken);
    const ohlc = convertBitqueryToOHLC(result);
    return ohlc;
}

// GET /marketData/indicators
const getBitqueryPeriodIndicators = memoize(_getBitqueryPeriodIndicators);
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function _getBitqueryPeriodIndicators(
    baseToken: string,
    quoteToken: string,
    startDate: number,
    endDate: number,
) {
    const marketData = await BitqueryFetcher.getPeriodDailyOHLC(
        baseToken,
        quoteToken,
        startDate,
        endDate,
    );
    const ohlc = marketData.map(convertBitqueryToOHLC);
    console.log('THIS IS OHLC', ohlc);

    const poolIndicators = indicators.getAllIndicators(ohlc);
    return { marketData, indicators: poolIndicators };
}

// GET /marketData/indicators
const getUniswapPeriodIndicators = memoize(_getUniswapPeriodIndicators);
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function _getUniswapPeriodIndicators(
    poolId: string,
    startDate: number,
    endDate: number,
) {
    const marketData = await UniswapFetcher.getHistoricalDailyData(
        poolId,
        new Date(startDate),
        new Date(endDate),
    );

    const ohlc = marketData.map(convertUniswapToOHLC);

    const poolIndicators = indicators.getAllIndicators(ohlc);
    return { marketData, indicators: poolIndicators };
}

async function getPoolIndicators(
    req: Request<unknown, unknown, unknown, GetIndicatorsQuery>,
) {
    const { baseToken, quoteToken, poolId } = req.query;
    // TODO: config
    const days = 19; // stay in lockstep with cache warmer

    // if this logic changes, we must update the cache warmer worker
    const now = new Date();
    const endDate = endOfDay(now).getTime();
    const startDate = startOfDay(subDays(now, days)).getTime();

    if (poolId) {
        const result: {
            marketData: PoolDayDataResult[];
            indicators: LiquidityBand;
        } = await getUniswapPeriodIndicators(poolId, startDate, endDate);
        return result;
    } else {
        const result: {
            marketData: DexTrade[];
            indicators: LiquidityBand;
        } = await getBitqueryPeriodIndicators(
            baseToken,
            quoteToken,
            startDate,
            endDate,
        );
        return result;
    }
}

const cacheConfig = { maxAge: 60, sMaxAge: memoTTLMs / 1000, public: true };
export default Router()
    .get(
        '/daily',
        getMarketDataValidator,
        catchAsyncRoute(getPoolDailyOHLC, cacheConfig),
    )
    .get(
        '/weekly',
        getMarketDataValidator,
        catchAsyncRoute(getPoolWeeklyOHLC, cacheConfig),
    )
    .get(
        '/indicators',
        getIndicatorsValidator,
        catchAsyncRoute(getPoolIndicators, cacheConfig),
    );
