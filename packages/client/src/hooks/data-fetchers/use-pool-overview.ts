import {useQuery} from 'react-query';
import { GetPoolOverviewResult, PoolOverview as PoolOverviewType } from '@sommelier/shared-types/src/api'
import { debug } from 'util/debug';

export type PoolOverview = PoolOverviewType;
export interface UsePoolOverview {
  data: GetPoolOverviewResult | null;
  isLoading: boolean;
  status: string;
  isError: boolean;
}

export const usePoolOverview = (network = 'rinkeby', poolId: string | null): UsePoolOverview => {
  const getPoolOverview = async () => {
    if (!poolId) return;

    const response = await fetch(`/api/v1/${network}/pools/${poolId}`);
    if(!response.ok) throw new Error(`Failed to fetch pool ${poolId}`);

    const data = await(
        response.json() as Promise<GetPoolOverviewResult>
    );

    debug.pool = data;

    return data;
  }

    const { data, isLoading, status, isError } = useQuery(
        ['poolOverview', poolId],
        getPoolOverview,
    );

    return { data, isLoading, status, isError };
}