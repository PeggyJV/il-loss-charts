import BigNumber from 'bignumber.js';

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export interface ILiquidityData {
    reserve0: string;
    reserve1: string;
    reserveUSD: string;
}

export interface IToken {
    __typename: 'Token';
    decimals: string;
    derivedETH: string;
    id: string;
    name: string;
    symbol: string;
    totalLiquidity: string;
    tradeVolumeUSD: string;
}


export interface PairToken {
    __typename: 'Token';
    decimals?: string;
    derivedETH?: string;
    id: string;
    name?: string;
    symbol: string;
    totalLiquidity: string;
    tradeVolumeUSD: string;
}


export interface IUniswapPair extends ILiquidityData {
    __typename: 'Pair';
    createdAtTimestamp: string;
    id: string;
    token0: IToken;
    token1: IToken;
    token0Price: string;
    token1Price: string;
    trackedReserveETH: string;
    txCount: string;
    volumeUSD: string;
    untrackedVolumeUSD: string;
    totalSupply: string;
    feesUSD?: string;
}

export class UniswapPair implements IUniswapPair {
    static STABLECOIN_SYMBOLS = ['USDC', 'USDT', 'DAI'];
    static ETH_SYMBOLS = ['ETH', 'WETH'];

    __typename: 'Pair';
    createdAtTimestamp: string;
    id: string;
    token0: IToken;
    token1: IToken;
    reserve0: string;
    reserve1: string;
    reserveUSD: string;
    token0Price: string;
    token1Price: string;
    trackedReserveETH: string;
    txCount: string;
    volumeUSD: string;
    untrackedVolumeUSD: string;
    totalSupply: string;
    feesUSD?: string;
    
    constructor(pairData: IUniswapPair) {
        this.__typename = pairData.__typename;
        this.createdAtTimestamp = pairData.createdAtTimestamp;
        this.id = pairData.id;
        this.token0 = pairData.token0;
        this.token1 = pairData.token1;
        this.reserve0 = pairData.reserve0;
        this.reserve1 = pairData.reserve1;
        this.reserveUSD = pairData.reserveUSD;
        this.token0Price = pairData.token0Price;
        this.token1Price = pairData.token1Price;
        this.trackedReserveETH = pairData.trackedReserveETH;
        this.txCount = pairData.txCount;
        this.volumeUSD = pairData.volumeUSD;
        this.untrackedVolumeUSD = pairData.untrackedVolumeUSD;
        this.totalSupply = pairData.totalSupply;
        this.feesUSD = pairData.feesUSD;
    }

    get symbols(): string[] {
        if (!this.token0.symbol || !this.token1.symbol) {
            throw new Error('Pair does not have enough data - token symbols missing');
        }

        return [this.token0.symbol, this.token1.symbol];
    }

    get pairReadable(): string {
        return this.symbols.join('/');
    }

    get isStablecoinPair(): boolean {
        return this.symbols.some((symbol) => UniswapPair.STABLECOIN_SYMBOLS.includes(symbol));
    }

    get isEthPair(): boolean {
        return this.symbols.some((symbol) => UniswapPair.ETH_SYMBOLS.includes(symbol));
    }

    get isFloatingPair(): boolean {
        return this.isEthPair && !this.isStablecoinPair;
    }

    get exchangeRate(): BigNumber {
        const reserve0 = new BigNumber(this.reserve0);

        if (reserve0.eq(0)) {
            return new BigNumber(1);
        }

        return reserve0.div(this.reserve1);
    }
}