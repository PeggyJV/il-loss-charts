import { Token } from "graphql";

interface Token {
    __typename: 'Token';
    decimals: string;
    derivedETH: string;
    id: string;
    name: string;
    symbol: string;
    totalLiquidity: string;
    tradeVolumeUSD: string;
}

interface UniswapPair {
    __typename: 'Pair';
    createdAtTimestamp: string;
    id: string;
    reserve0: string;
    reserve1: string;
    reserveUSD: string;
    token0: Token;
    token1: Token;
    token0Price: string;
    token1Price: string;
    trackedReserveETH: string;
    txCount: string;
    volumeUSD: string;
    feesUSD?: string;
}
