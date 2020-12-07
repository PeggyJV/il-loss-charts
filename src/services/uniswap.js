import { ApolloClient, InMemoryCache, gql } from '@apollo/client';
import BigNumber from 'bignumber.js';

export default class UniswapFetcher {
    static FEE_RATIO = 0.003;

    static client = new ApolloClient({
        uri: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2',
        cache: new InMemoryCache()
    });

    static async getPairOverview(pairId) {
        const response = await UniswapFetcher.client
            .query({
                query: gql`
                    {
                        pair(id: "${pairId}"){
                            token0 {
                                id
                                name
                                symbol
                                decimals
                                derivedETH
                                tradeVolumeUSD
                                totalLiquidity
                            }
                            token1 {
                                id
                                symbol
                                name
                                decimals
                                derivedETH
                                tradeVolumeUSD
                                totalLiquidity
                            }
                            reserve0
                            reserve1
                            reserveUSD
                            trackedReserveETH
                            token0Price
                            token1Price
                            volumeUSD
                            txCount
                            createdAtTimestamp
                        }
                    }
                `
            });

        const { pair } = response?.data;

        if (pair == null) {
            throw new Error(`Could not fetch pair with ID ${pairId}. Error from response: ${response.error}`);
        }

        const feesUSD = new BigNumber(pair.volumeUSD, 10).times(UniswapFetcher.FEE_RATIO).toString();

        return { ...pair, feesUSD };
    }

    static async getTopPairs(count = 1000) {
        const response = await UniswapFetcher.client
            .query({
                query: gql`
                    {
                        pairs(first: ${count}, orderBy: volumeUSD, orderDirection: desc) {
                            id
                            token0 {
                                id
                                name
                                symbol
                            }
                            token1 {
                                id
                                name
                                symbol
                            }

                        }
                    }
                `
            });

        const { pairs } = response?.data;

        if (pairs == null || pairs.length === 0) {
            throw new Error(`Could not fetch top pairs. Error from response: ${response.error}`);
        }

        return pairs;
    }

    static async getHistoricalDailyData(pairId, startDate) {
        const response = await UniswapFetcher.client
            .query({
                query: gql`
                    {
                        pairDayDatas(orderBy: date, orderDirection: asc,
                            where: {
                                pairAddress: "${pairId}",
                                date_gt: "${Math.floor(startDate.getTime / 1000)}"
                            }
                        ) {
                            id
                            date
                            priceUSD
                            totalLiquidityToken
                            totalLiquidityUSD
                            totalLiquidityETH
                            dailyVolumeETH
                            dailyVolumeToken
                            dailyVolumeUSD
                        }
                   }
                `
            });

        const { pairs } = response?.data;

        if (pairs == null || pairs.length === 0) {
            throw new Error(`Could not fetch top pairs. Error from response: ${response.error}`);
        }

        return pairs;
    }
}