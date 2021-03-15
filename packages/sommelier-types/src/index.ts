import BigNumber from 'bignumber.js';

import { 
    ILiquidityData, 
    IUniswapPair, 
    IToken,
    UniswapPair 
} from './pair';

export { ILiquidityData, IUniswapPair, IToken, UniswapPair };
export interface UniswapDailyData extends ILiquidityData {
    __typename: 'PairDayData';
    date: number;
    pairAddress: string;
    dailyVolumeToken0: string;
    dailyVolumeToken1: string;
    dailyVolumeUSD: string;
}

export interface UniswapHourlyData extends ILiquidityData {
    __typename: 'PairHourData';
    pair: Partial<IUniswapPair>;
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
    pair: Partial<IUniswapPair>;
}

export interface UniswapMintOrBurn {
    __typename: 'Mint' | 'Burn';
    amount0: string;
    amount1: string;
    amountUSD: string;
    liquidity: string;
    to: string;
    pair: Partial<IUniswapPair>;
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

export interface MarketStats extends IUniswapPair {
    ilGross: number;
    market: string;
    impermanentLoss: number;
    volume: number;
    liquidity: number;
    returnsUSD: number;
    returnsETH: number;
    pctReturn: number;
}

export interface UniswapLiquidityPositionAtTime extends ILiquidityData {
    id: string;
    liquidityPosition: {
        id: string;
        liquidityTokenBalance: string;
        pair: Partial<IUniswapPair>;
    };
    liquidityTokenBalance: string;
    liquidityTokenTotalSupply: string;
    pair: Partial<IUniswapPair>;
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

export interface EthGasPrices {
    safeLow: number;
    standard: number;
    fast: number;
    fastest: number;
}
