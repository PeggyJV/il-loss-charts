import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';

export const Pair = PropTypes.shape({
    __typename: PropTypes.string,
    decimals: PropTypes.string,
    derivedETH: PropTypes.string,
    id: PropTypes.string,
    name: PropTypes.string,
    symbol: PropTypes.string,
    totalLiquidity: PropTypes.string,
    tradeVolumeUSD: PropTypes.string,
});

export const Swap = PropTypes.shape({
    amount0In: PropTypes.string,
    amount0Out: PropTypes.string,
    amount1In: PropTypes.string,
    amount1Out: PropTypes.string,
    amountUSD: PropTypes.string,
    to: PropTypes.string,
    pair: Pair,
});

export const DailyData = PropTypes.shape({
    __typename: PropTypes.string,
    date: PropTypes.number,
    pairAddress: PropTypes.string,
    dailyVolumeToken0: PropTypes.string,
    dailyVolumeToken1: PropTypes.string,
    dailyVolumeUSD: PropTypes.string,
});

export const HourlyData = PropTypes.shape({
    __typename: PropTypes.string,
    date: PropTypes.number,
    pairAddress: PropTypes.string,
    dailyVolumeToken0: PropTypes.string,
    dailyVolumeToken1: PropTypes.string,
    dailyVolumeUSD: PropTypes.string,
    pair: Pair,
});

export const MintOrBurn = PropTypes.shape({
    __typename: PropTypes.string,
    amount0: PropTypes.string,
    amount1: PropTypes.string,
    amountUSD: PropTypes.string,
    liquidity: PropTypes.string,
    to: PropTypes.string,
    pair: Pair,
    timestamp: PropTypes.string,
});

export const LPStats = PropTypes.shape({
    totalFees: PropTypes.instanceOf(BigNumber).isRequired,
    runningVolume: PropTypes.arrayOf(PropTypes.instanceOf(BigNumber))
        .isRequired,
    runningFees: PropTypes.arrayOf(PropTypes.instanceOf(BigNumber)).isRequired,
    runningImpermanentLoss: PropTypes.arrayOf(PropTypes.instanceOf(BigNumber))
        .isRequired,
    runningReturn: PropTypes.arrayOf(PropTypes.instanceOf(BigNumber))
        .isRequired,
    impermanentLoss: PropTypes.instanceOf(BigNumber).isRequired,
    totalReturn: PropTypes.instanceOf(BigNumber).isRequired,
    ticks: PropTypes.arrayOf(PropTypes.string).isRequired,
    fullDates: PropTypes.arrayOf(PropTypes.instanceOf(Date)).isRequired,
});

export const MarketData = PropTypes.shape({
    ilGross: PropTypes.number.isRequired,
    market: PropTypes.string.isRequired,
    impermanentLoss: PropTypes.number.isRequired,
    volume: PropTypes.number.isRequired,
    liquidity: PropTypes.number.isRequired,
    returnsUSD: PropTypes.number.isRequired,
    returnsETH: PropTypes.number.isRequired,
    pctReturn: PropTypes.number.isRequired,
});

export const PositionData = PropTypes.shape({
    liquidityPosition: PropTypes.shape({
        id: PropTypes.string,
        liquidityTokenBalance: PropTypes.string,
    }),
    liquidityTokenBalance: PropTypes.string,
    liquidityTokenTotalSupply: PropTypes.string,
    pair: Pair,
    timestamp: PropTypes.number,
});
