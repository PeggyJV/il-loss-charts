export class UniswapApiFetcher {
    static async getPairOverview(pairId) {
        const response = await fetch(`/api/v1/uniswap/pairs/${pairId}`);
        const { data, error } = await response.json();
        return error ? { error } : { data };
    }

    static async getLatestSwaps(pairId) {
        const response = await fetch(`/api/v1/uniswap/pairs/${pairId}/swaps`);
        const { data, error } = await response.json();
        return error ? { error } : { data };
    }

    static async getMintsAndBurns(pairId) {
        const response = await fetch(
            `/api/v1/uniswap/pairs/${pairId}/addremove`
        );
        const { data, error } = await response.json();
        return error ? { error } : { data };
    }

    static async getTopPairs(count = 1000) {
        const response = await fetch(`/api/v1/uniswap/pairs?count=${count}`);
        const { data, error } = await response.json();
        return error ? { error } : { data };
    }

    static async getMarketData(startDate = '2020-12-01') {
        const response = await fetch(
            `/api/v1/uniswap/market?startDate=${startDate}`
        );
        const { data, error } = await response.json();
        return error ? { error } : { data };
    }

    static async getHistoricalDailyData(
        pairId,
        startDate,
        endDate = new Date()
    ) {
        const response = await fetch(
            `/api/v1/uniswap/pairs/${pairId}/historical?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
        );
        const { data, error } = await response.json();
        return error ? { error } : { data };
    }

    static async getPositionStats(address) {
        const response = await fetch(`/api/v1/uniswap/positions/${address}/stats`);
        const { data, error } = await response.json();
        return error ? { error } : { data };
    }
}
