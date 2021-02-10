import { Button, Card } from 'react-bootstrap';
import BigNumber from 'bignumber.js';
import PropTypes from 'prop-types';

import { AllPairsState, LPInfoState, StatsWindow } from 'types/states';
import { Pair, DailyData, LPStats } from 'constants/prop-types';
import USDValueWidget from 'components/usd-value-widget';

import { calculateTimeWindowStats } from 'services/calculate-stats';

function PercentChangeStat({ value }: { value?: BigNumber }) {
    if (!value) throw new Error('Passed falsy value to PercentChangeStat');

    const sign = value.isPositive() ? '↗' : '↘';
    const className = value.isPositive() ? 'pct-change-up' : 'pct-change-down';
    const valStr = value.isNaN()
        ? new BigNumber(100).toFixed(2)
        : value.toFixed(2);

    return (
        <span className={className}>
            {valStr}% {sign}
        </span>
    );
}

PercentChangeStat.propTypes = { value: PropTypes.instanceOf(BigNumber) };

function TotalPoolStats({
    allPairs,
    lpInfo,
    defaultWindow = 'total',
    setWindow,
}: {
    allPairs: AllPairsState;
    lpInfo: LPInfoState;
    defaultWindow?: StatsWindow;
    setWindow: (window: StatsWindow) => void;
}): JSX.Element {
    const dataPeriod = defaultWindow === 'total' ? 'daily' : 'hourly';
    const trailingStats = calculateTimeWindowStats(
        lpInfo,
        dataPeriod,
        defaultWindow
    );
    const stats =
        defaultWindow === 'total'
            ? trailingStats.totalStats
            : trailingStats.lastPeriodStats;

    (window as any).poolStats = stats;

    const handleSetWindow = (selectedWindow: StatsWindow) => {
        // Reset to total if already clicked
        if (defaultWindow === selectedWindow) setWindow('total');
        else setWindow(selectedWindow);
    };

    const prefix =
        defaultWindow === 'day' ? '24h' : defaultWindow === 'week' ? '7d' : '';

    return (
        <div className='pool-stats-container'>
            {/* <CardDeck> */}
            <USDValueWidget
                title={`${prefix} USD Volume`}
                badge={`#${
                    allPairs?.lookups?.[lpInfo.pairData.id]?.volumeRanking || ''
                }`}
                value={stats?.volumeUSD?.toFixed(4)}
                footnote={
                    stats?.volumeUSDChange && (
                        <PercentChangeStat
                            value={stats?.volumeUSDChange?.times(100)}
                        />
                    )
                }
            />
            <USDValueWidget
                title={'Total Liquidity'}
                badge={`#${
                    allPairs?.lookups?.[lpInfo.pairData.id]?.liquidityRanking ||
                    ''
                }`}
                value={stats?.liquidityUSD?.toFixed(4)}
                footnote={
                    stats?.liquidityUSDChange && (
                        <PercentChangeStat
                            value={stats?.liquidityUSDChange?.times(100)}
                        />
                    )
                }
            />
            <USDValueWidget
                title={`${prefix} Fees Collected`}
                badge={`#${
                    allPairs?.lookups?.[lpInfo.pairData.id]?.volumeRanking || ''
                }`}
                value={stats?.feesUSD?.toFixed(4)}
                footnote={
                    stats?.feesUSDChange && (
                        <PercentChangeStat
                            value={stats?.feesUSDChange?.times(100)}
                        />
                    )
                }
            />
            <Card className='stats-card window-button-card no-border' body>
                <Button
                    variant={
                        defaultWindow === 'day' ? 'primary' : 'outline-primary'
                    }
                    size='sm'
                    className='window-button'
                    onClick={() => handleSetWindow('day')}
                >
                    24H
                </Button>
                <Button
                    variant={
                        defaultWindow === 'week' ? 'primary' : 'outline-primary'
                    }
                    size='sm'
                    className='window-button'
                    onClick={() => handleSetWindow('week')}
                >
                    7D
                </Button>
            </Card>
            {/* </CardDeck> */}
        </div>
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
