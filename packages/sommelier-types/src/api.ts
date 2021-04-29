import { BigNumber } from 'bignumber.js';

// Return values for API Endpoints
import {
  GetPoolOverviewQuery,
  GetPoolsOverviewQuery,
  GetPoolDailyDataQuery,
  GetPoolHourlyDataQuery,
  GetTopPoolsQuery,
} from './uniswap-v3';

export type GetEthPriceResult = { ethPrice: BigNumber };
export type GetPoolOverviewResult = GetPoolOverviewQuery['pool'];
export type GetPoolsOverviewResult = GetPoolsOverviewQuery['pools'];
export type GetPoolDailyDataResult = GetPoolDailyDataQuery['poolDayDatas'];
export type GetPoolHourlyDataResult = GetPoolHourlyDataQuery['poolHourDatas'];
export type GetTopPoolsResult = GetTopPoolsQuery['pools'];