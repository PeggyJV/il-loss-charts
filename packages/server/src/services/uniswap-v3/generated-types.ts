import { BigNumber } from 'bignumber.js';
import { DocumentNode } from 'graphql';
import gql from 'graphql-tag';
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export interface Scalars {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  BigDecimal: BigNumber;
  BigInt: BigNumber;
  Bytes: string;
}



export interface Bundle {
  __typename?: 'Bundle';
  id: Scalars['ID'];
  ethPrice: Scalars['BigDecimal'];
}

export interface Burn {
  __typename?: 'Burn';
  id: Scalars['ID'];
  transaction: Transaction;
  timestamp: Scalars['BigInt'];
  pool: Pool;
  liquidity: Scalars['BigDecimal'];
  sender?: Maybe<Scalars['Bytes']>;
  amount0: Scalars['BigDecimal'];
  amount1: Scalars['BigDecimal'];
  tickLower: Scalars['BigInt'];
  tickUpper: Scalars['BigInt'];
  to?: Maybe<Scalars['Bytes']>;
  logIndex?: Maybe<Scalars['BigInt']>;
  amountUSD?: Maybe<Scalars['BigDecimal']>;
  needsComplete: Scalars['Boolean'];
  feeTo?: Maybe<Scalars['Bytes']>;
  feeLiquidity?: Maybe<Scalars['BigDecimal']>;
}


export interface Collect {
  __typename?: 'Collect';
  id: Scalars['ID'];
  transaction: Transaction;
  timestamp: Scalars['BigInt'];
  pool: Pool;
  sender?: Maybe<Scalars['Bytes']>;
  amount0: Scalars['BigDecimal'];
  amount1: Scalars['BigDecimal'];
  tickLower: Scalars['BigInt'];
  tickUpper: Scalars['BigInt'];
  to?: Maybe<Scalars['Bytes']>;
  logIndex?: Maybe<Scalars['BigInt']>;
  amountUSD?: Maybe<Scalars['BigDecimal']>;
}

export interface Factory {
  __typename?: 'Factory';
  id: Scalars['ID'];
  poolCount: Scalars['BigInt'];
  totalVolumeUSD: Scalars['BigDecimal'];
  totalVolumeETH: Scalars['BigDecimal'];
  untrackedVolumeUSD: Scalars['BigDecimal'];
  combinedVolumeUSD: Scalars['BigDecimal'];
  totalLiquidityUSD: Scalars['BigDecimal'];
  totalLiquidityETH: Scalars['BigDecimal'];
  txCount: Scalars['BigInt'];
}

export interface Mint {
  __typename?: 'Mint';
  id: Scalars['ID'];
  transaction: Transaction;
  timestamp: Scalars['BigInt'];
  pool: Pool;
  to: Scalars['Bytes'];
  liquidity: Scalars['BigDecimal'];
  sender?: Maybe<Scalars['Bytes']>;
  amount0: Scalars['BigDecimal'];
  amount1: Scalars['BigDecimal'];
  tickLower: Scalars['BigInt'];
  tickUpper: Scalars['BigInt'];
  logIndex?: Maybe<Scalars['BigInt']>;
  amountUSD?: Maybe<Scalars['BigDecimal']>;
  feeTo?: Maybe<Scalars['Bytes']>;
  feeLiquidity?: Maybe<Scalars['BigDecimal']>;
}

export interface Pool {
  __typename?: 'Pool';
  id: Scalars['ID'];
  token0: Token;
  token1: Token;
  feeTier: Scalars['BigInt'];
  tickSpacing: Scalars['BigInt'];
  liquidity: Scalars['BigDecimal'];
  sqrtPrice: Scalars['BigDecimal'];
  reserve0: Scalars['BigDecimal'];
  reserve1: Scalars['BigDecimal'];
  reserveETH: Scalars['BigDecimal'];
  reserveUSD: Scalars['BigDecimal'];
  trackedReserveETH: Scalars['BigDecimal'];
  token0Price: Scalars['BigDecimal'];
  token1Price: Scalars['BigDecimal'];
  volumeToken0: Scalars['BigDecimal'];
  volumeToken1: Scalars['BigDecimal'];
  volumeUSD: Scalars['BigDecimal'];
  untrackedVolumeUSD: Scalars['BigDecimal'];
  combinedVolumeUSD: Scalars['BigDecimal'];
  txCount: Scalars['BigInt'];
  uncollectedFeesToken0: Scalars['BigDecimal'];
  uncollectedFeesToken1: Scalars['BigDecimal'];
  uncollectedFeesUSD: Scalars['BigDecimal'];
  collectedFeesToken0: Scalars['BigDecimal'];
  collectedFeesToken1: Scalars['BigDecimal'];
  collectedFeesUSD: Scalars['BigDecimal'];
  createdAtTimestamp: Scalars['BigInt'];
  createdAtBlockNumber: Scalars['BigInt'];
  liquidityProviderCount: Scalars['BigInt'];
  poolHourData: Array<PoolHourData>;
  poolDayData: Array<PoolDayData>;
  mints: Array<Mint>;
  burns: Array<Burn>;
  swaps: Array<Swap>;
  collects: Array<Collect>;
  ticks: Array<Tick>;
}

export interface PoolDayData {
  __typename?: 'PoolDayData';
  id: Scalars['ID'];
  date: Scalars['Int'];
  pool: Pool;
  token0: Token;
  token1: Token;
  liquidity: Scalars['BigDecimal'];
  sqrtPrice: Scalars['BigDecimal'];
  reserve0: Scalars['BigDecimal'];
  reserve1: Scalars['BigDecimal'];
  reserveUSD: Scalars['BigDecimal'];
  periodVolumeToken0: Scalars['BigDecimal'];
  periodVolumeToken1: Scalars['BigDecimal'];
  periodVolumeUSD: Scalars['BigDecimal'];
  periodTxCount: Scalars['BigInt'];
}

export interface PoolDayDatasWhere {
  id?: Maybe<Scalars['ID']>;
  date_gt?: Maybe<Scalars['Int']>;
  date_lt?: Maybe<Scalars['Int']>;
}

export interface PoolHourData {
  __typename?: 'PoolHourData';
  id: Scalars['ID'];
  periodStartUnix: Scalars['Int'];
  pool: Pool;
  token0: Token;
  token1: Token;
  liquidity: Scalars['BigDecimal'];
  sqrtPrice: Scalars['BigDecimal'];
  reserve0: Scalars['BigDecimal'];
  reserve1: Scalars['BigDecimal'];
  reserveUSD: Scalars['BigDecimal'];
  periodVolumeToken0: Scalars['BigDecimal'];
  periodVolumeToken1: Scalars['BigDecimal'];
  periodVolumeUSD: Scalars['BigDecimal'];
  periodTxCount: Scalars['BigInt'];
}

export interface PoolHourDatasWhere {
  id?: Maybe<Scalars['ID']>;
  periodStartUnix_gt?: Maybe<Scalars['Int']>;
  periodStartUnix_lt?: Maybe<Scalars['Int']>;
}

export interface PoolWhere {
  volumeUSD_lt?: Maybe<Scalars['BigDecimal']>;
  reserveUSD_gt?: Maybe<Scalars['BigDecimal']>;
}

export interface Query {
  __typename?: 'Query';
  bundle?: Maybe<Bundle>;
  pool?: Maybe<Pool>;
  pools: Array<Pool>;
  poolDayData?: Maybe<PoolDayData>;
  poolDayDatas: Array<PoolDayData>;
  poolHourData?: Maybe<PoolDayData>;
  poolHourDatas: Array<PoolHourData>;
  token?: Maybe<Token>;
}


export interface QueryBundleArgs {
  id: Scalars['ID'];
  block?: Maybe<Scalars['Int']>;
}


export interface QueryPoolArgs {
  id: Scalars['ID'];
  block?: Maybe<Scalars['Int']>;
}


export interface QueryPoolsArgs {
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Scalars['String']>;
  orderDirection?: Maybe<Scalars['String']>;
  where?: Maybe<PoolWhere>;
}


export interface QueryPoolDayDataArgs {
  id: Scalars['ID'];
}


export interface QueryPoolDayDatasArgs {
  orderBy?: Maybe<Scalars['String']>;
  orderDirection?: Maybe<Scalars['String']>;
  where?: Maybe<PoolDayDatasWhere>;
}


export interface QueryPoolHourDataArgs {
  id: Scalars['ID'];
}


export interface QueryPoolHourDatasArgs {
  orderBy?: Maybe<Scalars['String']>;
  orderDirection?: Maybe<Scalars['String']>;
  where?: Maybe<PoolHourDatasWhere>;
}


export interface QueryTokenArgs {
  id: Scalars['ID'];
}

export interface Swap {
  __typename?: 'Swap';
  id: Scalars['ID'];
  transaction: Transaction;
  timestamp: Scalars['BigInt'];
  pool: Pool;
  sender: Scalars['Bytes'];
  from: Scalars['Bytes'];
  amount0In: Scalars['BigDecimal'];
  amount1In: Scalars['BigDecimal'];
  amount0Out: Scalars['BigDecimal'];
  amount1Out: Scalars['BigDecimal'];
  sqrtPriceX96: Scalars['BigDecimal'];
  tick: Tick;
  to: Scalars['Bytes'];
  logIndex?: Maybe<Scalars['BigInt']>;
  amountUSD: Scalars['BigDecimal'];
}

export interface Tick {
  __typename?: 'Tick';
  id: Scalars['ID'];
  pool: Pool;
  sqrtPriceLower: Scalars['BigDecimal'];
  sqrtPriceUpper: Scalars['BigDecimal'];
  isActive: Scalars['Boolean'];
  reserve0: Scalars['BigDecimal'];
  reserve1: Scalars['BigDecimal'];
  reserveETH: Scalars['BigDecimal'];
  reserveUSD: Scalars['BigDecimal'];
  trackedReserveETH: Scalars['BigDecimal'];
  volumeToken0: Scalars['BigDecimal'];
  volumeToken1: Scalars['BigDecimal'];
  volumeUSD: Scalars['BigDecimal'];
  untrackedVolumeUSD: Scalars['BigDecimal'];
  txCount: Scalars['BigInt'];
  uncollectedFeesToken0: Scalars['BigDecimal'];
  uncollectedFeesToken1: Scalars['BigDecimal'];
  uncollectedFeesUSD: Scalars['BigDecimal'];
  collectedFeesToken0: Scalars['BigDecimal'];
  collectedFeesToken1: Scalars['BigDecimal'];
  collectedFeesUSD: Scalars['BigDecimal'];
  createdAtTimestamp: Scalars['BigInt'];
  createdAtBlockNumber: Scalars['BigInt'];
  liquidityProviderCount: Scalars['BigInt'];
  swaps: Array<Swap>;
}

export interface TickDayData {
  __typename?: 'TickDayData';
  id: Scalars['ID'];
  date: Scalars['Int'];
  pool: Pool;
  tick: Tick;
  token0: Token;
  token1: Token;
  liquidity: Scalars['BigDecimal'];
  sqrtPrice: Scalars['BigDecimal'];
  reserve0: Scalars['BigDecimal'];
  reserve1: Scalars['BigDecimal'];
  reserveUSD: Scalars['BigDecimal'];
  periodVolumeToken0: Scalars['BigDecimal'];
  periodVolumeToken1: Scalars['BigDecimal'];
  periodVolumeUSD: Scalars['BigDecimal'];
  periodTxCount: Scalars['BigInt'];
}

export interface TickHourData {
  __typename?: 'TickHourData';
  id: Scalars['ID'];
  periodStartUnix: Scalars['Int'];
  pool: Pool;
  tick: Tick;
  token0: Token;
  token1: Token;
  liquidity: Scalars['BigDecimal'];
  sqrtPrice: Scalars['BigDecimal'];
  reserve0: Scalars['BigDecimal'];
  reserve1: Scalars['BigDecimal'];
  reserveUSD: Scalars['BigDecimal'];
  periodVolumeToken0: Scalars['BigDecimal'];
  periodVolumeToken1: Scalars['BigDecimal'];
  periodVolumeUSD: Scalars['BigDecimal'];
  periodTxCount: Scalars['BigInt'];
}

export interface Token {
  __typename?: 'Token';
  id: Scalars['ID'];
  symbol: Scalars['String'];
  name: Scalars['String'];
  decimals: Scalars['BigInt'];
  totalSupply: Scalars['BigInt'];
  tradeVolume: Scalars['BigDecimal'];
  tradeVolumeUSD: Scalars['BigDecimal'];
  untrackedVolumeUSD: Scalars['BigDecimal'];
  combinedVolumeUSD: Scalars['BigDecimal'];
  txCount: Scalars['BigInt'];
  poolCount: Scalars['BigInt'];
  totalLiquidity: Scalars['BigDecimal'];
  derivedETH?: Maybe<Scalars['BigDecimal']>;
  tokenDayData: Array<TokenDayData>;
  poolDayDataBase: Array<PoolDayData>;
  poolDayDataQuote: Array<PoolDayData>;
  poolBase: Array<Pool>;
  poolQuote: Array<Pool>;
}

export interface TokenDayData {
  __typename?: 'TokenDayData';
  id: Scalars['ID'];
  date: Scalars['Int'];
  token: Token;
  periodVolumeToken: Scalars['BigDecimal'];
  periodVolumeETH: Scalars['BigDecimal'];
  periodVolumeUSD: Scalars['BigDecimal'];
  periodTxCount: Scalars['BigInt'];
  totalLiquidityToken: Scalars['BigDecimal'];
  totalLiquidityETH: Scalars['BigDecimal'];
  totalLiquidityUSD: Scalars['BigDecimal'];
  priceUSD: Scalars['BigDecimal'];
}

export interface Transaction {
  __typename?: 'Transaction';
  id: Scalars['ID'];
  blockNumber: Scalars['BigInt'];
  timestamp: Scalars['BigInt'];
  mints: Array<Maybe<Mint>>;
  burns: Array<Maybe<Burn>>;
  swaps: Array<Maybe<Swap>>;
  collects: Array<Maybe<Collect>>;
}

export interface UniswapDayData {
  __typename?: 'UniswapDayData';
  id: Scalars['ID'];
  date: Scalars['Int'];
  dailyVolumeETH: Scalars['BigDecimal'];
  dailyVolumeUSD: Scalars['BigDecimal'];
  dailyVolumeUntracked: Scalars['BigDecimal'];
  totalVolumeETH: Scalars['BigDecimal'];
  totalLiquidityETH: Scalars['BigDecimal'];
  totalVolumeUSD: Scalars['BigDecimal'];
  totalLiquidityUSD: Scalars['BigDecimal'];
  txCount: Scalars['BigInt'];
}

export type GetEthPriceQueryVariables = Exact<{
  id: Scalars['ID'];
  blockNumber?: Maybe<Scalars['Int']>;
}>;


export type GetEthPriceQuery = (
  { __typename?: 'Query' }
  & { bundle?: Maybe<(
    { __typename?: 'Bundle' }
    & Pick<Bundle, 'ethPrice'>
  )> }
);

export type GetPoolDailyDataQueryVariables = Exact<{
  id: Scalars['ID'];
  orderBy: Scalars['String'];
  orderDirection: Scalars['String'];
  startDate: Scalars['Int'];
  endDate: Scalars['Int'];
}>;


export type GetPoolDailyDataQuery = (
  { __typename?: 'Query' }
  & { poolDayDatas: Array<(
    { __typename?: 'PoolDayData' }
    & Pick<PoolDayData, 'date' | 'id' | 'periodVolumeToken0' | 'periodVolumeToken1' | 'periodVolumeUSD' | 'reserveUSD' | 'reserve0' | 'reserve1'>
  )> }
);

export type GetPoolHourlyDataQueryVariables = Exact<{
  id: Scalars['ID'];
  orderBy: Scalars['String'];
  orderDirection: Scalars['String'];
  startTime: Scalars['Int'];
  endTime: Scalars['Int'];
}>;


export type GetPoolHourlyDataQuery = (
  { __typename?: 'Query' }
  & { poolHourDatas: Array<(
    { __typename?: 'PoolHourData' }
    & Pick<PoolHourData, 'periodStartUnix' | 'periodVolumeToken0' | 'periodVolumeToken1' | 'periodVolumeUSD' | 'reserveUSD' | 'reserve0' | 'reserve1'>
    & { pool: (
      { __typename?: 'Pool' }
      & Pick<Pool, 'id'>
    ) }
  )> }
);

export type GetPoolOverviewQueryVariables = Exact<{
  id: Scalars['ID'];
  blockNumber?: Maybe<Scalars['Int']>;
}>;


export type GetPoolOverviewQuery = (
  { __typename?: 'Query' }
  & { pool?: Maybe<(
    { __typename?: 'Pool' }
    & Pick<Pool, 'id' | 'reserve0' | 'reserve1' | 'reserveUSD' | 'trackedReserveETH' | 'token0Price' | 'token1Price' | 'volumeUSD' | 'untrackedVolumeUSD' | 'txCount' | 'feeTier' | 'createdAtTimestamp'>
    & { token0: (
      { __typename?: 'Token' }
      & Pick<Token, 'id' | 'name' | 'symbol' | 'decimals' | 'derivedETH' | 'tradeVolumeUSD' | 'totalLiquidity'>
    ), token1: (
      { __typename?: 'Token' }
      & Pick<Token, 'id' | 'symbol' | 'name' | 'decimals' | 'derivedETH' | 'tradeVolumeUSD' | 'totalLiquidity'>
    ) }
  )> }
);

export type GetPoolsOverviewQueryVariables = Exact<{
  first: Scalars['Int'];
  orderBy: Scalars['String'];
  orderDirection: Scalars['String'];
}>;


export type GetPoolsOverviewQuery = (
  { __typename?: 'Query' }
  & { pools: Array<(
    { __typename?: 'Pool' }
    & Pick<Pool, 'id' | 'volumeUSD' | 'reserveUSD'>
    & { token0: (
      { __typename?: 'Token' }
      & Pick<Token, 'id' | 'name' | 'symbol' | 'decimals'>
    ), token1: (
      { __typename?: 'Token' }
      & Pick<Token, 'id' | 'name' | 'symbol' | 'decimals'>
    ) }
  )> }
);

export type GetTopPoolsQueryVariables = Exact<{
  first: Scalars['Int'];
  orderDirection: Scalars['String'];
  orderBy: Scalars['String'];
}>;


export type GetTopPoolsQuery = (
  { __typename?: 'Query' }
  & { pools: Array<(
    { __typename?: 'Pool' }
    & Pick<Pool, 'id' | 'volumeUSD' | 'reserveUSD'>
    & { token0: (
      { __typename?: 'Token' }
      & Pick<Token, 'id' | 'name' | 'symbol' | 'decimals'>
    ), token1: (
      { __typename?: 'Token' }
      & Pick<Token, 'id' | 'name' | 'symbol' | 'decimals'>
    ) }
  )> }
);


export const GetEthPriceDocument = gql`
    query getEthPrice($id: ID!, $blockNumber: Int) {
  bundle(id: $id, block: $blockNumber) {
    ethPrice
  }
}
    `;
export const GetPoolDailyDataDocument = gql`
    query getPoolDailyData($id: ID!, $orderBy: String!, $orderDirection: String!, $startDate: Int!, $endDate: Int!) {
  poolDayDatas(
    orderBy: $orderBy
    orderDirection: $orderDirection
    where: {id: $id, date_gt: $startDate, date_lt: $endDate}
  ) {
    date
    id
    periodVolumeToken0
    periodVolumeToken1
    periodVolumeUSD
    reserveUSD
    reserve0
    reserve1
  }
}
    `;
export const GetPoolHourlyDataDocument = gql`
    query getPoolHourlyData($id: ID!, $orderBy: String!, $orderDirection: String!, $startTime: Int!, $endTime: Int!) {
  poolHourDatas(
    orderBy: $orderBy
    orderDirection: $orderDirection
    where: {id: $id, periodStartUnix_gt: $startTime, periodStartUnix_lt: $endTime}
  ) {
    pool {
      id
    }
    periodStartUnix
    periodVolumeToken0
    periodVolumeToken1
    periodVolumeUSD
    reserveUSD
    reserve0
    reserve1
  }
}
    `;
export const GetPoolOverviewDocument = gql`
    query getPoolOverview($id: ID!, $blockNumber: Int) {
  pool(id: $id, block: $blockNumber) {
    id
    token0 {
      id
      name
      symbol
      decimals
      derivedETH
      tradeVolumeUSD
      totalLiquidity
    }
    token1 {
      id
      symbol
      name
      decimals
      derivedETH
      tradeVolumeUSD
      totalLiquidity
    }
    reserve0
    reserve1
    reserveUSD
    trackedReserveETH
    token0Price
    token1Price
    volumeUSD
    untrackedVolumeUSD
    txCount
    feeTier
    createdAtTimestamp
  }
}
    `;
export const GetPoolsOverviewDocument = gql`
    query getPoolsOverview($first: Int!, $orderBy: String!, $orderDirection: String!) {
  pools(first: $first, orderBy: $orderBy, orderDirection: $orderDirection) {
    id
    volumeUSD
    reserveUSD
    token0 {
      id
      name
      symbol
      decimals
    }
    token1 {
      id
      name
      symbol
      decimals
    }
  }
}
    `;
export const GetTopPoolsDocument = gql`
    query getTopPools($first: Int!, $orderDirection: String!, $orderBy: String!) {
  pools(
    first: $first
    orderDirection: $orderDirection
    orderBy: $orderBy
    where: {volumeUSD_lt: 100000000, reserveUSD_gt: 500000}
  ) {
    id
    volumeUSD
    reserveUSD
    token0 {
      id
      name
      symbol
      decimals
    }
    token1 {
      id
      name
      symbol
      decimals
    }
  }
}
    `;
export type Requester<C= {}> = <R, V>(doc: DocumentNode, vars?: V, options?: C) => Promise<R>
export function getSdk<C>(requester: Requester<C>) {
  return {
    getEthPrice(variables: GetEthPriceQueryVariables, options?: C): Promise<GetEthPriceQuery> {
      return requester<GetEthPriceQuery, GetEthPriceQueryVariables>(GetEthPriceDocument, variables, options);
    },
    getPoolDailyData(variables: GetPoolDailyDataQueryVariables, options?: C): Promise<GetPoolDailyDataQuery> {
      return requester<GetPoolDailyDataQuery, GetPoolDailyDataQueryVariables>(GetPoolDailyDataDocument, variables, options);
    },
    getPoolHourlyData(variables: GetPoolHourlyDataQueryVariables, options?: C): Promise<GetPoolHourlyDataQuery> {
      return requester<GetPoolHourlyDataQuery, GetPoolHourlyDataQueryVariables>(GetPoolHourlyDataDocument, variables, options);
    },
    getPoolOverview(variables: GetPoolOverviewQueryVariables, options?: C): Promise<GetPoolOverviewQuery> {
      return requester<GetPoolOverviewQuery, GetPoolOverviewQueryVariables>(GetPoolOverviewDocument, variables, options);
    },
    getPoolsOverview(variables: GetPoolsOverviewQueryVariables, options?: C): Promise<GetPoolsOverviewQuery> {
      return requester<GetPoolsOverviewQuery, GetPoolsOverviewQueryVariables>(GetPoolsOverviewDocument, variables, options);
    },
    getTopPools(variables: GetTopPoolsQueryVariables, options?: C): Promise<GetTopPoolsQuery> {
      return requester<GetTopPoolsQuery, GetTopPoolsQueryVariables>(GetTopPoolsDocument, variables, options);
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;