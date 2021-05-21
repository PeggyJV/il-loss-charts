import BigNumber from 'bignumber.js';
import PropTypes from 'prop-types';
import { formatUSD } from 'util/formats';

import { PairPricesState, StatsWindow } from 'types/states';
import { Pair, DailyData, LPStats } from 'constants/prop-types';

import { calculateTimeWindowStats } from 'services/calculate-stats';
import { debug } from 'util/debug';

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
    lpInfo,
    defaultWindow = 'total',
    setWindow,
}: {
    lpInfo: PairPricesState;
    defaultWindow?: StatsWindow;
    setWindow: (window: StatsWindow) => void;
}): JSX.Element {
    const trailingStats = calculateTimeWindowStats(lpInfo, defaultWindow);
    const stats =
        defaultWindow === 'total'
            ? trailingStats.totalStats
            : trailingStats.lastPeriodStats;

    debug.poolStats = stats;

    const handleSetWindow = (selectedWindow: StatsWindow) => {
        // Reset to total if already clicked
        if (defaultWindow === selectedWindow) setWindow('total');
        else setWindow(selectedWindow);
    };

    const volume = stats?.volumeUSD?.toFixed(4);
    const liquidity = stats?.liquidityUSD?.toFixed(4);
    const fees = stats?.feesUSD?.toFixed(4);

    if (!volume || !liquidity || !fees) throw new Error(`Passed value`);
    const volumeValue = formatUSD(volume);
    const liquidityValue = formatUSD(liquidity);
    const feesValue = formatUSD(fees);

    return (
        <div className='pair-volume-liquidity-stats'>
            <div>
                <button
                    className='window-button'
                    onClick={() => handleSetWindow('day')}
                >
                    24H
                </button>

                <button
                    className='window-button'
                    onClick={() => handleSetWindow('week')}
                >
                    7D
                </button>
                <button
                    className='window-button'
                    onClick={() => handleSetWindow('total')}
                >
                    All
                </button>
            </div>
            <div>
                <table>
                    <tr>
                        <td>{'Volume'}</td>
                        <td>{volumeValue}</td>
                        <td>
                            {stats?.volumeUSDChange && (
                                <PercentChangeStat
                                    value={stats?.volumeUSDChange?.times(100)}
                                />
                            )}
                        </td>
                    </tr>
                    <tr>
                        <td>Liquidity</td>
                        <td>{liquidityValue}</td>
                        <td>
                            {stats?.liquidityUSDChange && (
                                <PercentChangeStat
                                    value={stats?.liquidityUSDChange?.times(
                                        100,
                                    )}
                                />
                            )}
                        </td>
                    </tr>
                    <tr>
                        <td>{'Fees'}</td>
                        <td>{feesValue}</td>
                        <td>
                            {stats?.feesUSDChange && (
                                <PercentChangeStat
                                    value={stats?.feesUSDChange?.times(100)}
                                />
                            )}
                        </td>
                    </tr>
                </table>
            </div>
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
