import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';

import { LPStats as ILPStats } from '@sommelier/shared-types';

import { LPStats } from 'constants/prop-types';
import { formatUSD } from 'util/formats';

function LPStatsWidget({
    lpStats,
}: {
    lpStats: Partial<ILPStats<string>>;
}): JSX.Element | null {
    if (!lpStats.totalFees) return null;

    const displayValue = (value?: string) => {
        if (!value)
            throw new Error(
                `Could not display nonexist value in LPStatsWidget`,
            );
        return formatUSD(new BigNumber(value).toFixed(3));
    };

    return (
        <div className='pair-volume-liquidity-stats'>
            <table>
                <tbody>
                    <tr>
                        <td className='lp-stats-table-cell label'>Fees</td>
                        <td className='lp-stats-table-cell value'>
                            {displayValue(lpStats.totalFees)}
                        </td>
                    </tr>
                    <tr>
                        <td className='lp-stats-table-cell label'>IL</td>
                        <td className='lp-stats-table-cell value'>
                            {displayValue(lpStats.impermanentLoss)}
                        </td>
                    </tr>
                    <tr>
                        <td className='lp-stats-table-cell label'>NR</td>
                        <td className='lp-stats-table-cell value'>
                            {displayValue(lpStats.totalReturn)}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

LPStatsWidget.propTypes = {
    lpStats: LPStats,
    title: PropTypes.string,
    subtitle: PropTypes.string,
};

export default LPStatsWidget;
