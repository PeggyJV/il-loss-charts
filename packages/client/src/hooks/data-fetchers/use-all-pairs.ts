import { useState, useEffect } from 'react';
import {useQuery, UseQueryResult} from 'react-query';


export const useAllPairs = (): UseQueryResult<unknown> => {
    const getAllPairs = async () => {
        const response = await fetch(`/api/v1/rinkeby/pools?count=${1000}`);
        return response.json();
    };

    const { data, isLoading, status, isError } = useQuery(
        ['allPairs'],
        getAllPairs
    );

    return { data, isLoading, status, isError };
};

