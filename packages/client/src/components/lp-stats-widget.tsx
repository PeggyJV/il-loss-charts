import PropTypes from 'prop-types';
import { Card, Table } from 'react-bootstrap';
import BigNumber from 'bignumber.js';

import { LPStats as ILPStats } from '@sommelier/shared-types';

import { LPStats } from 'constants/prop-types';
import { formatUSD } from 'util/formats';

function LPStatsWidget({
    lpStats,
    title,
}: {
    lpStats: Partial<ILPStats>;
    title?: string;
}): JSX.Element | null {
    if (!lpStats.totalFees) return null;

    const displayValue = (value?: BigNumber) => {
        if (!value)
            throw new Error(
                `Could not display nonexist value in LPStatsWidget`
            );
        return formatUSD(value.toFixed(3));
    };

    return (
        <Card className='lp-stats-card'>
            <Card.Body className='lp-stats-widget'>
                {title && <p>{title}</p>}
                <Table borderless className='lp-stats-table'>
                    <tbody>
                        <tr>
                            <td className='lp-stats-table-cell label'>
                                Fees Collected
                            </td>
                            <td className='lp-stats-table-cell value'>
                                {displayValue(lpStats.totalFees)}
                            </td>
                        </tr>
                        <tr>
                            <td className='lp-stats-table-cell label'>
                                Impermanent Loss
                            </td>
                            <td className='lp-stats-table-cell value'>
                                {displayValue(lpStats.impermanentLoss)}
                            </td>
                        </tr>
                        <tr>
                            <td className='lp-stats-table-cell label'>
                                <strong>Total Return</strong>
                            </td>
                            <td className='lp-stats-table-cell value'>
                                <strong>
                                    {displayValue(lpStats.totalReturn)}
                                </strong>
                            </td>
                        </tr>
                    </tbody>
                </Table>
            </Card.Body>
        </Card>
    );
}

LPStatsWidget.propTypes = { lpStats: LPStats, title: PropTypes.string };

export default LPStatsWidget;
