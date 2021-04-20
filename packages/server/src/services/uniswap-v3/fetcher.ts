import {
  GetEthPriceQueryVariables,
  GetPoolDailyDataQuery,
  GetPoolHourlyDataQuery,
  GetPoolOverviewQuery,
  GetPoolOverviewQueryVariables,
  GetPoolsOverviewQuery,
  Pool
} from 'services/uniswap-v3/generated-types';
import { HTTPError } from 'api/util/errors';
import { toDateInt } from 'util/gql'
import { wrapWithCache } from 'util/redis-data-cache';
import BigNumber from 'bignumber.js';
import getSdkApollo, { Sdk } from 'services/uniswap-v3/apollo-client';
import redis from 'util/redis';

const FEE_TIER_DENOMINATOR = 1000000;
const DAY_MS = 1000 * 60 * 60 * 24;

// should this be loaded from config?
const UNTRACKED_POOLS: Array<string> = [];

// The reverse of the Maybe type defined by graphql codegen
type UnMaybe<T> = Exclude<T, null | undefined>;

// Fn return types derived from generated types
// Type = { ...pool, volumeUSD: string, feesUSD: string }
type GetPoolOverviewResult = UnMaybe<GetPoolOverviewQuery['pool']>;
type GetTopPoolsResult = UnMaybe<GetPoolsOverviewQuery['pools']>;
type GetPoolDataDailyResult = UnMaybe<GetPoolDailyDataQuery['poolDayDatas']>;
type GetPoolDataHourlyResult = UnMaybe<GetPoolHourlyDataQuery['poolHourDatas']>;

class UniswapV3Fetcher {
  sdk: Sdk;

  constructor(sdk: Sdk) {
    this.sdk = sdk;
  }

  async getEthPrice(
    blockNumber?: number
  ): Promise<{ ethPrice: number }> { // Todo
    let options: GetEthPriceQueryVariables = { id: '1' };
    if (typeof blockNumber === 'number') {
      options = {
        ...options,
        blockNumber,
      }
    }

    try {
      const { bundle } = await this.sdk.getEthPrice(options);

      if (bundle?.ethPrice == null) {
        throw new Error('ethPrice not returned.');
      }

      return { ethPrice: bundle.ethPrice };
    } catch (error) {
      throw makeSdkError(`Could not fetch ethPrice.`, error);
    }
  }

  async getPoolOverview(
    poolId: string,
    blockNumber?: number
  ): Promise<GetPoolOverviewResult> {
    let options: GetPoolOverviewQueryVariables = { id: poolId };
    if (typeof blockNumber === 'number') {
      options = {
        ...options,
        blockNumber,
      };
    }

    let data;
    try {
      data  = await this.sdk.getPoolOverview(options)
    } catch (error) {
      // TODO: Clients should throw coded errors, let the route handler deal with HTTP status codes
      throw makeSdkError(`Could not find pool with ID ${poolId}.`, error);
    }

    if (data.pool  == null) {
      throw new HTTPError(404);
    }

    return data.pool;
  }

  async getTopPools(
    count: number = 1000,
    orderBy: keyof Pool,
  ): Promise<GetTopPoolsResult> { // TODO
    try {
      const { pools } = await this.sdk.getPoolsOverview({ first: count, orderDirection: 'desc', orderBy });
      if (pools == null || pools.length === 0) {
        throw new Error('No pools returned.');
      }

      return pools;
    } catch (error) {
      throw makeSdkError(`Could not fetch top pool.`, error);
    }
  }

  async getCurrentTopPerformingPools(count: number = 100) {
    try {
      const { pools } = await this.sdk.getTopPools({
        first: count,
        orderDirection: 'desc',
        orderBy: 'volumeUSD',
      });

      if (pools == null || pools.length === 0) {
        throw new Error('No pools returned.');
      }
    } catch (error) {
      throw makeSdkError(`Could not fetch top performing pools.`, error);
    }
  }

  async getPoolDailyData(
    poolId: string,
    start: Date,
    end: Date,
  ): Promise<GetPoolDataDailyResult> {
    const startDate = toDateInt(start);
    const endDate = toDateInt(end);
    
    try {
      const { poolDayDatas } = await this.sdk.getPoolDailyData({
        id: poolId,
        orderBy: 'date',
        orderDirection: 'asc',
        startDate,
        endDate,
      });

      if (poolDayDatas == null) {
        throw new Error('No pools returned.')
      }

      return poolDayDatas;
    } catch (error) {
      throw makeSdkError(`Could not fetch daily data for pool ${poolId}.`, error);
    }
  }

  async getPoolHourlyData(
    poolId: string,
    start: Date,
    end: Date,
  ): Promise<GetPoolDataHourlyResult> {
    const startTime = toDateInt(start) - 1;
    const endTime = toDateInt(end);

    try {
      const { poolHourDatas } = await this.sdk.getPoolHourlyData({
        id: poolId,
        orderBy: 'periodStartUnix',
        orderDirection: 'asc',
        startTime,
        endTime,
      });

      if (poolHourDatas == null) {
        throw new Error('No pools returned.')
      }

      return poolHourDatas;
    } catch (error) {
      throw makeSdkError(`Could not fetch hourly data for pool ${poolId}.`, error);
    }
  }

  async getHistoricalDailyData(
    poolId: string,
    start: Date,
    end: Date = new Date(),
  ): Promise<any> { //todo
    const startData = await this.getPoolDailyData(poolId, start, end);
    if (startData.length === 0) {
      throw new HTTPError(
        404,
        `Could not fetch any historical data for the given timeframe. Make sure the window is at least 1 day.`
      );
    }

    let dailyData = startData; // accumulator
    let cursorEndDate = dailyData[dailyData.length - 1]?.date; // date of last data in current page
    let lastStartDate = start; // start date from previous page
    const endDateTimestamp = Math.floor(end.getTime() / 1000); // final date we want data for

    // Keep fetching until we pass the end date
    while (
      cursorEndDate &&
      cursorEndDate <= endDateTimestamp &&
      Math.floor(lastStartDate.getTime() / 1000) <= endDateTimestamp
    ) {
      // cache old length to compare later
      const oldLength = dailyData.length;

      // skip ahead 24 hours, cache for next query
      lastStartDate = new Date(cursorEndDate * 1000 + DAY_MS);
      const moreDailyData = await this.getPoolDailyData(poolId, lastStartDate, end);
      dailyData = [...dailyData, ...moreDailyData];
      cursorEndDate = dailyData[dailyData.length - 1]?.date; // set new cursor

      // Nothing more to add
      // @kkennis whats the scenario where there would be no more data to fetch?
      // aka, can we precalculate windows and parallelize?
      if (dailyData.length === oldLength) {
          break;
      }
    }

    return dailyData;
  }

  async getHistoricalHourlyData(
    poolId: string,
    start: Date,
    end: Date,
  ): Promise<any> { // todo
    const startData = await this.getPoolHourlyData(poolId, start, end);
    if (startData.length === 0) {
      throw new HTTPError(
        404,
        `Could not fetch any historical data for the given timeframe. Make sure the window is at least 1 day.`
      );
    }

    let hourlyData = startData; // accumulator
    let cursorEndTime = hourlyData[hourlyData.length - 1]?.periodStartUnix; // time of last hour data in current page
    let lastStartTime = start; // start time from previous page
    const endTimestamp = Math.floor(end.getTime() / 1000);

    while(
      cursorEndTime &&
      cursorEndTime <= endTimestamp &&
      Math.floor(lastStartTime.getTime() / 1000) <= endTimestamp
    ) {
      // cache old length to compare later
      const oldLength = hourlyData.length;

      // skip ahead 24 hours, cache for next query
      lastStartTime =  new Date(cursorEndTime * 1000 + DAY_MS);
      const moreHourlyData = await this.getPoolHourlyData(poolId, lastStartTime, end);
      hourlyData = [...hourlyData, ...moreHourlyData];
      cursorEndTime = hourlyData[hourlyData.length - 1]?.periodStartUnix; // set new cursor

      if (hourlyData.length === oldLength) {
        break;
      }
    }

    return hourlyData;
  }
}

function makeSdkError(message: String, error: Error, code = 400) {
  const sdkError = error?.toString() ?? '';
  return new HTTPError(code, `${message} ${sdkError}`);
}