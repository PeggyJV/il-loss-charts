export class UniswapApiFetcher {
    static async getPairOverview(pairId) {
        const response = await fetch(`/api/v1/uniswap/pairs/${pairId}`);
        const { data, errors } = await response.json();
        return errors ? { errors } : { data };
    }

    static async getLatestSwaps(pairId) {
        const response = await fetch(`/api/v1/uniswap/pairs/${pairId}/swaps`);
        const { data, errors } = await response.json();
        return errors ? { errors } : { data };
    }

    static async getMintsAndBurns(pairId) {
        const response = await fetch(
            `/api/v1/uniswap/pairs/${pairId}/addremove`
        );
        const { data, errors } = await response.json();
        return errors ? { errors } : { data };
    }

    static async getTopPairs(count = 1000) {
        const response = await fetch(`/api/v1/uniswap/pairs?count=${count}`);
        const { data, errors } = await response.json();
        return errors ? { errors } : { data };
    }

    static async getMarketData(startDate = '2020-12-01') {
        const response = await fetch(
            `/api/v1/uniswap/market?startDate=${startDate}`
        );
        const { data, errors } = await response.json();
        return errors ? { errors } : { data };
    }

    static async getHistoricalDailyData(
        pairId,
        startDate,
        endDate = new Date()
    ) {
        const response = await fetch(
            `/api/v1/uniswap/pairs/${pairId}/historical?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
        );
        const { data, errors } = await response.json();
        return errors ? { errors } : { data };
    }
}
