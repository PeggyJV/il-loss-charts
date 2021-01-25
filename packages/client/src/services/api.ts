import {
    MarketStats,
    UniswapPair,
    UniswapSwap,
    UniswapMintOrBurn,
    UniswapDailyData,
    LPPositionData
} from '@sommelier/shared-types';

type ApiError = { message: string };
type ApiResponse<T> = { data: T, error: ApiError };
type ApiReturnVal<T> = { data: T } | { error: ApiError };


export class UniswapApiFetcher {
    static async getPairOverview(pairId: string): Promise<ApiReturnVal<UniswapPair>> {
        const response = await fetch(`/api/v1/uniswap/pairs/${pairId}`);
        const { data, error } = await (response.json() as Promise<ApiResponse<UniswapPair>>);
        return error ? { error } : { data };
    }

    static async getLatestSwaps(pairId: string): Promise<ApiReturnVal<UniswapSwap[]>> {
        const response = await fetch(`/api/v1/uniswap/pairs/${pairId}/swaps`);
        const { data, error } = await (response.json() as Promise<ApiResponse<UniswapSwap[]>>);
        return error ? { error } : { data };
    }

    static async getMintsAndBurns(pairId: string): Promise<ApiReturnVal<UniswapMintOrBurn[]>> {
        const response = await fetch(
            `/api/v1/uniswap/pairs/${pairId}/addremove`
        );
        const { data, error } = await response.json();
        return error ? { error } : { data };
    }

    static async getTopPairs(count = 1000): Promise<ApiReturnVal<UniswapPair[]>> {
        const response = await fetch(`/api/v1/uniswap/pairs?count=${count}`);
        const { data, error } = await (response.json() as Promise<ApiResponse<UniswapPair[]>>);
        return error ? { error } : { data };
    }

    static async getMarketData(startDate = '2020-12-01'): Promise<ApiReturnVal<MarketStats[]>> {
        const response = await fetch(
            `/api/v1/uniswap/market?startDate=${startDate}`
        );
        const { data, error } = await (response.json() as Promise<ApiResponse<MarketStats[]>>);
        return error ? { error } : { data };
    }

    static async getHistoricalDailyData(
        pairId: string,
        startDate: Date,
        endDate = new Date()
    ): Promise<ApiReturnVal<UniswapDailyData[]>> {
        const response = await fetch(
            `/api/v1/uniswap/pairs/${pairId}/historical?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
        );
        const { data, error } = await (response.json() as Promise<ApiResponse<UniswapDailyData[]>>);
        return error ? { error } : { data };
    }

    static async getPositionStats(address: string): Promise<ApiReturnVal<LPPositionData>> {
        const response = await fetch(`/api/v1/uniswap/positions/${address}/stats`);
        const { data, error } = await (response.json() as Promise<ApiResponse<LPPositionData>>);
        return error ? { error } : { data };
    }
}
