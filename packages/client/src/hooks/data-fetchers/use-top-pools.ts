import {useQuery} from 'react-query';
import { GetTopPoolsResult, TopPool as TopPoolType } from '@sommelier/shared-types/src/api'
import { debug } from 'util/debug';

// For Easy Import
export type TopPool = TopPoolType;
export interface UseTopPools {
    data: GetTopPoolsResult | void;
    isLoading: boolean;
    status: string;
    isError: boolean;
}

export const useTopPools = (network = 'rinkeby'): UseTopPools => {
    const getTopPools = async () => {
        const response = await fetch(`/api/v1/${network}/pools?count=${1000}`);
        const data: GetTopPoolsResult = await (response.json() as any);

        debug.pools = data;

        return data;
    };

    const { data, isLoading, status, isError } = useQuery(
        ['topPools'],
        getTopPools,
    );

    return { data, isLoading, status, isError };
};