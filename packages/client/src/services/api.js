export class UniswapApiFetcher {
    static async getPairOverview(pairId) {
        const response = await fetch(`/api/v1/uniswap/pairs/${pairId}`);
        const { data } = await response.json();
        return data;
    }

    static async getLatestSwaps(pairId) {
        const response = await fetch(`/api/v1/uniswap/pairs/${pairId}/swaps`);
        const { data } = await response.json();
        return data;
    }

    static async getMintsAndBurns(pairId) {
        const response = await fetch(
            `/api/v1/uniswap/pairs/${pairId}/addremove`
        );
        const { data } = await response.json();
        return data;
    }

    static async getTopPairs(count = 1000) {
        const response = await fetch(`/api/v1/uniswap/pairs?count=${count}`);
        const { data } = await response.json();
        return data;
    }

    static async getMarketData(startDate = '2020-12-01') {
        const response = await fetch(
            `/api/v1/uniswap/market?startDate=${startDate}`
        );
        const { data } = await response.json();
        return data;
    }

    static async getHistoricalDailyData(
        pairId,
        startDate,
        endDate = new Date()
    ) {
        const response = await fetch(
            `/api/v1/uniswap/pairs/${pairId}/historical?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
        );
        const { data } = await response.json();
        return data;
    }
}
