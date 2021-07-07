import { BigNumber } from 'bignumber.js';
import { ArrayElement } from './index';

// Return values for API Endpoints
import {
    GetPoolOverviewQuery,
    GetPoolsOverviewQuery,
    GetPoolDailyDataQuery,
    GetPoolHourlyDataQuery,
    GetTopPoolsQuery,
    GetPositionsQuery,
    GetPositionSnapshotsQuery,
} from './uniswap-v3';

export type GetEthPriceResult = { ethPrice: BigNumber };

export type GetPoolOverviewResult = GetPoolOverviewQuery['pool'];
export type PoolOverview = GetPoolOverviewResult; // alias for result of PoolOverview

export type GetPoolsOverviewResult = GetPoolsOverviewQuery['pools'];

export type GetPoolDailyDataResult = GetPoolDailyDataQuery['poolDayDatas'];
export type GetPoolHourlyDataResult = GetPoolHourlyDataQuery['poolHourDatas'];

export type GetTopPoolsResult = GetTopPoolsQuery['pools'];
export type TopPool = ArrayElement<GetTopPoolsResult>;

export type PoolLike = TopPool | PoolOverview;

export type GetPositionsResult = GetPositionsQuery['positions'];
export type GetPositionSnapshotsResult = GetPositionSnapshotsQuery['positionSnapshots'];

export interface V3PositionStats {
    gasUsed: BigNumber;
    gasPrice: BigNumber;
    token0Amount: BigNumber;
    token1Amount: BigNumber;
    usdAmount: BigNumber;
    entryToken0Amount: BigNumber;
    entryToken1Amount: BigNumber;
    entryUsdAmount: BigNumber;
    collectedFees0: BigNumber;
    collectedFees1: BigNumber;
    collectedFeesUSD: BigNumber;
    uncollectedFees0: BigNumber;
    uncollectedFees1: BigNumber;
    uncollectedFeesUSD: BigNumber;
    totalFeesUSD: BigNumber;
    txFees: BigNumber;
    txFeesUSD: BigNumber;
    impermanentLoss: BigNumber;
    impermanentLossPct: BigNumber;
    totalReturn: BigNumber;
    pctReturn: BigNumber;
    apy: BigNumber;
}
export interface V3PositionData {
    position: GetPositionsResult[0];
    snapshots: GetPositionSnapshotsResult;
    stats: V3PositionStats;
}
