import { useQuery } from 'react-query';
import { UniswapApiFetcher as Uniswap } from 'services/api';
import {
    errors as codedErrors,
    CodedError,
    IUniswapPair,
    IToken,
    NetworkIds,
    LiquidityBand,
} from '@sommelier/shared-types';
import { DexTrade } from '@sommelier/shared-types/src/bitquery';

type MaybeToken = Partial<IToken> | undefined;

type IndicatorsMap = {
    marketData?: DexTrade[];
    indicators?: { [indicatorName: string]: LiquidityBand };
};

export const useMarketData = (
    baseToken: MaybeToken,
    quoteToken: MaybeToken,
    network?: NetworkIds | null
): { newPair: DexTrade | undefined } & IndicatorsMap => {
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

    const getMainnetTokenIdForSymbol = async (
        token: Partial<IToken>
    ): Promise<string> => {
        const { symbol } = token;
        if (!symbol) return token.id as string;

        const topPairs = await getTopPairs();

        for (const pair of topPairs) {
            const { token0, token1 } = pair;

            if (token0.symbol === symbol) {
                return token0.id;
            }

            if (token1.symbol === symbol) {
                return token1.id;
            }
        }

        return token.id as string;
    };

    const fetchPairData = async (
        baseToken: MaybeToken,
        quoteToken: MaybeToken
    ) => {
        if (!baseToken || !quoteToken) return;

        const baseTokenId =
            network !== '1'
                ? await getMainnetTokenIdForSymbol(baseToken)
                : baseToken.id;
        const quoteTokenId =
            network !== '1'
                ? await getMainnetTokenIdForSymbol(quoteToken)
                : quoteToken.id;

        const response = await fetch(
            `/api/v1/marketData/daily?baseToken=${
                baseTokenId ?? ''
            }&quoteToken=${quoteTokenId ?? ''}`
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

    const fetchIndicators = async (
        baseToken: MaybeToken,
        quoteToken: MaybeToken
    ) => {
        if (!baseToken || !quoteToken) return;

        const baseTokenId =
            network && network !== '1'
                ? await getMainnetTokenIdForSymbol(baseToken)
                : baseToken.id;
        const quoteTokenId =
            network && network !== '1'
                ? await getMainnetTokenIdForSymbol(quoteToken)
                : quoteToken.id;

        const response = await fetch(
            `/api/v1/marketData/indicators?baseToken=${
                baseTokenId ?? ''
            }&quoteToken=${quoteTokenId ?? ''}`
        );

        if (!response.ok) {
            const { error } = await response.json();
            throw getCodedError(error, 'Failed to fetch indicators.');
        }

        const data = await (response.json() as Promise<IndicatorsMap>);
        return data;
    };

    const { data: newPair } = useQuery(
        ['marketData', baseToken?.id, quoteToken?.id],
        () => fetchPairData(baseToken, quoteToken),
        { retry }
    );

    const { data: indicators } = useQuery(
        ['indicators', baseToken?.id, quoteToken?.id],
        () => fetchIndicators(baseToken, quoteToken),
        { retry }
    );

    return { newPair, ...indicators };
};

// TODO: move to a util for rethrowing coded errors?
function getCodedError(error: { code?: number } | undefined, fallbackMsg: string): Error | CodedError {
    const codedError = codedErrors[error?.code ?? ''];
    if (codedError) {
        // TODO: Something is up with the type of CodedError when importing
        const err: Error = (codedError as any);
        return err;
    }

    return new Error(fallbackMsg);
}

function retry(count: number, error: Error | CodedError) {
    if (error instanceof CodedError) {
        const { code } = error;
        const shouldRetry = code !== codedErrors.UpstreamError.code
            && code !== codedErrors.UpstreamMissingPoolDataError.code;

        return shouldRetry;
    }

    return count < 1;
}