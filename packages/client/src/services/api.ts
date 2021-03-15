import {
    MarketStats,
    IUniswapPair,
    UniswapSwap,
    UniswapMintOrBurn,
    UniswapDailyData,
    UniswapHourlyData,
    LPPositionData,
} from '@sommelier/shared-types';

import { UniswapApiFetcher as OfflineFetcher } from 'services/offline-api';

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
    static async getPairOverview(
        pairId: string
    ): Promise<ApiResponse<IUniswapPair>> {
        if (useOffline) return OfflineFetcher.getPairOverview(pairId);

        const response = await fetch(`/api/v1/uniswap/pairs/${pairId}`);
        const { data, error } = await (response.json() as Promise<
            ApiResponse<IUniswapPair>
        >);

        if (error && shouldRetryError(error)) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return UniswapApiFetcher.getPairOverview(pairId);
        }

        return { data, error };
    }

    static async getLatestSwaps(
        pairId: string
    ): Promise<ApiResponse<UniswapSwap[]>> {
        if (useOffline) return OfflineFetcher.getLatestSwaps(pairId);

        const response = await fetch(`/api/v1/uniswap/pairs/${pairId}/swaps`);
        const { data, error } = await (response.json() as Promise<
            ApiResponse<UniswapSwap[]>
        >);

        if (error && shouldRetryError(error)) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return UniswapApiFetcher.getLatestSwaps(pairId);
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
        count = 1000
    ): Promise<ApiResponse<IUniswapPair[]>> {
        if (useOffline) return OfflineFetcher.getTopPairs(count);

        const response = await fetch(`/api/v1/uniswap/pairs?count=${count}`);
        const { data, error } = await (response.json() as Promise<
            ApiResponse<IUniswapPair[]>
        >);

        if (error && shouldRetryError(error)) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return UniswapApiFetcher.getTopPairs(count);
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
        pairId: string,
        startDate: Date,
        endDate = new Date()
    ): Promise<ApiResponse<UniswapDailyData[]>> {
        if (useOffline)
            return OfflineFetcher.getHistoricalDailyData(
                pairId,
                startDate,
                endDate
            );

        const response = await fetch(
            `/api/v1/uniswap/pairs/${pairId}/historical/daily?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
        );
        const { data, error } = await (response.json() as Promise<
            ApiResponse<UniswapDailyData[]>
        >);

        if (error && shouldRetryError(error)) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return UniswapApiFetcher.getHistoricalDailyData(
                pairId,
                startDate,
                endDate
            );
        }

        return { data, error };
    }

    static async getHistoricalHourlyData(
        pairId: string,
        startDate: Date,
        endDate = new Date()
    ): Promise<ApiResponse<UniswapHourlyData[]>> {
        if (useOffline)
            return OfflineFetcher.getHistoricalHourlyData(
                pairId,
                startDate,
                endDate
            );

        const response = await fetch(
            `/api/v1/uniswap/pairs/${pairId}/historical/hourly?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
        );
        const { data, error } = await (response.json() as Promise<
            ApiResponse<UniswapHourlyData[]>
        >);

        if (error && shouldRetryError(error)) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return UniswapApiFetcher.getHistoricalHourlyData(
                pairId,
                startDate,
                endDate
            );
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
