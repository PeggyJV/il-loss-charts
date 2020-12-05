import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

export default class UniswapFetcher {
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
                        }
                    }
                `
            });

        const { pair } = response?.data;

        if (pair == null) {
            throw new Error(`Could not fetch pair with ID ${pairId}. Error from response: ${response.error}`);
        }

        return pair;
    }
}