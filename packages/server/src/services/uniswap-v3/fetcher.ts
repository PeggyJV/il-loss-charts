import {
  GetPoolOverviewQuery,
  GetPoolOverviewQueryVariables,
  GetPoolsOverviewQuery,
  Pool
} from 'services/uniswap-v3/generated-types';
import { HTTPError } from 'api/util/errors';
import { wrapWithCache } from 'util/redis-data-cache';
import BigNumber from 'bignumber.js';
import getSdkApollo, { Sdk } from 'services/uniswap-v3/apollo-client';
import redis from 'util/redis';

const FEE_TIER_DENOMINATOR = 1000000;

// should this be loaded from config?
const UNTRACKED_POOLS: Array<string> = [];

// The reverse of the Maybe type defined by graphql codegen
type UnMaybe<T> = Exclude<T, undefined>;

// { ...pool, volumeUSD: string, feesUSD: string }
type GetPoolOverviewResult = Omit<UnMaybe<GetPoolOverviewQuery['pool']>, 'volumeUSD'> & { volumeUSD: string, feesUSD: string };
type GetTopPoolsResult = UnMaybe<GetPoolsOverviewQuery['pools']>;

class UniswapV3Fetcher {
  sdk: Sdk;

  constructor(sdk: Sdk) {
    this.sdk = sdk;
  }

  // @kkennis should we rename this to getPoolOverview or must we be 100% 1:1 with the v2 fetcher?
  async getPoolOverview(
    poolId: string,
    blockNumber?: number
  ): Promise<IUniswapPair> {
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
      const responseError = error?.toString() ?? '';
      const message = `Could not find pool with ID ${poolId}. ${responseError}`;

      // TODO: Clients should throw coded errors, let the route handler deal with HTTP status codes
      throw new HTTPError(400, message);
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

  // This fn should be renamed to getPoolsOverview
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
      const responseError = error?.toString() ?? '';
      const message = `Could not fetch top pools. ${responseError}`;

      throw new HTTPError(400, message);
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
      const responseError = error?.toString() ?? '';
      const message = `Could not fetch top performing pools. ${responseError}`;

      throw new HTTPError(400, message);
    }
  }
}