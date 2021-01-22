import BootstrapTable from 'react-bootstrap-table-next';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';

import { PositionData, LPStats, DailyData, HourlyData } from 'constants/prop-types';
import { formatUSD } from 'util/formats';
import { resolveLogo } from 'components/token-with-logo';


function PositionsTable({ positionData: { positions, stats }, pairId, setPairId }) {
    const tableData = Object.entries(positions).map(([pairId, positionSnapshots], index) => {
        const mostRecentPosition = positionSnapshots[positionSnapshots.length - 1];
        const { pair, liquidityTokenBalance, liquidityTokenTotalSupply, reserveUSD } = mostRecentPosition;

        const liquidity = new BigNumber(liquidityTokenBalance)
            .div(liquidityTokenTotalSupply)
            .times(reserveUSD);

        return {
            pairId,
            index: index + 1,
            market: { id: pairId, token0: pair.token0, token1: pair.token1 },
            impermanentLoss: stats[pairId].aggregatedStats.impermanentLoss,
            liquidity,
            fees: stats[pairId].aggregatedStats.totalFees,
            returnsUSD: stats[pairId].aggregatedStats.totalReturn
        };
    }).sort((a, b) => b.liquidity - a.liquidity);


    const formatPair = ({ token0, token1 }) => {
        return (
            <span>
                {resolveLogo(token0.id)}{' '}
                <span className='market-data-pair-span positions-table-pair-span'>
                    {token0.symbol}/{token1.symbol}
                </span>
                {' '}{resolveLogo(token1.id)}
            </span>
        );
    };

    const formatPct = (val) => `${new BigNumber(val).times(100).toFixed(2)}%`;
    const formatLiquidity = (val) => new BigNumber(val).isZero() ? 'Position Closed' : formatUSD(val);


    const columns = [
        {
            dataField: 'index',
            text: '#',
            sort: true,
        },
        {
            dataField: 'market',
            text: 'Market',
            formatter: formatPair,
        },
        {
            dataField: 'liquidity',
            text: 'USD Liquidity Position',
            sort: true,
            formatter: formatLiquidity,
        },
        {
            dataField: 'fees',
            text: 'Fees Collected',
            sort: true,
            formatter: formatUSD,
        },
        {
            dataField: 'impermanentLoss',
            text: 'Impermanent Loss',
            sort: true,
            formatter: formatPct,
        },
        {
            dataField: 'returnsUSD',
            text: 'USD Returns',
            sort: true,
            formatter: formatUSD,
        }
    ];

    const onRowClick = (e, row) => { setPairId(row.pairId); };
    const getRowStyle = (row) => {
        const styles = { borderLeft: 0, borderRight: 0 };

        if (row.pairId === pairId) {
            styles.backgroundColor = 'rgba(0, 0, 0, 0.075)';
        }

        return styles;
    }

    return (
        <BootstrapTable
            headerClasses='market-data-table-header'
            rowClasses='market-data-table-row'
            keyField='index'
            data={tableData}
            columns={columns}
            rowStyle={getRowStyle}
            bordered={false}
            condensed={true}
            rowEvents={{ onClick: onRowClick }}
            hover
        />
    );
}

PositionsTable.propTypes = {
    positionData: PropTypes.shape({
        positions: PropTypes.objectOf(PositionData),
        stats: PropTypes.objectOf(PropTypes.shape({
            historicalData: PropTypes.arrayOf(PropTypes.oneOf([DailyData, HourlyData])),
            statsWindows: PropTypes.arrayOf(LPStats),
            aggregatedStats: LPStats
        }))
    }),
    pairId: PropTypes.string,
    setPairId: PropTypes.func
};

export default PositionsTable;