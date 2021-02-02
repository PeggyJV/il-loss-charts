import {
    UniswapPair,
    UniswapDailyData,
    UniswapHourlyData,
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

export type Provider = 'metamask' | 'walletConnect';

export interface Wallet {
    account: string;
    provider: Provider;
}

export interface LPInfoState {
    pairData: UniswapPair;
    historicalDailyData: UniswapDailyData[];
    historicalHourlyData: UniswapHourlyData[];
}

export interface IError {
    message: string;
}

export type StatsWindow = 'total' | 'day' | 'week';
