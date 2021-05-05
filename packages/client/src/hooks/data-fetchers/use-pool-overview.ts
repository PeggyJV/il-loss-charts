import { NetworkIds } from '@sommelier/shared-types';
import { useQuery } from 'react-query';
import { GetPoolOverviewResult, PoolOverview as PoolOverviewType } from '@sommelier/shared-types/src/api'
import { debug } from 'util/debug';

import config from 'config';

export type PoolOverview = PoolOverviewType;
export interface UsePoolOverview {
  data: GetPoolOverviewResult | null;
  isLoading: boolean;
  status: string;
  isError: boolean;
}

export const usePoolOverview = (network: NetworkIds | null, poolId: string | null): UsePoolOverview => {
  const getPoolOverview = async () => {
    if (!poolId) return;
    if (!network) network = '1';
    const networkName = config.networks[network].name;

    const response = await fetch(`/api/v1/${networkName}/pools/${poolId}`);
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