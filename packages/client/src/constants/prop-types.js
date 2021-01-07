import PropTypes from 'prop-types';

export const Pair = PropTypes.shape({
    __typename: PropTypes.string,
    decimals: PropTypes.string,
    derivedETH: PropTypes.string,
    id: PropTypes.string,
    name: PropTypes.string,
    symbol: PropTypes.string,
    totalLiquidity: PropTypes.string,
    tradeVolumeUSD: PropTypes.string
})

export const Swap = PropTypes.shape({
    amount0In: PropTypes.string,
    amount0Out: PropTypes.string,
    amount1In: PropTypes.string,
    amount1Out: PropTypes.string,
    amountUSD: PropTypes.string,
    to: PropTypes.string,
    pair: Pair
});

export const DailyData = PropTypes.shape({
    __typename: PropTypes.string,
    date: PropTypes.number,
    pairAddress: PropTypes.string,
    dailyVolumeToken0: PropTypes.string,
    dailyVolumeToken1: PropTypes.string,
    dailyVolumeUSD: PropTypes.string,
});