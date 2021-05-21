import BigNumber from 'bignumber.js';

export function convertSqrtPriceX96(sqrtPriceX96: number): BigNumber {
    return new BigNumber(sqrtPriceX96)
        .dividedBy(new BigNumber(2).pow(96))
        .pow(2);
}
