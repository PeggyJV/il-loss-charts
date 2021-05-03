
import { useQuery } from 'react-query';
import { UniswapApiFetcher as Uniswap } from 'services/api';
import { IUniswapPair, IToken, NetworkIds, LiquidityBand } from '@sommelier/shared-types';
import { DexTrade } from '@sommelier/shared-types/src/bitquery';

type MaybeToken = Partial<IToken> | undefined;

type IndicatorsMap = {
    marketData?: DexTrade[];
    indicators?: { [indicatorName: string]: LiquidityBand }
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
            console.log('THIS IS TOP PAIRS', pairsRaw);

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
    }

    const getMainnetTokenIdForSymbol = async (token: Partial<IToken>): Promise<string> => {
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
    }

    const fetchPairData = async (baseToken: MaybeToken, quoteToken: MaybeToken) => {
        if (!baseToken || !quoteToken) return;

        const baseTokenId = (network !== '1') ? (await getMainnetTokenIdForSymbol(baseToken)) : baseToken.id;
        const quoteTokenId = (network !== '1') ? (await getMainnetTokenIdForSymbol(quoteToken)) : quoteToken.id;

        const response = await fetch(
            `/api/v1/marketData/daily?baseToken=${baseTokenId!}&quoteToken=${quoteTokenId!}`
        );
        const data = await (response.json() as Promise<DexTrade>);
        return data;
    };

    const fetchIndicators = async (baseToken: MaybeToken, quoteToken: MaybeToken) => {
        if (!baseToken || !quoteToken) return;

        const baseTokenId = (network && network !== '1') ? (await getMainnetTokenIdForSymbol(baseToken)) : baseToken.id;
        const quoteTokenId = (network && network !== '1') ? (await getMainnetTokenIdForSymbol(quoteToken)) : quoteToken.id;

        const response = await fetch(
            `/api/v1/marketData/indicators?baseToken=${baseTokenId!}&quoteToken=${quoteTokenId!}`
        );
        const data = await (response.json() as Promise<IndicatorsMap>);
        return data;
    };

    const { data: newPair } = useQuery(['marketData', baseToken?.id, quoteToken?.id], () =>
        fetchPairData(baseToken, quoteToken)
    );

    const { data: indicators } = useQuery(['indicators', baseToken?.id, quoteToken?.id], () =>
        fetchIndicators(baseToken, quoteToken)
    );

    return { newPair, ...indicators };
};

