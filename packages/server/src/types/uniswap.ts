export interface LiquidityData {
    reserve0: string;
    reserve1: string;
    reserveUSD: string;
}
export interface Token {
    __typename: 'Token';
    decimals: string;
    derivedETH: string;
    id: string;
    name: string;
    symbol: string;
    totalLiquidity: string;
    tradeVolumeUSD: string;
}

export interface UniswapPair extends LiquidityData {
    __typename: 'Pair';
    createdAtTimestamp: string;
    id: string;
    token0: Token;
    token1: Token;
    token0Price: string;
    token1Price: string;
    trackedReserveETH: string;
    txCount: string;
    volumeUSD: string;
    feesUSD?: string;
}

export interface UniswapDailyData extends LiquidityData {
    __typename: 'PairDayData';
    date: number;
    pairAddress: string;
    dailyVolumeToken0: string;
    dailyVolumeToken1: string;
    dailyVolumeUSD: string;
}

export interface UniswapHourlyData extends LiquidityData {
    __typename: 'PairDayData';
    pair: Partial<UniswapPair>;
    hourStartUnix: number;
    hourlyVolumeToken0: string;
    hourlyVolumeToken1: string;
    hourlyVolumeUSD: string;
}

export interface UniswapSwap {
    __typename: 'Swap';
    amount0In: string;
    amount0Out: string;
    amount1In: string;
    amount1Out: string;
    amountUSD: string;
    to: string;
    pair: Partial<UniswapPair>;
}

export interface UniswapMintOrBurn {
    __typename: 'Mint' | 'Burn';
    amount0: string;
    amount1: string;
    amountUSD: string;
    liquidity: string;
    to: string;
    pair: Partial<UniswapPair>;
    timestamp: string;
}
