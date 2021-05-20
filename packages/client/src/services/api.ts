import {
    MarketStats,
    IUniswapPair,
    UniswapSwap,
    UniswapMintOrBurn,
    UniswapDailyData,
    UniswapHourlyData,
    LPPositionData,
    LPStats,
    NetworkIds
} from '@sommelier/shared-types';

import { UniswapApiFetcher as OfflineFetcher } from 'services/offline-api';

import config from 'config/app'
import { Network } from '@sommelier/shared-types/src/bitquery';

type ApiResponse<T> = { data?: T; error?: string };

const useOffline = process.env.REACT_APP_OFFLINE_MODE;
if (useOffline) {
    console.log('Using offline mode');
}

const shouldRetryError = (error: string) => {
    return error.match(/ENOTFOUND/)
        || error.match(/ECONNREFUSED/)
        || error.match(/Unexpected/i)
        || error.match(/canceling/);
}

export class UniswapApiFetcher extends OfflineFetcher {
    static _getNetworkName(network: NetworkIds): string {
        return config.networks[network].name;
    }

    static async getPairOverview(
        network: NetworkIds,
        pairId: string
    ): Promise<ApiResponse<IUniswapPair>> {
        if (useOffline) return OfflineFetcher.getPairOverview(network, pairId);
        const networkName = UniswapApiFetcher._getNetworkName(network);

        const response = await fetch(`/api/v1/ss${networkName}/pools/${pairId}`);
        const { data, error } = await (response.json() as Promise<
            ApiResponse<IUniswapPair>
        >);

        if (error && shouldRetryError(error)) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return UniswapApiFetcher.getPairOverview(network, pairId);
        }

        return { data, error };
    }

    static async getLatestSwaps(
        network: NetworkIds,
        pairId: string
    ): Promise<ApiResponse<UniswapSwap[]>> {
        if (useOffline) return OfflineFetcher.getLatestSwaps(network, pairId);
        const networkName = UniswapApiFetcher._getNetworkName(network);

        const response = await fetch(`/api/v1/${networkName}/pools/${pairId}/swaps`);
        const { data, error } = await (response.json() as Promise<
            ApiResponse<UniswapSwap[]>
        >);

        if (error && shouldRetryError(error)) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return UniswapApiFetcher.getLatestSwaps(network, pairId);
        }

        return { data, error };
    }

    static async getMintsAndBurns(
        pairId: string
    ): Promise<
        ApiResponse<{
            mints: UniswapMintOrBurn[];
            burns: UniswapMintOrBurn[];
            combined: UniswapMintOrBurn[];
        }>
    > {
        if (useOffline) return OfflineFetcher.getMintsAndBurns(pairId);

        const response = await fetch(
            `/api/v1/uniswap/pairs/${pairId}/addremove`
        );
        const { data, error } = await response.json();

        if (error && shouldRetryError(error)) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return UniswapApiFetcher.getMintsAndBurns(pairId);
        }

        return { data, error };
    }

    static async getTopPairs(
        network: NetworkIds,
        count = 1000
    ): Promise<ApiResponse<IUniswapPair[]>> {
        if (useOffline) return OfflineFetcher.getTopPairs(network, count);
        const networkName = UniswapApiFetcher._getNetworkName(network);

        const response = await fetch(`/api/v1/${networkName}/pools?count=${count}`);
        const { data, error } = await (response.json() as Promise<
            ApiResponse<IUniswapPair[]>
        >);

        if (error && shouldRetryError(error)) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return UniswapApiFetcher.getTopPairs(network, count);
        }

        return { data, error };
    }

    static async getTopV2Pairs(
        count = 1000
    ): Promise<ApiResponse<IUniswapPair[]>> {
        if (useOffline) return OfflineFetcher.getTopPairs('1', count);

        const response = await fetch(`/api/v1/uniswap/pairs?count=${count}`);
        const { data, error } = await (response.json() as Promise<
            ApiResponse<IUniswapPair[]>
        >);

        if (error && shouldRetryError(error)) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return UniswapApiFetcher.getTopV2Pairs(count);
        }

        return { data, error };
    }

    static async getMarketData(
        startDate = '2020-12-01'
    ): Promise<ApiResponse<MarketStats[]>> {
        if (useOffline) return OfflineFetcher.getMarketData(startDate);

        const response = await fetch(
            `/api/v1/uniswap/market?startDate=${startDate}`
        );
        const { data, error } = await (response.json() as Promise<
            ApiResponse<MarketStats[]>
        >);

        if (error && shouldRetryError(error)) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return UniswapApiFetcher.getMarketData(startDate);
        }

        return { data, error };
    }

    static async getDailyTopPerformingPairs(): Promise<
        ApiResponse<MarketStats[]>
    > {
        if (useOffline) return OfflineFetcher.getDailyTopPerformingPairs();

        const response = await fetch(`/api/v1/uniswap/pairs/performance/daily`);
        const { data, error } = await (response.json() as Promise<
            ApiResponse<MarketStats[]>
        >);

        // Retry because the graph sometimes fails
        // TODO: Implement better retry mechanism and/or remove once we have local graph
        if (error && shouldRetryError(error)) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return UniswapApiFetcher.getDailyTopPerformingPairs();
        }

        return { data, error };
    }

    static async getWeeklyTopPerformingPairs(): Promise<
        ApiResponse<MarketStats[]>
    > {
        if (useOffline) return OfflineFetcher.getWeeklyTopPerformingPairs();

        const response = await fetch(
            `/api/v1/uniswap/pairs/performance/weekly`
        );
        const { data, error } = await (response.json() as Promise<
            ApiResponse<MarketStats[]>
        >);

        // Retry because the graph sometimes fails
        // TODO: Implement better retry mechanism and/or remove once we have local graph
        if (error && shouldRetryError(error)) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return UniswapApiFetcher.getWeeklyTopPerformingPairs();
        }

        return { data, error };
    }

    static async getHistoricalDailyData(
        network: NetworkIds,
        pairId: string,
        startDate: Date,
        endDate = new Date()
    ): Promise<ApiResponse<UniswapDailyData[]>> {
        if (useOffline)
            return OfflineFetcher.getHistoricalDailyData(
                network,
                pairId,
                startDate,
                endDate
            );

        const networkName = UniswapApiFetcher._getNetworkName(network);

        const response = await fetch(
            `/api/v1/${networkName}/pools/${pairId}/historical/daily?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
        );
        const { data, error } = await (response.json() as Promise<
            ApiResponse<UniswapDailyData[]>
        >);

        if (error && shouldRetryError(error)) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return UniswapApiFetcher.getHistoricalDailyData(
                network,
                pairId,
                startDate,
                endDate
            );
        }

        return { data, error };
    }

    static async getHistoricalHourlyData(
        network: NetworkIds,
        pairId: string,
        startDate: Date,
        endDate = new Date()
    ): Promise<ApiResponse<UniswapHourlyData[]>> {
        if (useOffline)
            return OfflineFetcher.getHistoricalHourlyData(
                network,
                pairId,
                startDate,
                endDate
            );

        const networkName = UniswapApiFetcher._getNetworkName(network);

        const response = await fetch(
            `/api/v1/${networkName}/pools/${pairId}/historical/hourly?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
        );
        const { data, error } = await (response.json() as Promise<
            ApiResponse<UniswapHourlyData[]>
        >);

        if (error && shouldRetryError(error)) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return UniswapApiFetcher.getHistoricalHourlyData(
                network,
                pairId,
                startDate,
                endDate
            );
        }

        return { data, error };
    }

    static async getPairStats(
        pairId: string,
        startDate: Date,
        endDate = new Date(),
        lpLiquidityUSD: number
    ): Promise<ApiResponse<LPStats<string>>> {
        if (useOffline)
            return OfflineFetcher.getPairStats(pairId, startDate, endDate, lpLiquidityUSD);

        const response = await fetch(
            `/api/v1/uniswap/pairs/${pairId}/stats?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&lpLiquidityUSD=${lpLiquidityUSD}`
        );
        const { data, error } = await (response.json() as Promise<
            ApiResponse<LPStats<string>>
        >);

        if (error && shouldRetryError(error)) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return UniswapApiFetcher.getPairStats(pairId, startDate, endDate, lpLiquidityUSD);
        }

        return { data, error };
    }

    static async getPositionStats(
        address: string
    ): Promise<ApiResponse<LPPositionData<string>>> {
        const response = await fetch(
            `/api/v1/uniswap/positions/${address}/stats`
        );
        const { data, error } = await (response.json() as Promise<
            ApiResponse<LPPositionData<string>>
        >);

        if (error && shouldRetryError(error)) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return UniswapApiFetcher.getPositionStats(address);
        }

        return { data, error };
    }
}
