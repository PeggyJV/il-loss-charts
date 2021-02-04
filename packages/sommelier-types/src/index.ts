import BigNumber from 'bignumber.js';
export interface LiquidityData {
    reserve0: string;
    reserve1: string;
    reserveUSD: string;
}
export interface Token {
    __typename: 'Token';
    decimals: string;
    derivedETH: string;
    id: string;
    name: string;
    symbol: string;
    totalLiquidity: string;
    tradeVolumeUSD: string;
}

export interface UniswapPair extends LiquidityData {
    __typename: 'Pair';
    createdAtTimestamp: string;
    id: string;
    token0: Partial<Token>;
    token1: Partial<Token>;
    token0Price: string;
    token1Price: string;
    trackedReserveETH: string;
    txCount: string;
    volumeUSD: string;
    feesUSD?: string;
}

export interface UniswapDailyData extends LiquidityData {
    __typename: 'PairDayData';
    date: number;
    pairAddress: string;
    dailyVolumeToken0: string;
    dailyVolumeToken1: string;
    dailyVolumeUSD: string;
}

export interface UniswapHourlyData extends LiquidityData {
    __typename: 'PairHourData';
    pair: Partial<UniswapPair>;
    hourStartUnix: number;
    hourlyVolumeToken0: string;
    hourlyVolumeToken1: string;
    hourlyVolumeUSD: string;
}

export interface UniswapSwap {
    __typename: 'Swap';
    amount0In: string;
    amount0Out: string;
    amount1In: string;
    amount1Out: string;
    amountUSD: string;
    to: string;
    pair: Partial<UniswapPair>;
}

export interface UniswapMintOrBurn {
    __typename: 'Mint' | 'Burn';
    amount0: string;
    amount1: string;
    amountUSD: string;
    liquidity: string;
    to: string;
    pair: Partial<UniswapPair>;
    timestamp: string;
}
export interface LPStats<T = BigNumber> {
    timeWindow: 'daily' | 'hourly';
    totalFees: T;
    runningVolume: T[];
    dailyVolume: T[];
    runningFees: T[];
    runningPoolFees: T[];
    runningImpermanentLoss: T[];
    runningReturn: T[];
    dailyLiquidity: T[];
    impermanentLoss: T;
    totalReturn: T;
    ticks: string[];
    fullDates?: Date[];
}

export interface StatsOverTime<T = BigNumber> {
    volumeUSD: T;
    liquidityUSD: T;
    feesUSD: T;
    volumeUSDChange?: T;
    liquidityUSDChange?: T;
    feesUSDChange?: T;
}
export interface TimeWindowStats<T = BigNumber> {
    totalStats?: StatsOverTime<T>;
    lastPeriodStats?: StatsOverTime<T>;
    prevPeriodStats?: StatsOverTime<T>;
}

export interface MarketStats extends UniswapPair {
    ilGross: number;
    market: string;
    impermanentLoss: number;
    volume: number;
    liquidity: number;
    returnsUSD: number;
    returnsETH: number;
    pctReturn: number;
}

export interface UniswapLiquidityPositionAtTime extends LiquidityData {
    id: string;
    liquidityPosition: {
        id: string;
        liquidityTokenBalance: string;
        pair: Partial<UniswapPair>;
    };
    liquidityTokenBalance: string;
    liquidityTokenTotalSupply: string;
    pair: Partial<UniswapPair>;
    timestamp: number;
}

type HistoricalData = UniswapDailyData | UniswapHourlyData;

export interface LPPositionData<T = BigNumber> {
    positions: { [pairId: string]: UniswapLiquidityPositionAtTime[] };
    stats: {
        [pairId: string]: {
            historicalData: HistoricalData[];
            aggregatedStats: LPStats<T>;
            statsWindows: LPStats<T>[];
        };
    };
}
