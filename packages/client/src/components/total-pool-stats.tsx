import { useState } from 'react';
import { Button, Card } from 'react-bootstrap';
import BigNumber from 'bignumber.js';
import PropTypes from 'prop-types';

import { UniswapPair, UniswapDailyData, LPStats as ILPStats } from '@sommelier/shared-types';

import { AllPairsState, LPInfoState } from 'types/states';
import { Pair, DailyData, LPStats } from 'constants/prop-types';
import USDValueWidget from 'components/usd-value-widget';

function PercentChangeStat({ value }: { value?: BigNumber }) {
    if (!value) throw new Error('Passed falsy value to PercentChangeStat');

    const sign = value.isPositive() ? '↗' : '↘';
    const className = value.isPositive() ? 'pct-change-up' : 'pct-change-down';

    return (
        <span className={className}>
            {value.toFixed(2)}% {sign}
        </span>
    );
}

PercentChangeStat.propTypes = { value: PropTypes.instanceOf(BigNumber) };

type StatsWindow = 'total' | 'day' | 'week';

function TotalPoolStats({ allPairs, lpInfo, lpStats }: {
    allPairs: AllPairsState,
    lpInfo: LPInfoState,
    lpStats: ILPStats
}) {
    const [window, setWindow] = useState<StatsWindow>('total');

    const { totalStats, lastDayStats, lastWeekStats } = lpStats;

    let stats;
    if (window === 'total') {
        stats = totalStats;
    } else if (window === 'day') {
        stats = lastDayStats;
    } else if (window === 'week') {
        stats = lastWeekStats;
    } else {
        throw new Error('Unknown stats window');
    }

    const handleSetWindow = (selectedWindow: StatsWindow) => {
        // Reset to total if already clicked
        if (window === selectedWindow) setWindow('total');
        else setWindow(selectedWindow);
    };

    const prefix = window === 'day' ? '24h' : window === 'week' ? '7d' : '';

    return (
        <div className='pool-stats-container'>
            {/* <CardDeck> */}
            <USDValueWidget
                title={`${prefix} USD Volume`}
                badge={`#${allPairs?.lookups?.[lpInfo.pairData.id]?.volumeRanking || ''}`}
                value={stats?.volumeUSD?.toFixed(4)}
                footnote={
                    window !== 'total' && (
                        <PercentChangeStat
                            value={stats?.volumeUSDChange?.times(100)}
                        />
                    )
                }
            />
            <USDValueWidget
                title={'Total Liquidity'}
                badge={`#${allPairs?.lookups?.[lpInfo.pairData.id]?.liquidityRanking || ''}`}
                value={stats?.liquidityUSD?.toFixed(4)}
                footnote={
                    window !== 'total' && (
                        <PercentChangeStat
                            value={stats?.liquidityUSDChange?.times(100)}
                        />
                    )
                }
            />
            <USDValueWidget
                title={`${prefix} Fees Collected`}
                badge={`#${allPairs?.lookups?.[lpInfo.pairData.id]?.volumeRanking || ''}`}
                value={stats?.feesUSD?.toFixed(4)}
                footnote={
                    window !== 'total' && (
                        <PercentChangeStat
                            value={stats?.feesUSDChange?.times(100)}
                        />
                    )
                }
            />
            <Card className='stats-card window-button-card no-border' body>
                <Button
                    variant={window === 'day' ? 'primary' : 'outline-primary'}
                    size='sm'
                    className='window-button'
                    onClick={() => handleSetWindow('day')}
                >
                    24H
                    </Button>
                <Button
                    variant={window === 'week' ? 'primary' : 'outline-primary'}
                    size='sm'
                    className='window-button'
                    onClick={() => handleSetWindow('week')}
                >
                    7D
                    </Button>
            </Card>
            {/* </CardDeck> */}
        </div >
    );
}

TotalPoolStats.propTypes = {
    allPairs: PropTypes.shape({
        lookups: PropTypes.object.isRequired,
    }),
    lpInfo: PropTypes.shape({
        pairData: Pair.isRequired,
        historicalData: PropTypes.arrayOf(DailyData),
    }),
    lpStats: LPStats,
};

export default TotalPoolStats;
