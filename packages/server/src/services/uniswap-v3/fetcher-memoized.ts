import { Pool } from 'services/uniswap-v3/generated-types';
import {
  GetPoolDailyDataResult,
  GetPoolHourlyDataResult,
  GetPoolOverviewResult,
  GetTopPoolsResult,
  UniswapFetcher,
  UniswapV3Fetcher
} from 'services/uniswap-v3/fetcher';
import memoizer from 'util/memoizer-redis';
import redis from 'util/redis';

type Keys = keyof UniswapV3Fetcher;
type MemoizedFunction<T> = (...args: Array<any>) => T;

export class UniswapV3FetcherMemoized implements UniswapFetcher {
  private memoize: ReturnType<typeof memoizer>;
  private fetcher: UniswapV3Fetcher;
  private memoized: Map<Keys, MemoizedFunction<UniswapV3Fetcher[Keys]>>;

  constructor(fetcher: UniswapV3Fetcher, network: string) {
    this.memoize = memoizer(redis, { keyPrefix: network });
    this.fetcher = fetcher;
    this.memoized = new Map();
  }

  getEthPrice(blockNumber?: number): Promise<{ ethPrice: number }> {
    const fn = this.memoize(this.fetcher.getEthPrice.bind(this.fetcher));
    return fn();
  }

  getPoolOverview(poolId: string, blockNumber?: number): Promise<GetPoolOverviewResult> {
    const fn = this.memoize(this.fetcher.getPoolOverview.bind(this.fetcher));
    return fn();
  }
  getTopPools(count: number, orderBy: keyof Pool): Promise<GetTopPoolsResult> {
    const fn = this.memoize(this.fetcher.getTopPools.bind(this.fetcher));
    return fn();
  }
  getPoolDailyData(poolId: string, start: Date, end: Date): Promise<GetPoolDailyDataResult> {
    const fn = this.memoize(this.fetcher.getPoolDailyData.bind(this.fetcher));
    return fn();
  }
  getPoolHourlyData(poolId: string, start: Date, end: Date): Promise<GetPoolHourlyDataResult> {
    const fn = this.memoize(this.fetcher.getPoolHourlyData.bind(this.fetcher));
    return fn();
  }
}