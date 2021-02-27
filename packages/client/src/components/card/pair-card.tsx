import './pair-card.scss';
import { Link } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import BigNumber from 'bignumber.js';
import PropTypes from 'prop-types';
import { resolveLogo } from 'components/token-with-logo';
import { UniswapPair, MarketStats } from '@sommelier/shared-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRetweet } from '@fortawesome/free-solid-svg-icons';

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
        <>
            <div>
                {resolveLogo(token0.id)} {token0.symbol}
            </div>
            <div>
                <FontAwesomeIcon icon={faRetweet} />
            </div>
            {/* <Link to={`/pair?id=${id}&timeWindow=day`}> */}
            {/* </Link> */}
            <div>
                {resolveLogo(token1.id)} {token1.symbol}
            </div>
        </>
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
            <div className='pair-combo'>{formatPair(pairStats)}</div>
            <div className='stats-and-ape'>
                <div className='pair-returns'>
                    <div className='apy'>
                            <PercentChangeStat
                                value={pairStats.pctReturn * multiplier}
                            />{' '}
                            APY
                    </div>
                    <div className='pct-return'>
                        <PercentChangeStat value={pairStats.pctReturn} />{' '}
                        <span className='return-duration'>
                            {mode === 'daily' ? '24h' : '7d'} return
                        </span>
                    </div>
                </div>
                <button
                    className='btn-ape'
                    onClick={() => {
                        handleAddLiquidity(pairStats);
                    }}
                >
                    Add Liquidity
                </button>
            </div>
        </div>
    );
};
