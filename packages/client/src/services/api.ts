import {
    MarketStats,
    UniswapPair,
    UniswapSwap,
    UniswapMintOrBurn,
    UniswapDailyData,
    UniswapHourlyData,
    LPPositionData,
} from '@sommelier/shared-types';

import { IError } from 'types/states';

type ApiResponse<T> = { data?: T; error?: IError };

export class UniswapApiFetcher {
    static async getPairOverview(
        pairId: string
    ): Promise<ApiResponse<UniswapPair>> {
        const response = await fetch(`/api/v1/uniswap/pairs/${pairId}`);
        const { data, error } = await (response.json() as Promise<
            ApiResponse<UniswapPair>
        >);
        return { data, error };
    }

    static async getLatestSwaps(
        pairId: string
    ): Promise<ApiResponse<UniswapSwap[]>> {
        const response = await fetch(`/api/v1/uniswap/pairs/${pairId}/swaps`);
        const { data, error } = await (response.json() as Promise<
            ApiResponse<UniswapSwap[]>
        >);
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
        const response = await fetch(
            `/api/v1/uniswap/pairs/${pairId}/addremove`
        );
        const { data, error } = await response.json();
        return { data, error };
    }

    static async getTopPairs(
        count = 1000
    ): Promise<ApiResponse<UniswapPair[]>> {
        const response = await fetch(`/api/v1/uniswap/pairs?count=${count}`);
        const { data, error } = await (response.json() as Promise<
            ApiResponse<UniswapPair[]>
        >);
        return { data, error };
    }

    static async getMarketData(
        startDate = '2020-12-01'
    ): Promise<ApiResponse<MarketStats[]>> {
        const response = await fetch(
            `/api/v1/uniswap/market?startDate=${startDate}`
        );
        const { data, error } = await (response.json() as Promise<
            ApiResponse<MarketStats[]>
        >);
        return { data, error };
    }

    static async getTopPerformingPairs(): Promise<ApiResponse<MarketStats[]>> {
        const response = await fetch(`/api/v1/uniswap/pairs/performance`);
        const { data, error } = await (response.json() as Promise<
            ApiResponse<MarketStats[]>
        >);
        return { data, error };
    }

    static async getHistoricalDailyData(
        pairId: string,
        startDate: Date,
        endDate = new Date()
    ): Promise<ApiResponse<UniswapDailyData[]>> {
        const response = await fetch(
            `/api/v1/uniswap/pairs/${pairId}/historical/daily?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
        );
        const { data, error } = await (response.json() as Promise<
            ApiResponse<UniswapDailyData[]>
        >);
        return { data, error };
    }

    static async getHistoricalHourlyData(
        pairId: string,
        startDate: Date,
        endDate = new Date()
    ): Promise<ApiResponse<UniswapHourlyData[]>> {
        const response = await fetch(
            `/api/v1/uniswap/pairs/${pairId}/historical/hourly?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
        );
        const { data, error } = await (response.json() as Promise<
            ApiResponse<UniswapHourlyData[]>
        >);
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
        return { data, error };
    }
}
