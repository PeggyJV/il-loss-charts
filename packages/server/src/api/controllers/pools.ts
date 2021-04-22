import { celebrate, Joi, Segments } from 'celebrate';
import {
  endOfDay,
  endOfHour,
  startOfDay,
  startOfHour,
  subWeeks,
} from 'date-fns';
import { Request, Router } from 'express';

import { EthNetwork } from '@sommelier/shared-types';

import { HTTPError } from 'api/util/errors';
import { isValidEthAddress } from 'util/eth';
import { UniswapV3Fetchers } from 'services/uniswap-v3/fetchers';
import catchAsyncRoute from 'api/util/catch-async-route';
import config from 'config';

type Path = {
  network: EthNetwork
};

type PoolPath = Path & {
  poolId: string,
};

const networks = Object.keys(config.uniswap.v3.networks);
// TODO: move this somewhere else, mpaybe to the fetchers manager.
// Will also need to namespace by network
const fetcher = UniswapV3Fetchers.get('mainnet');

// TODO: move this to utils
const poolIdParamsSchema = Joi.object().keys({
  poolId: Joi.string().custom(validateEthAddress, 'Validate Pool Id').required(),
  network: Joi.string().valid(...networks).required(),
});
const poolIdValidator = celebrate({
  [Segments.PARAMS]: poolIdParamsSchema,
});

const networkSchema = Joi.object().keys({
  network: Joi.string().valid(...networks).required(),
})
const networkValidator = celebrate({
  [Segments.PARAMS]: networkSchema,
});

// GET /ethPrice
async function getEthPrice(req: Request<Path, unknown, unknown, unknown>) {
  const { network } = req.params;
  const fetcher = UniswapV3Fetchers.get(network);

  return fetcher.getEthPrice();
}

// GET /pools
// should gen the query types from the joi schema?
type GetTopPoolsQuery = { count: number, sort: 'volumeUSD' | 'reserveUSD' };
const getTopPoolsValidator = celebrate({
  [Segments.QUERY]: Joi.object().keys({
    count: Joi.number().min(1).max(1000).default(100),
    sort: Joi.string().valid('volumeUSD', 'reserveUSD').default('volumeUSD'),
  }),
  [Segments.PARAMS]: networkSchema,
});

async function getTopPools(req: Request<Path, unknown, unknown, GetTopPoolsQuery>) {
  const { network } = req.params;
  const fetcher = UniswapV3Fetchers.get(network);

  // TODO: add override for route.get()
  // Request<any, any, any, ParsedQs> query must be a ParsedQs
  // We should add a union type for all validated queries
  // or find a better TS integration with Celebrate
  const { count, sort }: GetTopPoolsQuery = <any> req.query;
  return fetcher.getTopPools(count, sort);
}

// GET /pools/:id
async function getPoolOverview(req: Request<PoolPath, unknown, unknown, unknown>) {
  const { poolId, network } = req.params;
  const fetcher = UniswapV3Fetchers.get(network);

  return fetcher.getPoolOverview(poolId);
}

// GET /pools/:id/historical/daily
type GetHistoricalDataQuery = {
  startDate: Date,
  endDate?: Date,
}
const getHistoricalDataValidator = celebrate({
  [Segments.PARAMS]: poolIdParamsSchema,
  [Segments.QUERY]: Joi.object().keys({
    startDate: Joi.date().required(),
    endDate: Joi.date().greater(Joi.ref('startDate')),
  })
});

async function getHistoricalDailyData(req: Request<PoolPath, unknown, unknown, GetHistoricalDataQuery>) {
  const { poolId, network } = req.params;
  const fetcher = UniswapV3Fetchers.get(network);

  // TODO: Fix type
  const { startDate, endDate } = req.query;
  const start = startOfDay(startDate);
  const end = endOfDay(endDate ?? new Date());

  return fetcher.getHistoricalDailyData(poolId, start, end);
}

// GET /pools/:id/historical/hourly
async function getHistoricalHourlyData(req: Request<PoolPath, unknown, unknown, GetHistoricalDataQuery>) {
  const { poolId, network } = req.params;
  const fetcher = UniswapV3Fetchers.get(network);

  const { startDate, endDate }: GetHistoricalDataQuery = <any> req.query;
  if (startDate < subWeeks(new Date(), 1)) {
    throw new HTTPError(400, `"startDate" must fall within the window of 1 week.`);
  }
  const start = startOfHour(startDate);
  const end = endOfHour(endDate ?? new Date());

  return fetcher.getHistoricalHourlyData(poolId, start, end);
}

const route = Router();
export default (app: Router, baseUrl: string): void => {
  app.use(baseUrl, route);

  route.get('/:network/ethPrice', networkValidator, catchAsyncRoute(getEthPrice));
  route.get('/:network/pools', getTopPoolsValidator, catchAsyncRoute(getTopPools));
  route.get('/:network/pools/:poolId', poolIdValidator, catchAsyncRoute(getPoolOverview));
  route.get('/:network/pools/:poolId/historical/daily', getHistoricalDataValidator, catchAsyncRoute(getHistoricalDailyData));
  route.get('/:network/pools/:poolId/historical/hourly', getHistoricalDataValidator, catchAsyncRoute(getHistoricalHourlyData));
}

// TODO: put this somewhere else
function validateEthAddress(id: any): string {
  const isValidId = isValidEthAddress(id);
  if (!isValidId) {
    throw new Error('"id" must be a valid ETH address.');
  }

  const validAddress: string = id;
  return validAddress;
}