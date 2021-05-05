/* eslint-disable @typescript-eslint/no-unused-vars */
import {
    MarketStats,
    LPStats,
    IUniswapPair,
    UniswapSwap,
    UniswapMintOrBurn,
    UniswapDailyData,
    UniswapHourlyData,
    LPPositionData,
    NetworkIds
} from '@sommelier/shared-types';

import initialData from 'constants/initialData.json';

type ApiResponse<T> = { data?: T; error?: string };

export class UniswapApiFetcher {
    static async getPairOverview(
        network: NetworkIds,
        pairId: string
    ): Promise<ApiResponse<IUniswapPair>> {
        return Promise.resolve({ data: initialData.pairData as IUniswapPair });
    }

    static async getLatestSwaps(
        network: NetworkIds,
        pairId: string
    ): Promise<ApiResponse<UniswapSwap[]>> {
        return Promise.resolve({ data: initialData.swaps as UniswapSwap[] });
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
        return Promise.resolve({
            data: {
                mints: initialData.mints as UniswapMintOrBurn[],
                burns: initialData.burns as UniswapMintOrBurn[],
                combined: initialData.combined as UniswapMintOrBurn[],
            },
        });
    }

    static async getTopPairs(
        network: NetworkIds,
        count = 1000
    ): Promise<ApiResponse<IUniswapPair[]>> {
        return Promise.resolve({ data: initialData.allPairs as IUniswapPair[] });
    }

    static async getMarketData(
        startDate = '2020-12-01'
    ): Promise<ApiResponse<MarketStats[]>> {
        return Promise.resolve({
            data: initialData.marketData as MarketStats[],
        });
    }

    static async getDailyTopPerformingPairs(): Promise<
        ApiResponse<MarketStats[]>
    > {
        return Promise.resolve({
            data: initialData.dailyTopPairs as MarketStats[],
        });
    }

    static async getWeeklyTopPerformingPairs(): Promise<
        ApiResponse<MarketStats[]>
    > {
        return Promise.resolve({
            data: initialData.weeklyTopPairs as MarketStats[],
        });
    }

    static async getPairStats(
        pairId: string,
        startDate: Date,
        endDate = new Date(),
        lpLiquidityUSD: number
    ): Promise<ApiResponse<LPStats<string>>> {
        const lpStats = initialData.lpStats;
        const loadedLpStats = {
            ...lpStats,
            fullDates: lpStats.fullDates.map((d) => new Date(d))
        };
        return Promise.resolve({
            data: loadedLpStats as LPStats<string>,
        });
    }

    static async getHistoricalDailyData(
        network: NetworkIds,
        pairId: string,
        startDate: Date,
        endDate = new Date()
    ): Promise<ApiResponse<UniswapDailyData[]>> {
        return Promise.resolve({
            data: initialData.historicalDailyData as UniswapDailyData[],
        });
    }

    static async getHistoricalHourlyData(
        network: NetworkIds,
        pairId: string,
        startDate: Date,
        endDate = new Date()
    ): Promise<ApiResponse<UniswapHourlyData[]>> {
        return Promise.resolve({
            data: initialData.historicalHourlyData as UniswapHourlyData[],
        });
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
