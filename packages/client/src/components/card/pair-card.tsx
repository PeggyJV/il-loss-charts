import './pair-card.scss';
import { Link } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import BigNumber from 'bignumber.js';
import PropTypes from 'prop-types';
import { resolveLogo } from 'components/token-with-logo';
import { UniswapPair, MarketStats } from '@sommelier/shared-types';


PercentChangeStat.propTypes = { value: PropTypes.instanceOf(BigNumber) };

function PercentChangeStat({ value }: { value?: number }): JSX.Element {
    if (value == null) {
        throw new Error('Passed falsy value to PercentChangeStat');
    }

    const valueBn = new BigNumber(value);
    const className = valueBn.isPositive()
        ? 'pct-change-up'
        : 'pct-change-down';

    return <span className={className}>{valueBn.times(100).toFixed(2)}%</span>;
}

const formatPair = ({ id, token0, token1 }: UniswapPair) => {
    return (
        <span>
            {resolveLogo(token0.id)}{' '}
            <span className='market-data-pair-span'>
                <Link to={`/pair?id=${id}&timeWindow=day`}>
                    {token0.symbol}/{token1.symbol}
                </Link>
            </span>{' '}
            {resolveLogo(token1.id)}
        </span>
    );
};

export const PairCard = ({
    pairStats,
    mode,
    handleAddLiquidity,
}: {
    pairStats: MarketStats;
    mode: 'daily' | 'weekly';
    handleAddLiquidity: (pairId: MarketStats) => void;
}): JSX.Element => {
    const multiplier = mode === 'daily' ? 365 : 52;

    return (
        <div className='pair-card'>
            <div>{formatPair(pairStats)}</div>
            <div>
                <strong>
                    <PercentChangeStat
                        value={pairStats.pctReturn * multiplier}
                    />{' '}
                    APY
                </strong>
            </div>
            <div>
                <PercentChangeStat value={pairStats.pctReturn} />{' '}
                {mode === 'daily' ? '24h' : '7d'} return
            </div>
            <Button
                variant='success'
                size='sm'
                onClick={() => {
                    handleAddLiquidity(pairStats);
                }}
            >
                Add Liquidity
            </Button>
        </div>
    );
};
