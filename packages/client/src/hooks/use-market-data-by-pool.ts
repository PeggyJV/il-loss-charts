import { useQuery } from 'react-query';
import { UniswapApiFetcher as Uniswap } from 'services/api';
import { PoolOverview } from 'hooks/data-fetchers';
import {
    errors as codedErrors,
    CodedError,
    IUniswapPair,
    IToken,
    NetworkIds,
    LiquidityBand,
} from '@sommelier/shared-types';
import { DexTrade } from '@sommelier/shared-types/src/bitquery';

type MaybePool = PoolOverview | undefined;

type IndicatorsMap = {
    marketData?: DexTrade[];
    indicators?: { [indicatorName: string]: LiquidityBand };
};

export const useMarketData = (
    pool: MaybePool,
    network?: NetworkIds | null,
): { newPair: any } & IndicatorsMap => {
    let topPairs: IUniswapPair[];

    const getTopPairs = async (): Promise<IUniswapPair[]> => {
        if (!topPairs) {
            const { data: pairsRaw, error } = await Uniswap.getTopV2Pairs();

            if (error) {
                // we could not list pairs
                console.warn(`Could not fetch top pairs: ${error}`);
                throw error;
            }

            if (pairsRaw) {
                topPairs = pairsRaw;
            }
        }

        return topPairs;
    };

    const getMainnetPoolIdForSymbol = async (
        baseToken: Partial<IToken>,
        quoteToken: Partial<IToken>,
    ): Promise<string> => {
        const topPairs = await getTopPairs();

        for (const pair of topPairs) {
            const { token0, token1 } = pair;

            if (
                token0.symbol === baseToken.symbol &&
                token1.symbol === quoteToken.symbol
            ) {
                return pair.id;
            }

            if (
                token1.symbol === baseToken.symbol &&
                token0.symbol === quoteToken.symbol
            ) {
                return pair.id;
            }
        }

        return '';
    };

    const fetchPairData = async (pool: MaybePool) => {
        if (!pool) return;

        const poolId =
            network !== '1'
                ? await getMainnetPoolIdForSymbol(pool.token0, pool.token1)
                : pool.id;

        const response = await fetch(
            `/api/v1/marketData/daily?poolId=${poolId}`,
            // if we start setting the days param here, dynamic or static
            // we will need to update the cache warmer PERIOD_DAYS value
        );

        if (!response.ok) {
            const { error } = await response.json();
            throw getCodedError(error, 'Failed to fetch market data.');
        }
        const data = await (response.json() as Promise<DexTrade>);
        return data;
    };

    const fetchIndicators = async (pool: MaybePool) => {
        if (!pool) return;

        const poolId =
            network !== '1'
                ? await getMainnetPoolIdForSymbol(pool.token0, pool.token1)
                : pool.id;

        const response = await fetch(
            `/api/v1/marketData/indicators?poolId=${poolId}`,
        );

        if (!response.ok) {
            const { error } = await response.json();
            throw getCodedError(error, 'Failed to fetch indicators.');
        }

        const data = await (response.json() as Promise<IndicatorsMap>);
        return data;
    };

    const { data: newPair } = useQuery(
        ['marketData', pool?.id],
        () => fetchPairData(pool),
        { retry },
    );

    const { data: indicators } = useQuery(
        ['indicators', pool?.id],
        () => fetchIndicators(pool),
        { retry },
    );

    return { newPair, ...indicators };
};

// TODO: move to a util for rethrowing coded errors?
function getCodedError(
    error: { code?: number } | undefined,
    fallbackMsg: string,
): Error | CodedError {
    const codedError = codedErrors[error?.code ?? ''];
    if (codedError) {
        // TODO: Something is up with the type of CodedError when importing
        const err: Error = codedError as any;
        return err;
    }

    return new Error(fallbackMsg);
}

function retry(count: number, error: Error | CodedError) {
    if (error instanceof CodedError) {
        const { code } = error;
        const shouldRetry =
            code !== codedErrors.UpstreamError.code &&
            code !== codedErrors.UpstreamMissingPoolDataError.code;

        return shouldRetry;
    }

    return count < 1;
}
