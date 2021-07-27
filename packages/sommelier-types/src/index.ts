import BigNumber from 'bignumber.js';

import { ILiquidityData, IUniswapPair, IToken, UniswapPair } from './pair';

export type { ILiquidityData, IUniswapPair, IToken }; // used as type
export { UniswapPair }; // use as value

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

type HistoricalData = UniswapDailyData | UniswapHourlyData;
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

export interface PoolStats<T = BigNumber> {
    timeWindow: 'daily' | 'hourly';
    runningVolume: T[];
    dailyVolume: T[];
    runningPoolFees: T[];
    dailyLiquidity: T[];
    ticks: string[];
    fullDates?: Date[];
    dataPoints: HistoricalData[];
}
export interface LPStats<T = BigNumber> extends PoolStats<T> {
    dailyEthPrice: T[];
    totalFees: T;
    totalNotionalGain: T;
    runningFees: T[];
    runningNotionalGain: T[];
    runningImpermanentLoss: T[];
    runningReturn: T[];
    impermanentLoss: T;
    totalReturn: T;
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

export interface OHLCData {
    poolId?: string;
    baseCurrency: string;
    quoteCurrency: string;
    current: number;
    open: number;
    high: number;
    low: number;
    close: number;
}
export interface LiquidityBand {
    poolId?: string;
    baseTokenId: string;
    quoteTokenId: string;
    indicatorName: string;
    metadata?: { [key: string]: any };
    currentPrice?: number;
    bounds: {
        [key: string]: [number, number];
    };
}

export type EthNetwork = 'mainnet' | 'rinkeby' | 'goerli' | 'ropsten' | 'kovan';

export type NetworkIds = '1' | '4' | '5' | '3' | '42';

// Utility
export type ArrayElement<ArrayType extends readonly unknown[]> =
    ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

// TODO rename this package to shared and clean up import / exports
export interface ICodedError {
    code: number;
    message: string;
    toString: () => string;
    clone: () => CodedError;
}

export class CodedError extends Error implements ICodedError {
    public code: number;
    public message: string;

    constructor(code: number, message: string) {
        super(message);

        this.code = code;
        this.message = message;
    }

    toString(): string {
        return `Error ${this.code}: ${this.message}`;
    }

    clone(): CodedError {
        return new CodedError(this.code, this.message);
    }
}

const ValidationError = new CodedError(100, 'Could not validate parameters.');
const UpstreamError = new CodedError(
    1000,
    'Encountered error with upstream service.',
);
const UpstreamMissingPoolDataError = new CodedError(
    1001,
    'Upstream service missing data for pool.',
);

// Object with every coded error
const codedErrors = {
    UpstreamError,
    UpstreamMissingPoolDataError,
    ValidationError,
};

// TODO: i want to be able to import '@sommelier/shared/errors'
export const errors = Object.entries(codedErrors).reduce(
    (codes: Record<string, CodedError>, error: [string, CodedError]) => {
        const [errorName, codedError] = error;
        const code = codedError.code.toString();

        codes[errorName] = codedError;
        codes[code] = codedError;

        return codes;
    },
    {},
);
