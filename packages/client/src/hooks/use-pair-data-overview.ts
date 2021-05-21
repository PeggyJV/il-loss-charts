import { useState, useEffect } from 'react';
import { NetworkIds, IUniswapPair, UniswapPair } from '@sommelier/shared-types';
import { useQuery } from 'react-query';
import { UniswapApiFetcher } from 'services/api';

export const usePairDataOverview = (
    pairId: string | null,
    network: NetworkIds,
): UniswapPair | null => {
    const [pairData, setPairData] = useState<UniswapPair | null>(null);

    const fetchPairData = async (pairId: string | null) => {
        if (!pairId) return;
        return await UniswapApiFetcher.getPairOverview(network, pairId);
    };

    const { data: newPair } = useQuery(['pairDataOverview', pairId], () =>
        fetchPairData(pairId),
    );

    useEffect(() => {
        newPair && setPairData(new UniswapPair(newPair?.data as IUniswapPair));
    }, [newPair]);

    return pairData;
};
