import PropTypes from 'prop-types';
import { Card, Table } from 'react-bootstrap';
import { LPStats } from 'constants/prop-types';

const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',

    // These options are needed to round to whole numbers if that's what you want.
    //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
    //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
});

function LPStatsWidget({ lpStats, title }) {
    if (!lpStats.totalFees) return null;

    const displayValue = (value) => {
        const intVal = parseInt(value, 10);
        if (Number.isNaN(intVal)) {
            throw new Error(
                `Could not parse value for LP stats widget: ${value}`
            );
        }

        return formatter.format(intVal);
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
