
import { useQuery } from 'react-query';
import { LiquidityBand } from '@sommelier/shared-types';
import { DexTrade } from '@sommelier/shared-types/src/bitquery';

type TokenOrNull = string | null;

type IndicatorsMap = {
    marketData?: DexTrade[];
    indicators?: { [indicatorName: string]: LiquidityBand }
};

export const useMarketData = (
    baseToken: TokenOrNull,
    quoteToken: TokenOrNull
): { newPair: DexTrade | undefined } & IndicatorsMap => {

    const fetchPairData = async (baseToken: TokenOrNull, quoteToken: TokenOrNull) => {
        if (!baseToken || !quoteToken) return;

        const response = await fetch(
            `/api/v1/marketData/daily?baseToken=${baseToken}&quoteToken=${quoteToken}`
        );
        const data = await (response.json() as Promise<DexTrade>);
        return data;
    };

    const fetchIndicators = async (baseToken: TokenOrNull, quoteToken: TokenOrNull) => {
        if (!baseToken || !quoteToken) return;

        const response = await fetch(
            `/api/v1/marketData/indicators?baseToken=${baseToken}&quoteToken=${quoteToken}`
        );
        const data = await (response.json() as Promise<IndicatorsMap>);
        return data;
    };

    const { data: newPair } = useQuery(['marketData', baseToken, quoteToken], () =>
        fetchPairData(baseToken, quoteToken)
    );

    const { data: indicators } = useQuery(['indicators', baseToken, quoteToken], () =>
        fetchIndicators(baseToken, quoteToken)
    );

    return { newPair, ...indicators };
};

