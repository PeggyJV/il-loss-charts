import {useQuery, UseQueryResult} from 'react-query';
import { IUniswapPair, UniswapPair } from '@sommelier/shared-types';

type Temp = {
    data: UniswapPair[] | void,
    isLoading: boolean,
    status: string,
    isError: boolean,
}

export const useAllPairs = (): Temp => {
    const getAllPairs = async () => {
        const response = await fetch(`/api/v1/rinkeby/pools?count=${1000}`);
        // TODO: remove data prop
        const json: { data: IUniswapPair[] } = await (response.json() as any);
        console.log('heheyjson', json);
        const { data } = json;
        console.log('hehhey', data);

        return data.map((d: IUniswapPair) => new UniswapPair(d));
    };

    const { data, isLoading, status, isError } = useQuery(
        ['allPairs'],
        getAllPairs
    );

    return { data, isLoading, status, isError };
};