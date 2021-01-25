import {
    UniswapPair
} from '@sommelier/shared-types';

export interface AllPairsState {
    isLoading: boolean;
    pairs: UniswapPair[] | null,
    lookups: { [pairId: string]: UniswapPair } | null,
    byLiquidity: UniswapPair[] | null
}