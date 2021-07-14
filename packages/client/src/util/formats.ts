import { PoolLike } from '@sommelier/shared-types/src/api';

const usdFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',

    // These options are needed to round to whole numbers if that's what you want.
    //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
    //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
});

const percentFormatter = new Intl.NumberFormat('en-US', {
    style: 'unit',
    unit: 'percent',
});

export const formatUSD = (val: string | number): string =>
    !val ? '-' : usdFormatter.format(parseFloat(val.toString()));

export const formatPercent = (val: string | number): string =>
    !val ? '-' : percentFormatter.format(parseFloat(val.toString()));

export const formatAddress = (val: string): string => {
    return `${val.substring(0, 6)}...${val.substring(val.length - 5)}`;
};
export const compactHash = (val = ''): string => {
    if (val.length !== 66) {
        return val.substring(0, 6).concat('... ');
    }
    return val.substring(0, 6).concat('...').concat(val.substring(62));
};

export const poolSymbol = (pool: PoolLike, separator = ' '): string => {
    if (!pool || !pool.token0 || !pool.token1) return '';

    return `${pool.token0.symbol}${separator}${pool.token1.symbol}`;
};
export type { PoolLike };
