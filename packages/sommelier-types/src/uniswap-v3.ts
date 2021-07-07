export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = {
    [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> &
    { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> &
    { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export interface Scalars {
    ID: string;
    String: string;
    Boolean: boolean;
    Int: number;
    Float: number;
    BigDecimal: string;
    BigInt: string;
    Bytes: string;
}

export interface Bundle {
    __typename?: 'Bundle';
    id: Scalars['ID'];
    ethPriceUSD: Scalars['BigDecimal'];
}

export interface Burn {
    __typename?: 'Burn';
    id: Scalars['ID'];
    transaction: Transaction;
    pool: Pool;
    token0: Token;
    token1: Token;
    timestamp: Scalars['BigInt'];
    owner?: Maybe<Scalars['Bytes']>;
    origin: Scalars['Bytes'];
    amount: Scalars['BigInt'];
    amount0: Scalars['BigDecimal'];
    amount1: Scalars['BigDecimal'];
    amountUSD?: Maybe<Scalars['BigDecimal']>;
    tickLower: Scalars['BigInt'];
    tickUpper: Scalars['BigInt'];
    logIndex?: Maybe<Scalars['BigInt']>;
}

export interface Collect {
    __typename?: 'Collect';
    id: Scalars['ID'];
    transaction: Transaction;
    timestamp: Scalars['BigInt'];
    pool: Pool;
    owner?: Maybe<Scalars['Bytes']>;
    amount0: Scalars['BigDecimal'];
    amount1: Scalars['BigDecimal'];
    amountUSD?: Maybe<Scalars['BigDecimal']>;
    tickLower: Scalars['BigInt'];
    tickUpper: Scalars['BigInt'];
    logIndex?: Maybe<Scalars['BigInt']>;
}

export interface Factory {
    __typename?: 'Factory';
    id: Scalars['ID'];
    poolCount: Scalars['BigInt'];
    txCount: Scalars['BigInt'];
    totalVolumeUSD: Scalars['BigDecimal'];
    totalVolumeETH: Scalars['BigDecimal'];
    totalFeesUSD: Scalars['BigDecimal'];
    totalFeesETH: Scalars['BigDecimal'];
    untrackedVolumeUSD: Scalars['BigDecimal'];
    totalValueLockedUSD: Scalars['BigDecimal'];
    totalValueLockedETH: Scalars['BigDecimal'];
    totalValueLockedUSDUntracked: Scalars['BigDecimal'];
    totalValueLockedETHUntracked: Scalars['BigDecimal'];
    owner: Scalars['ID'];
}

export interface Flash {
    __typename?: 'Flash';
    id: Scalars['ID'];
    transaction: Transaction;
    timestamp: Scalars['BigInt'];
    pool: Pool;
    sender: Scalars['Bytes'];
    recipient: Scalars['Bytes'];
    amount0: Scalars['BigDecimal'];
    amount1: Scalars['BigDecimal'];
    amountUSD: Scalars['BigDecimal'];
    amount0Paid: Scalars['BigDecimal'];
    amount1Paid: Scalars['BigDecimal'];
    logIndex?: Maybe<Scalars['BigInt']>;
}

export interface Mint {
    __typename?: 'Mint';
    id: Scalars['ID'];
    transaction: Transaction;
    timestamp: Scalars['BigInt'];
    pool: Pool;
    token0: Token;
    token1: Token;
    owner: Scalars['Bytes'];
    sender?: Maybe<Scalars['Bytes']>;
    origin: Scalars['Bytes'];
    amount: Scalars['BigInt'];
    amount0: Scalars['BigDecimal'];
    amount1: Scalars['BigDecimal'];
    amountUSD?: Maybe<Scalars['BigDecimal']>;
    tickLower: Scalars['BigInt'];
    tickUpper: Scalars['BigInt'];
    logIndex?: Maybe<Scalars['BigInt']>;
}

export interface Pool {
    __typename?: 'Pool';
    id: Scalars['ID'];
    createdAtTimestamp: Scalars['BigInt'];
    createdAtBlockNumber: Scalars['BigInt'];
    token0: Token;
    token1: Token;
    feeTier: Scalars['BigInt'];
    liquidity: Scalars['BigInt'];
    sqrtPrice: Scalars['BigInt'];
    feeGrowthGlobal0X128: Scalars['BigInt'];
    feeGrowthGlobal1X128: Scalars['BigInt'];
    token0Price: Scalars['BigDecimal'];
    token1Price: Scalars['BigDecimal'];
    tick?: Maybe<Scalars['BigInt']>;
    observationIndex: Scalars['BigInt'];
    volumeToken0: Scalars['BigDecimal'];
    volumeToken1: Scalars['BigDecimal'];
    volumeUSD: Scalars['BigDecimal'];
    untrackedVolumeUSD: Scalars['BigDecimal'];
    feesUSD: Scalars['BigDecimal'];
    txCount: Scalars['BigInt'];
    collectedFeesToken0: Scalars['BigDecimal'];
    collectedFeesToken1: Scalars['BigDecimal'];
    collectedFeesUSD: Scalars['BigDecimal'];
    totalValueLockedToken0: Scalars['BigDecimal'];
    totalValueLockedToken1: Scalars['BigDecimal'];
    totalValueLockedETH: Scalars['BigDecimal'];
    totalValueLockedUSD: Scalars['BigDecimal'];
    totalValueLockedUSDUntracked: Scalars['BigDecimal'];
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
    liquidity: Scalars['BigInt'];
    sqrtPrice: Scalars['BigInt'];
    token0Price: Scalars['BigDecimal'];
    token1Price: Scalars['BigDecimal'];
    open: Scalars['BigDecimal'];
    high: Scalars['BigDecimal'];
    low: Scalars['BigDecimal'];
    close: Scalars['BigDecimal'];
    tick?: Maybe<Scalars['BigInt']>;
    feeGrowthGlobal0X128: Scalars['BigInt'];
    feeGrowthGlobal1X128: Scalars['BigInt'];
    tvlUSD: Scalars['BigDecimal'];
    volumeToken0: Scalars['BigDecimal'];
    volumeToken1: Scalars['BigDecimal'];
    volumeUSD: Scalars['BigDecimal'];
    feesUSD: Scalars['BigDecimal'];
    txCount: Scalars['BigInt'];
}

export interface PoolDayDatasWhere {
    pool?: Maybe<Scalars['ID']>;
    date_gt?: Maybe<Scalars['Int']>;
    date_lt?: Maybe<Scalars['Int']>;
}

export interface PoolFiveMinuteData {
    __typename?: 'PoolFiveMinuteData';
    id: Scalars['ID'];
    date: Scalars['Int'];
    pool: Pool;
    liquidity: Scalars['BigInt'];
    sqrtPrice: Scalars['BigInt'];
    token0Price: Scalars['BigDecimal'];
    token1Price: Scalars['BigDecimal'];
    open: Scalars['BigDecimal'];
    high: Scalars['BigDecimal'];
    low: Scalars['BigDecimal'];
    close: Scalars['BigDecimal'];
    tick?: Maybe<Scalars['BigInt']>;
    feeGrowthGlobal0X128: Scalars['BigInt'];
    feeGrowthGlobal1X128: Scalars['BigInt'];
    tvlUSD: Scalars['BigDecimal'];
    volumeToken0: Scalars['BigDecimal'];
    volumeToken1: Scalars['BigDecimal'];
    volumeUSD: Scalars['BigDecimal'];
    feesUSD: Scalars['BigDecimal'];
    txCount: Scalars['BigInt'];
}

export interface PoolHourData {
    __typename?: 'PoolHourData';
    id: Scalars['ID'];
    date: Scalars['Int'];
    pool: Pool;
    liquidity: Scalars['BigInt'];
    sqrtPrice: Scalars['BigInt'];
    token0Price: Scalars['BigDecimal'];
    token1Price: Scalars['BigDecimal'];
    open: Scalars['BigDecimal'];
    high: Scalars['BigDecimal'];
    low: Scalars['BigDecimal'];
    close: Scalars['BigDecimal'];
    tick?: Maybe<Scalars['BigInt']>;
    feeGrowthGlobal0X128: Scalars['BigInt'];
    feeGrowthGlobal1X128: Scalars['BigInt'];
    tvlUSD: Scalars['BigDecimal'];
    volumeToken0: Scalars['BigDecimal'];
    volumeToken1: Scalars['BigDecimal'];
    volumeUSD: Scalars['BigDecimal'];
    feesUSD: Scalars['BigDecimal'];
    txCount: Scalars['BigInt'];
}

export interface PoolHourDatasWhere {
    id?: Maybe<Scalars['ID']>;
    date_gt?: Maybe<Scalars['Int']>;
    date_lt?: Maybe<Scalars['Int']>;
}

export interface PoolWhere {
    volumeUSD_lt?: Maybe<Scalars['BigDecimal']>;
    reserveUSD_gt?: Maybe<Scalars['BigDecimal']>;
}

export interface Position {
    __typename?: 'Position';
    id: Scalars['ID'];
    owner: Scalars['Bytes'];
    pool: Pool;
    token0: Token;
    token1: Token;
    tickLower: Tick;
    tickUpper: Tick;
    liquidity: Scalars['BigInt'];
    depositedToken0: Scalars['BigDecimal'];
    depositedToken1: Scalars['BigDecimal'];
    withdrawnToken0: Scalars['BigDecimal'];
    withdrawnToken1: Scalars['BigDecimal'];
    collectedFeesToken0: Scalars['BigDecimal'];
    collectedFeesToken1: Scalars['BigDecimal'];
    transaction: Transaction;
    feeGrowthInside0LastX128: Scalars['BigInt'];
    feeGrowthInside1LastX128: Scalars['BigInt'];
}

export interface PositionSnapshot {
    __typename?: 'PositionSnapshot';
    id: Scalars['ID'];
    position: Position;
    timestamp: Scalars['Int'];
    blockNumber: Scalars['BigInt'];
    owner: Scalars['Bytes'];
    pool: Pool;
    token0Price: Scalars['BigDecimal'];
    token1Price: Scalars['BigDecimal'];
    token0PriceUSD: Scalars['BigDecimal'];
    token1PriceUSD: Scalars['BigDecimal'];
    liquidity: Scalars['BigInt'];
    sqrtPrice: Scalars['BigInt'];
    totalValueLockedETH: Scalars['BigDecimal'];
    totalValueLockedUSD: Scalars['BigDecimal'];
    tick?: Maybe<Scalars['BigInt']>;
    depositedToken0: Scalars['BigDecimal'];
    depositedToken1: Scalars['BigDecimal'];
    withdrawnToken0: Scalars['BigDecimal'];
    withdrawnToken1: Scalars['BigDecimal'];
    collectedFeesToken0: Scalars['BigDecimal'];
    collectedFeesToken1: Scalars['BigDecimal'];
    transaction: Transaction;
    feeGrowthInside0LastX128: Scalars['BigInt'];
    feeGrowthInside1LastX128: Scalars['BigInt'];
}

export interface PositionsWhere {
    owner?: Maybe<Scalars['String']>;
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
    positions: Array<Position>;
    positionSnapshots: Array<PositionSnapshot>;
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

export interface QueryPositionsArgs {
    where?: Maybe<PositionsWhere>;
}

export interface QueryPositionSnapshotsArgs {
    where?: Maybe<PositionsWhere>;
}

export interface Swap {
    __typename?: 'Swap';
    id: Scalars['ID'];
    transaction: Transaction;
    timestamp: Scalars['BigInt'];
    pool: Pool;
    token0: Token;
    token1: Token;
    sender: Scalars['Bytes'];
    recipient: Scalars['Bytes'];
    origin: Scalars['Bytes'];
    amount0: Scalars['BigDecimal'];
    amount1: Scalars['BigDecimal'];
    amountUSD: Scalars['BigDecimal'];
    sqrtPriceX96: Scalars['BigInt'];
    tick: Scalars['BigInt'];
    logIndex?: Maybe<Scalars['BigInt']>;
}

export interface Tick {
    __typename?: 'Tick';
    id: Scalars['ID'];
    poolAddress?: Maybe<Scalars['String']>;
    tickIdx: Scalars['BigInt'];
    pool: Pool;
    liquidityGross: Scalars['BigInt'];
    liquidityNet: Scalars['BigInt'];
    price0: Scalars['BigDecimal'];
    price1: Scalars['BigDecimal'];
    volumeToken0: Scalars['BigDecimal'];
    volumeToken1: Scalars['BigDecimal'];
    volumeUSD: Scalars['BigDecimal'];
    untrackedVolumeUSD: Scalars['BigDecimal'];
    feesToken0: Scalars['BigDecimal'];
    feesToken1: Scalars['BigDecimal'];
    feesUSD: Scalars['BigDecimal'];
    collectedFeesToken0: Scalars['BigDecimal'];
    collectedFeesToken1: Scalars['BigDecimal'];
    collectedFeesUSD: Scalars['BigDecimal'];
    createdAtTimestamp: Scalars['BigInt'];
    createdAtBlockNumber: Scalars['BigInt'];
    liquidityProviderCount: Scalars['BigInt'];
    feeGrowthOutside0X128: Scalars['BigInt'];
    feeGrowthOutside1X128: Scalars['BigInt'];
}

export interface TickDayData {
    __typename?: 'TickDayData';
    id: Scalars['ID'];
    date: Scalars['Int'];
    pool: Pool;
    tick: Tick;
    tickIdx: Scalars['BigInt'];
    liquidityGross: Scalars['BigInt'];
    liquidityNet: Scalars['BigInt'];
    startingVolumeToken0: Scalars['BigDecimal'];
    startingVolumeToken1: Scalars['BigDecimal'];
    startingVolumeUSD: Scalars['BigDecimal'];
    startingFeesUSD: Scalars['BigDecimal'];
    startingFeesToken0: Scalars['BigDecimal'];
    startingFeesToken1: Scalars['BigDecimal'];
    volumeToken0: Scalars['BigDecimal'];
    volumeToken1: Scalars['BigDecimal'];
    volumeUSD: Scalars['BigDecimal'];
    feesToken0: Scalars['BigDecimal'];
    feesToken1: Scalars['BigDecimal'];
    feesUSD: Scalars['BigDecimal'];
    feeGrowthOutside0X128: Scalars['BigInt'];
    feeGrowthOutside1X128: Scalars['BigInt'];
}

export interface TickFiveMinuteData {
    __typename?: 'TickFiveMinuteData';
    id: Scalars['ID'];
    date: Scalars['Int'];
    pool: Pool;
    tick: Tick;
    tickIdx: Scalars['BigInt'];
    liquidityGross: Scalars['BigInt'];
    liquidityNet: Scalars['BigInt'];
    startingVolumeToken0: Scalars['BigDecimal'];
    startingVolumeToken1: Scalars['BigDecimal'];
    startingVolumeUSD: Scalars['BigDecimal'];
    startingFeesUSD: Scalars['BigDecimal'];
    startingFeesToken0: Scalars['BigDecimal'];
    startingFeesToken1: Scalars['BigDecimal'];
    volumeToken0: Scalars['BigDecimal'];
    volumeToken1: Scalars['BigDecimal'];
    volumeUSD: Scalars['BigDecimal'];
    feesUSD: Scalars['BigDecimal'];
    feesToken0: Scalars['BigDecimal'];
    feesToken1: Scalars['BigDecimal'];
    feeGrowthOutside0X128: Scalars['BigInt'];
    feeGrowthOutside1X128: Scalars['BigInt'];
}

export interface TickHourData {
    __typename?: 'TickHourData';
    id: Scalars['ID'];
    date: Scalars['Int'];
    pool: Pool;
    tick: Tick;
    tickIdx: Scalars['BigInt'];
    liquidityGross: Scalars['BigInt'];
    liquidityNet: Scalars['BigInt'];
    startingVolumeToken0: Scalars['BigDecimal'];
    startingVolumeToken1: Scalars['BigDecimal'];
    startingVolumeUSD: Scalars['BigDecimal'];
    startingFeesUSD: Scalars['BigDecimal'];
    startingFeesToken0: Scalars['BigDecimal'];
    startingFeesToken1: Scalars['BigDecimal'];
    volumeToken0: Scalars['BigDecimal'];
    volumeToken1: Scalars['BigDecimal'];
    volumeUSD: Scalars['BigDecimal'];
    feesToken0: Scalars['BigDecimal'];
    feesToken1: Scalars['BigDecimal'];
    feesUSD: Scalars['BigDecimal'];
    feeGrowthOutside0X128: Scalars['BigInt'];
    feeGrowthOutside1X128: Scalars['BigInt'];
}

export interface Token {
    __typename?: 'Token';
    id: Scalars['ID'];
    symbol: Scalars['String'];
    name: Scalars['String'];
    decimals: Scalars['BigInt'];
    totalSupply: Scalars['BigInt'];
    volume: Scalars['BigDecimal'];
    volumeUSD: Scalars['BigDecimal'];
    untrackedVolumeUSD: Scalars['BigDecimal'];
    feesUSD: Scalars['BigDecimal'];
    txCount: Scalars['BigInt'];
    poolCount: Scalars['BigInt'];
    totalValueLocked: Scalars['BigDecimal'];
    totalValueLockedUSD: Scalars['BigDecimal'];
    totalValueLockedUSDUntracked: Scalars['BigDecimal'];
    derivedETH: Scalars['BigDecimal'];
    whitelistPools: Array<Pool>;
    tokenDayData: Array<TokenDayData>;
}

export interface TokenDayData {
    __typename?: 'TokenDayData';
    id: Scalars['ID'];
    date: Scalars['Int'];
    token: Token;
    volume: Scalars['BigDecimal'];
    volumeUSD: Scalars['BigDecimal'];
    untrackedVolumeUSD: Scalars['BigDecimal'];
    totalValueLocked: Scalars['BigDecimal'];
    totalValueLockedUSD: Scalars['BigDecimal'];
    priceUSD: Scalars['BigDecimal'];
    feesUSD: Scalars['BigDecimal'];
    open: Scalars['BigDecimal'];
    high: Scalars['BigDecimal'];
    low: Scalars['BigDecimal'];
    close: Scalars['BigDecimal'];
}

export interface TokenHourData {
    __typename?: 'TokenHourData';
    id: Scalars['ID'];
    date: Scalars['Int'];
    token: Token;
    volume: Scalars['BigDecimal'];
    volumeUSD: Scalars['BigDecimal'];
    untrackedVolumeUSD: Scalars['BigDecimal'];
    totalValueLocked: Scalars['BigDecimal'];
    totalValueLockedUSD: Scalars['BigDecimal'];
    priceUSD: Scalars['BigDecimal'];
    feesUSD: Scalars['BigDecimal'];
    open: Scalars['BigDecimal'];
    high: Scalars['BigDecimal'];
    low: Scalars['BigDecimal'];
    close: Scalars['BigDecimal'];
}

export interface Transaction {
    __typename?: 'Transaction';
    id: Scalars['ID'];
    blockNumber: Scalars['BigInt'];
    timestamp: Scalars['BigInt'];
    gasUsed: Scalars['BigInt'];
    gasPrice: Scalars['BigInt'];
    mints: Array<Maybe<Mint>>;
    burns: Array<Maybe<Burn>>;
    swaps: Array<Maybe<Swap>>;
    flashed: Array<Maybe<Flash>>;
    collects: Array<Maybe<Collect>>;
}

export interface UniswapDayData {
    __typename?: 'UniswapDayData';
    id: Scalars['ID'];
    date: Scalars['Int'];
    volumeETH: Scalars['BigDecimal'];
    volumeUSD: Scalars['BigDecimal'];
    volumeUSDUntracked: Scalars['BigDecimal'];
    feesUSD: Scalars['BigDecimal'];
    txCount: Scalars['BigInt'];
    tvlUSD: Scalars['BigDecimal'];
}

export type GetEthPriceQueryVariables = Exact<{
    id: Scalars['ID'];
    blockNumber?: Maybe<Scalars['Int']>;
}>;

export type GetEthPriceQuery = { __typename?: 'Query' } & {
    bundle?: Maybe<{ __typename?: 'Bundle' } & Pick<Bundle, 'ethPriceUSD'>>;
};

export type GetPoolDailyDataQueryVariables = Exact<{
    pool: Scalars['ID'];
    orderBy: Scalars['String'];
    orderDirection: Scalars['String'];
    startDate: Scalars['Int'];
    endDate: Scalars['Int'];
}>;

export type GetPoolDailyDataQuery = { __typename?: 'Query' } & {
    poolDayDatas: Array<
        { __typename?: 'PoolDayData' } & Pick<
            PoolDayData,
            | 'id'
            | 'date'
            | 'liquidity'
            | 'sqrtPrice'
            | 'open'
            | 'high'
            | 'low'
            | 'close'
            | 'token0Price'
            | 'token1Price'
            | 'volumeToken0'
            | 'volumeToken1'
            | 'volumeUSD'
            | 'tvlUSD'
            | 'txCount'
        > & {
                pool: { __typename?: 'Pool' } & Pick<
                    Pool,
                    'id' | 'token0Price' | 'token1Price'
                > & {
                        token0: { __typename?: 'Token' } & Pick<
                            Token,
                            'id' | 'name' | 'symbol'
                        >;
                        token1: { __typename?: 'Token' } & Pick<
                            Token,
                            'id' | 'name' | 'symbol'
                        >;
                    };
            }
    >;
};

export type GetPoolHourlyDataQueryVariables = Exact<{
    id: Scalars['ID'];
    orderBy: Scalars['String'];
    orderDirection: Scalars['String'];
    startTime: Scalars['Int'];
    endTime: Scalars['Int'];
}>;

export type GetPoolHourlyDataQuery = { __typename?: 'Query' } & {
    poolHourDatas: Array<
        { __typename?: 'PoolHourData' } & Pick<
            PoolHourData,
            | 'liquidity'
            | 'sqrtPrice'
            | 'open'
            | 'high'
            | 'low'
            | 'close'
            | 'date'
            | 'volumeToken0'
            | 'volumeToken1'
            | 'volumeUSD'
            | 'tvlUSD'
        > & { pool: { __typename?: 'Pool' } & Pick<Pool, 'id'> }
    >;
};

export type GetPoolOverviewQueryVariables = Exact<{
    id: Scalars['ID'];
    blockNumber?: Maybe<Scalars['Int']>;
}>;

export type GetPoolOverviewQuery = { __typename?: 'Query' } & {
    pool?: Maybe<
        { __typename?: 'Pool' } & Pick<
            Pool,
            | 'id'
            | 'createdAtTimestamp'
            | 'feeTier'
            | 'liquidity'
            | 'sqrtPrice'
            | 'token0Price'
            | 'token1Price'
            | 'tick'
            | 'volumeToken0'
            | 'volumeToken1'
            | 'volumeUSD'
            | 'totalValueLockedToken0'
            | 'totalValueLockedToken1'
            | 'totalValueLockedETH'
            | 'totalValueLockedUSD'
        > & {
                token0: { __typename?: 'Token' } & Pick<
                    Token,
                    'id' | 'name' | 'symbol' | 'decimals' | 'derivedETH'
                >;
                token1: { __typename?: 'Token' } & Pick<
                    Token,
                    'id' | 'name' | 'symbol' | 'decimals' | 'derivedETH'
                >;
            }
    >;
};

export type GetPoolsOverviewQueryVariables = Exact<{
    first: Scalars['Int'];
    orderBy: Scalars['String'];
    orderDirection: Scalars['String'];
}>;

export type GetPoolsOverviewQuery = { __typename?: 'Query' } & {
    pools: Array<
        { __typename?: 'Pool' } & Pick<
            Pool,
            | 'id'
            | 'createdAtTimestamp'
            | 'feeTier'
            | 'liquidity'
            | 'sqrtPrice'
            | 'token0Price'
            | 'token1Price'
            | 'tick'
            | 'volumeToken0'
            | 'volumeToken1'
            | 'volumeUSD'
            | 'totalValueLockedToken0'
            | 'totalValueLockedToken1'
            | 'totalValueLockedETH'
            | 'totalValueLockedUSD'
        > & {
                token0: { __typename?: 'Token' } & Pick<
                    Token,
                    'id' | 'name' | 'symbol' | 'decimals'
                >;
                token1: { __typename?: 'Token' } & Pick<
                    Token,
                    'id' | 'name' | 'symbol' | 'decimals'
                >;
            }
    >;
};

export type GetPositionSnapshotsQueryVariables = Exact<{
    owner: Scalars['String'];
}>;

export type GetPositionSnapshotsQuery = { __typename?: 'Query' } & {
    positionSnapshots: Array<
        { __typename?: 'PositionSnapshot' } & Pick<
            PositionSnapshot,
            | 'id'
            | 'owner'
            | 'timestamp'
            | 'token0PriceUSD'
            | 'token1PriceUSD'
            | 'liquidity'
            | 'sqrtPrice'
            | 'depositedToken0'
            | 'depositedToken1'
            | 'withdrawnToken0'
            | 'withdrawnToken1'
            | 'collectedFeesToken0'
            | 'collectedFeesToken1'
        > & {
                position: { __typename?: 'Position' } & Pick<
                    Position,
                    | 'liquidity'
                    | 'depositedToken0'
                    | 'depositedToken1'
                    | 'withdrawnToken0'
                    | 'withdrawnToken1'
                    | 'collectedFeesToken0'
                    | 'collectedFeesToken1'
                    | 'feeGrowthInside0LastX128'
                    | 'feeGrowthInside1LastX128'
                > & {
                        pool: { __typename?: 'Pool' } & Pick<
                            Pool,
                            | 'id'
                            | 'token0Price'
                            | 'token1Price'
                            | 'sqrtPrice'
                            | 'liquidity'
                        > & {
                                token0: { __typename?: 'Token' } & Pick<
                                    Token,
                                    'id' | 'name' | 'symbol' | 'decimals'
                                >;
                                token1: { __typename?: 'Token' } & Pick<
                                    Token,
                                    'id' | 'name' | 'symbol' | 'decimals'
                                >;
                            };
                        tickLower: { __typename?: 'Tick' } & Pick<
                            Tick,
                            'id' | 'tickIdx' | 'price0' | 'price1'
                        >;
                        tickUpper: { __typename?: 'Tick' } & Pick<
                            Tick,
                            'id' | 'tickIdx' | 'price0' | 'price1'
                        >;
                    };
            }
    >;
};

export type GetPositionsQueryVariables = Exact<{
    owner: Scalars['String'];
}>;

export type GetPositionsQuery = { __typename?: 'Query' } & {
    positions: Array<
        { __typename?: 'Position' } & Pick<
            Position,
            | 'id'
            | 'owner'
            | 'liquidity'
            | 'depositedToken0'
            | 'depositedToken1'
            | 'withdrawnToken0'
            | 'withdrawnToken1'
            | 'collectedFeesToken0'
            | 'collectedFeesToken1'
            | 'feeGrowthInside0LastX128'
            | 'feeGrowthInside1LastX128'
        > & {
                pool: { __typename?: 'Pool' } & Pick<
                    Pool,
                    | 'id'
                    | 'token0Price'
                    | 'token1Price'
                    | 'sqrtPrice'
                    | 'liquidity'
                > & {
                        token0: { __typename?: 'Token' } & Pick<
                            Token,
                            'id' | 'name' | 'symbol' | 'decimals' | 'derivedETH'
                        >;
                        token1: { __typename?: 'Token' } & Pick<
                            Token,
                            'id' | 'name' | 'symbol' | 'decimals' | 'derivedETH'
                        >;
                    };
                tickLower: { __typename?: 'Tick' } & Pick<
                    Tick,
                    'id' | 'tickIdx' | 'price0' | 'price1'
                >;
                tickUpper: { __typename?: 'Tick' } & Pick<
                    Tick,
                    'id' | 'tickIdx' | 'price0' | 'price1'
                >;
                transaction: { __typename?: 'Transaction' } & Pick<
                    Transaction,
                    'id' | 'gasUsed' | 'gasPrice'
                >;
            }
    >;
};

export type GetTopPoolsQueryVariables = Exact<{
    first: Scalars['Int'];
    orderDirection: Scalars['String'];
    orderBy: Scalars['String'];
}>;

export type GetTopPoolsQuery = { __typename?: 'Query' } & {
    pools: Array<
        { __typename?: 'Pool' } & Pick<
            Pool,
            | 'id'
            | 'createdAtTimestamp'
            | 'feeTier'
            | 'liquidity'
            | 'sqrtPrice'
            | 'token0Price'
            | 'token1Price'
            | 'volumeToken0'
            | 'volumeToken1'
            | 'volumeUSD'
            | 'totalValueLockedToken0'
            | 'totalValueLockedToken1'
            | 'totalValueLockedETH'
            | 'totalValueLockedUSD'
        > & {
                token0: { __typename?: 'Token' } & Pick<
                    Token,
                    'id' | 'name' | 'symbol' | 'decimals'
                >;
                token1: { __typename?: 'Token' } & Pick<
                    Token,
                    'id' | 'name' | 'symbol' | 'decimals'
                >;
            }
    >;
};
