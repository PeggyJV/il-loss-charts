import { celebrate, Joi, Segments } from 'celebrate';
import {
  endOfDay,
  endOfHour,
  startOfDay,
  startOfHour,
  subWeeks,
} from 'date-fns';
import { Request, Router } from 'express';
import { EthNetwork, IToken, IUniswapPair } from '@sommelier/shared-types';
import BigNum from 'bignumber.js'

import { HTTPError } from 'api/util/errors';
import { Pool, Token } from 'services/uniswap-v3/generated-types';
import { UniswapV3Fetchers } from 'services/uniswap-v3/fetchers';
import catchAsyncRoute from 'api/util/catch-async-route';
import config from 'config';
import validateEthAddress from 'api/util/validate-eth-address';

class BigNumber {
  num: string;
  constructor(val: any) {
    const str = new BigNum(val).toString();
    console.log('str', str);
    this.num = str;
  }

  // Jank, just for testing
  toString() {
    const str = this.num;
    return str === 'NaN' ? '0' : str;
  }
}

export function v3v2Token(token: Token): IToken {
  const decimals: string = <any> new BigNumber(token.decimals).toString();
  const derivedETH: string = <any> new BigNumber(token.derivedETH).toString();
  const id: string = token.id;
  const name: string = token.name;
  const symbol: string = token.symbol;
  const totalLiquidity: string = <any> new BigNumber(token.totalLiquidity).toString();
  const tradeVolumeUSD: string = <any> new BigNumber(token.tradeVolumeUSD).toString();

  return {
    __typename: 'Token',
    decimals,
    derivedETH,
    id,
    name,
    symbol,
    totalLiquidity,
    tradeVolumeUSD,
  }
}

export function poolToPair(pool: Pool): IUniswapPair {
  const createdAtTimestamp: string =  pool.createdAtTimestamp;
  const id: string = pool.id;
  const token0Price: string = <any> new BigNumber(pool.token0Price).toString();
  const token1Price:string = <any> new BigNumber(pool.token1Price).toString();
  const trackedReserveETH:string = <any> new BigNumber(pool.trackedReserveETH).toString();
  const txCount:string = <any> new BigNumber(pool.txCount).toString();
  const volumeUSD:string = <any> new BigNumber(pool.volumeUSD).toString();
  const untrackedVolumeUSD:string = <any> new BigNumber(pool.untrackedVolumeUSD);
  const totalSupply = '0'; // TODO
  const feesUSD:string = <any> new BigNumber(pool.uncollectedFeesUSD + pool.collectedFeesUSD).toString();
  const reserve0: string = <any> new BigNumber(pool.reserve0).toString();
  const reserve1: string = <any> new BigNumber(pool.reserve1).toString();
  const reserveUSD: string = <any> new BigNumber(pool.reserveUSD).toString();

  const token0 = v3v2Token(pool.token0);
  const token1 = v3v2Token(pool.token1)


  return {
    __typename: 'Pair',
    token0,
    token1,
    createdAtTimestamp,
    id,
    token0Price,
    token1Price,
    trackedReserveETH,
    txCount,
    volumeUSD,
    untrackedVolumeUSD,
    totalSupply,
    feesUSD,
    reserve0,
    reserve1,
    reserveUSD,
  }
}

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

async function getTopPools(req: Request<Path, unknown, unknown, GetTopPoolsQuery>): Promise<IUniswapPair[]> {
  const { network } = req.params;
  const fetcher = UniswapV3Fetchers.get(network);

  // TODO: add override for route.get()
  // Request<any, any, any, ParsedQs> query must be a ParsedQs
  // We should add a union type for all validated queries
  // or find a better TS integration with Celebrate
  const { count, sort }: GetTopPoolsQuery = <any> req.query;
  const result: Pool[] = <any> await fetcher.getTopPools(count, sort);
  return result.map(poolToPair);
}

// GET /pools/:id
async function getPoolOverview(req: Request<PoolPath, unknown, unknown, unknown>): Promise<IUniswapPair> {
  const { poolId, network } = req.params;
  const fetcher = UniswapV3Fetchers.get(network);

  const pool: Pool = <any> await fetcher.getPoolOverview(poolId);
  return poolToPair(pool);
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
route.get('/:network/ethPrice', networkValidator, catchAsyncRoute(getEthPrice));
route.get('/:network/pools', getTopPoolsValidator, catchAsyncRoute(getTopPools));
route.get('/:network/pools/:poolId', poolIdValidator, catchAsyncRoute(getPoolOverview));
route.get('/:network/pools/:poolId/historical/daily', getHistoricalDataValidator, catchAsyncRoute(getHistoricalDailyData));
route.get('/:network/pools/:poolId/historical/hourly', getHistoricalDataValidator, catchAsyncRoute(getHistoricalHourlyData));

export default route;