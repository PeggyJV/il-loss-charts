
import { useQuery } from 'react-query';
import { DexTrade } from '@sommelier/shared-types/src/bitquery';

type TokenOrNull = string | null;
export const useMarketData = (
    baseToken: TokenOrNull,
    quoteToken: TokenOrNull
): DexTrade | undefined => {

    const fetchPairData = async (baseToken: TokenOrNull, quoteToken: TokenOrNull) => {
        if (!baseToken || !quoteToken) return;

        const response = await fetch(
            `/api/v1/marketData/daily?baseToken=${baseToken}&quoteToken=${quoteToken}`
        );
        const data = await (response.json() as Promise<DexTrade>);
        return data;
    };

    const { data: newPair } = useQuery(['marketData', baseToken, quoteToken], () =>
        fetchPairData(baseToken, quoteToken)
    );

    console.log('data :: ', newPair);

    return newPair;
};

