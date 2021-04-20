import { celebrate, Joi, Segments } from 'celebrate';
import {
  endOfDay,
  endOfHour,
  startOfDay,
  startOfHour,
  subWeeks,
} from 'date-fns';
import { Request, Response, Router } from 'express';

import { dayMs } from 'util/date'
import { HTTPError } from 'api/util/errors';
import { isValidEthAddress } from 'util/eth';
import cacheMiddleware from 'api/middlewares/cache';
import UV3Fetchers from 'services/uniswap-v3/fetchers';
import wrapRequest from 'api/util/wrap-request';

// TODO: move this somewhere else, maybe to the fetchers manager.
// Will also need to namespace by network
import { wrapWithCache, keepCachePopulated } from 'util/redis-data-cache';
import redis from 'util/redis';
const fetcher = UV3Fetchers.get('mainnet');

// TODO: Not actually cached for now, want to fix type of wrapWithCache first
const cached = {
  getEthPrice: fetcher.getEthPrice,
  getTopPools: fetcher.getTopPools,
  getHistoricalDailyData: fetcher.getHistoricalDailyData,
  getHistoricalHourlyData: fetcher.getHistoricalHourlyData,

}

// GET /ethPrice
async function getEthPrice() {
  const ethPrice = await cached.getEthPrice();
  return ethPrice;
}

// GET /pools
// should gen the query types from the joi schema?
type GetTopPoolsQuery = { count: number };
const getTopPoolsValidator = celebrate({
  [Segments.QUERY]: Joi.object().keys({
    count: Joi.number()
  })
});

async function getTopPools(req: Request<unknown, unknown, unknown, GetTopPoolsQuery>) {
  const { count } = req.query;
  return cached.getTopPools(count);
}

// GET /pools/:id
async function getPoolOverview(req: Request) {
  const { id } = req.params;
  validateEthAddress(id);

  return fetcher.getPoolOverview(id);
}

// GET /pools/:id/historical/daily
type GetHistoricalDataQuery = {
  startDate: Date,
  endDate?: Date,
}
const getHistoricalDataValidator = celebrate({
  [Segments.QUERY]: Joi.object().keys({
    startDate: Joi.date().required(),
    endDate: Joi.date().greater(Joi.ref('startDate')),
  })
});

async function getHistoricalDailyData(req: Request<{ id: string }, unknown, unknown, GetHistoricalDataQuery>) {
  const { id } = req.params;
  validateEthAddress(id);

  const { startDate, endDate } = req.query;
  const start = startOfDay(startDate);
  const end = endOfDay(endDate ?? new Date());

  return cached.getHistoricalDailyData(id, start, end);
}

// GET /pools/:id/historical/hourly
async function getHistoricalHourlyData(req: Request<{ id: string }, unknown, unknown, GetHistoricalDataQuery>) {
  const { id } = req.params;
  validateEthAddress(id);

  const { startDate, endDate } = req.query;
  if (startDate < subWeeks(startDate, 1)) {
    throw new HTTPError(400, `'startDate' must fall within the window of 1 week.`);
  }
  const start = startOfHour(startDate);
  const end = endOfHour(endDate ?? new Date());

  return cached.getHistoricalHourlyData(id, start, end);
}

const route = Router();
export default (app: Router, baseUrl: string) => {
  app.use(baseUrl, route);

  route.get('/ethPrice', wrapRequest(getEthPrice));
  route.get('/pools', getTopPoolsValidator, wrapRequest(getTopPools));
  route.get('/pools/:id', wrapRequest(getPoolOverview));
  route.get('/pools/:id/historical/daily', getHistoricalDataValidator, wrapRequest(getHistoricalDailyData));
  route.get('/pools/:id/historical/hourly', getHistoricalDataValidator, wrapRequest(getHistoricalHourlyData));
}

// TODO: put this somewhere else
function validateEthAddress(id: any) {
  const isValidId = isValidEthAddress(id);
  if (!isValidId) {
    throw new HTTPError(400, `'id' must be a valid ETH address.`);
  }
}