import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, CardDeck } from 'react-bootstrap';
import BigNumber from 'bignumber.js';
import PropTypes from 'prop-types';

import { UniswapPair, MarketStats } from '@sommelier/shared-types';

import { Pair, DailyData, LPStats } from 'constants/prop-types';

import { resolveLogo } from 'components/token-with-logo';

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

PercentChangeStat.propTypes = { value: PropTypes.instanceOf(BigNumber) };

function TopPairsWidget({
    topPairs,
    mode,
    handleAddLiquidity,
}: {
    topPairs: MarketStats[];
    mode: 'daily' | 'weekly';
    handleAddLiquidity: (pairId: MarketStats) => void;
}): JSX.Element {
    const multiplier = mode === 'daily' ? 365 : 52;

    return (
        <>
            <div className='pool-stats-container'>
                <CardDeck>
                    {topPairs
                        .slice(0, 10)
                        .map((pairStats: MarketStats, index) => (
                            <Card
                                key={index}
                                style={{
                                    width: '15em',
                                    minWidth: '15em',
                                    maxWidth: '15em',
                                    marginBottom: '1em',
                                }}
                                body
                            >
                                <Card.Title>{formatPair(pairStats)}</Card.Title>
                                <Card.Text className='annualized-apy-card-text'>
                                    <strong>
                                        <PercentChangeStat
                                            value={
                                                pairStats.pctReturn * multiplier
                                            }
                                        />{' '}
                                        Annualized APY
                                    </strong>
                                </Card.Text>
                                <Card.Text>
                                    <PercentChangeStat
                                        value={pairStats.pctReturn}
                                    />{' '}
                                    {mode === 'daily' ? '24h' : '7d'} return
                                </Card.Text>
                                <Button
                                    variant='success'
                                    size='sm'
                                    onClick={() => {
                                        handleAddLiquidity(pairStats);
                                    }}
                                >
                                    Add Liquidity
                                </Button>
                            </Card>
                        ))}
                </CardDeck>
            </div>
        </>
    );
}

TopPairsWidget.propTypes = {
    allPairs: PropTypes.shape({
        lookups: PropTypes.object.isRequired,
    }),
    lpInfo: PropTypes.shape({
        pairData: Pair.isRequired,
        historicalData: PropTypes.arrayOf(DailyData),
    }),
    lpStats: LPStats,
};

export default TopPairsWidget;
