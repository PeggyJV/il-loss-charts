export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  BigDecimal: any;
  BigInt: any;
  Bytes: any;
};



export type Bundle = {
  __typename?: 'Bundle';
  id: Scalars['ID'];
  ethPrice: Scalars['BigDecimal'];
};

export type Burn = {
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
};


export type Collect = {
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
};

export type Factory = {
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
};

export type Mint = {
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
};

export type Pool = {
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
};

export type PoolDayData = {
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
};

export type PoolDayDatasWhere = {
  id?: Maybe<Scalars['ID']>;
  date_gt?: Maybe<Scalars['Int']>;
  date_lt?: Maybe<Scalars['Int']>;
};

export type PoolHourData = {
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
};

export type PoolHourDatasWhere = {
  id?: Maybe<Scalars['ID']>;
  periodStartUnix_gt?: Maybe<Scalars['Int']>;
  periodStartUnix_lt?: Maybe<Scalars['Int']>;
};

export type PoolWhere = {
  volumeUSD_lt?: Maybe<Scalars['BigDecimal']>;
  reserveUSD_gt?: Maybe<Scalars['BigDecimal']>;
};

export type Query = {
  __typename?: 'Query';
  token?: Maybe<Token>;
  pool?: Maybe<Pool>;
  pools?: Maybe<Array<Maybe<Pool>>>;
  poolDayData?: Maybe<PoolDayData>;
  poolDayDatas?: Maybe<Array<Maybe<PoolDayData>>>;
  poolHourData?: Maybe<PoolDayData>;
  poolHourDatas?: Maybe<Array<Maybe<PoolHourData>>>;
};


export type QueryTokenArgs = {
  id: Scalars['ID'];
};


export type QueryPoolArgs = {
  id: Scalars['ID'];
  blockNumber?: Maybe<Scalars['Int']>;
};


export type QueryPoolsArgs = {
  first?: Maybe<Scalars['Int']>;
  orderBy?: Maybe<Scalars['String']>;
  orderDirection?: Maybe<Scalars['String']>;
  where?: Maybe<PoolWhere>;
};


export type QueryPoolDayDataArgs = {
  id: Scalars['ID'];
};


export type QueryPoolDayDatasArgs = {
  orderBy?: Maybe<Scalars['String']>;
  orderDirection?: Maybe<Scalars['String']>;
  where?: Maybe<PoolDayDatasWhere>;
};


export type QueryPoolHourDataArgs = {
  id: Scalars['ID'];
};


export type QueryPoolHourDatasArgs = {
  orderBy?: Maybe<Scalars['String']>;
  orderDirection?: Maybe<Scalars['String']>;
  where?: Maybe<PoolHourDatasWhere>;
};

export type Swap = {
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
};

export type Tick = {
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
};

export type TickDayData = {
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
};

export type TickHourData = {
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
};

export type Token = {
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
};

export type TokenDayData = {
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
};

export type Transaction = {
  __typename?: 'Transaction';
  id: Scalars['ID'];
  blockNumber: Scalars['BigInt'];
  timestamp: Scalars['BigInt'];
  mints: Array<Maybe<Mint>>;
  burns: Array<Maybe<Burn>>;
  swaps: Array<Maybe<Swap>>;
  collects: Array<Maybe<Collect>>;
};

export type UniswapDayData = {
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
};
