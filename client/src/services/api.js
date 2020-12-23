
export class UniswapApiFetcher {
    static async getPairOverview(pairId) {
        const response = await fetch(`api/v1/uniswap/pairs/${pairId}`);
        const { data } = await response.json();
        return data;
    }

    static async getLatestSwaps(pairId) {
        const response = await fetch(`api/v1/uniswap/pairs/${pairId}/swaps`);
        const { data } = await response.json();
        return data;
    }


    static async getTopPairs(count = 1000) {
        const response = await fetch(`api/v1/uniswap/pairs?count=${count}`);
        const { data } = await response.json();
        return data;
    }

    static async getHistoricalDailyData(pairId, startDate, endDate = new Date()) {
        const response = await fetch(`api/v1/uniswap/historical/${pairId}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
        const { data } = await response.json();
        return data;
    }
}