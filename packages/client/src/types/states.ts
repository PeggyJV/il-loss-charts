import {
    MarketStats,
    UniswapPair,
    UniswapDailyData,
    UniswapHourlyData,
    UniswapSwap,
    UniswapMintOrBurn,
} from '@sommelier/shared-types';

export interface AllPairsState {
    isLoading: boolean;
    pairs: UniswapPair[] | null;
    lookups: {
        [pairId: string]: UniswapPair & {
            volumeRanking: number;
            liquidityRanking: number;
        };
    } | null;
    byLiquidity: UniswapPair[] | null;
}

export type Provider = 'metamask' | 'walletconnect';

export interface Wallet {
    account: string | null;
    providerName: Provider | null;
    provider: any | null;
}

export interface PairPricesState {
    pairData: UniswapPair;
    historicalDailyData: UniswapDailyData[];
    historicalHourlyData: UniswapHourlyData[];
}

export interface IError {
    message: string;
}

export type StatsWindow = 'total' | 'day' | 'week';

export interface SwapsState {
    swaps: UniswapSwap[] | null;
    mintsAndBurns: {
        mints: UniswapMintOrBurn[];
        burns: UniswapMintOrBurn[];
        combined: UniswapMintOrBurn[];
    } | null;
}

export interface PairDataState {
    isLoading: boolean;
    currentError?: string;
    lpInfo?: PairPricesState;
    latestSwaps?: SwapsState;
}

export interface TopPairsState {
    daily: MarketStats[];
    weekly: MarketStats[];
}

export interface PrefetchedPairState {
    [pairId: string]: PairDataState;
}
