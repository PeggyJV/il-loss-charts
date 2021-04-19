import {
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

// should this be loaded from config?
const UNTRACKED_POOLS: Array<string> = [];

// The reverse of the Maybe type defined by graphql codegen
type UnMaybe<T> = Exclude<T, undefined>;

// Type = { ...pool, volumeUSD: string, feesUSD: string }
type GetPoolOverviewResult = Omit<UnMaybe<GetPoolOverviewQuery['pool']>, 'volumeUSD'> & { volumeUSD: string, feesUSD: string };
type GetTopPoolsResult = UnMaybe<GetPoolsOverviewQuery['pools']>;

class UniswapV3Fetcher {
  sdk: Sdk;

  constructor(sdk: Sdk) {
    this.sdk = sdk;
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
      throw makeSdkError(`Could not find pool with ID ${poolID}.`, error);
    }

    if (data.pool  == null) {
      throw new HTTPError(404);
    }

    // TODO: type the return value
    // @kkennis, should this return the same shape as the v2 fetcher, IUniswapPair?
    const pool = {
      ...data.pool,
      volumeUSD: new BigNumber(data.pool.volumeUSD).toString(),
      feesUSD: new BigNumber(data.pool.volumeUSD, 10)
      .times(data.pool.feeTier / FEE_TIER_DENOMINATOR)
      .toString()
    };

    return pool;
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
  ): Promise<any> { // TODO
    const startDate = toDateInt(start);
    const endDate = toDateInt(end);
    
    try {
      const { poolDayDatas } = await this.sdk.getPoolDataDaily({
        id: poolId,
        orderBy: 'date',
        orderDirection: 'asc',
        startDate,
        endDate,
      });

      if (poolDayDatas == null) {
        throw new Error('No pools returned.')
      }
    } catch (error) {
      throw makeSdkError(`Could not fetch daily data for pool ${poolId}.`, error);
    }
  }

  async getHourlyData(
    poolId: string,
    start: Date,
    end: Date,
  ): Promise<any> { // TODO
    const startTime = toDateInt(start) - 1;
    const endTime = toDateInt(end);

    try {
      const { poolHourDatas } = await this.sdk.getPoolDataHourly({
        id: poolId,
        orderBy: 'periodStartUnix',
        orderDirection: 'asc',
        startTime,
        endTime,
      });

      if (poolHourDatas == null) {
        throw new Error('No pools returned.')
      }
    } catch (error) {
      throw makeSdkError(`Could not fetch hourly data for pool ${poolId}.`, error);
    }
  }
}

function makeSdkError(message: String, error: Error, code = 400) {
  const sdkError = error?.toString() ?? '';
  return new HTTPError(code, `${message} ${sdkError}`);
}