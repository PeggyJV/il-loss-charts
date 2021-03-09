import { SyntheticEvent } from 'react';
import BootstrapTable from 'react-bootstrap-table-next';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';

import { Token, LPPositionData, MarketStats } from '@sommelier/shared-types';

import {
    PositionData,
    LPStats,
    DailyData,
    HourlyData,
} from 'constants/prop-types';
import { formatUSD } from 'util/formats';
import { resolveLogo } from 'components/token-with-logo';

interface PositionTableRow {
    pairId: string;
    index: number;
    market: { id: string; token0?: Partial<Token>; token1?: Partial<Token> };
    impermanentLoss: string;
    liquidity: string;
    fees: string;
    returnsUSD: string;
}

function PositionsTable({
    positionData: { positions, stats },
    pairId,
    setPairId,
    handleAddLiquidity,
}: {
    positionData: LPPositionData<string>;
    pairId: string;
    setPairId: (pairId: string) => void;
    handleAddLiquidity: (pairId: string) => void;
}): JSX.Element {
    const tableData: PositionTableRow[] = Object.entries(positions)
        .map(([pairId, positionSnapshots], index) => {
            const mostRecentPosition =
                positionSnapshots[positionSnapshots.length - 1];
            const {
                pair,
                liquidityTokenBalance,
                liquidityTokenTotalSupply,
                reserveUSD,
            } = mostRecentPosition;

            const liquidity = new BigNumber(liquidityTokenBalance)
                .div(liquidityTokenTotalSupply)
                .times(reserveUSD)
                .toFixed(4);

            return {
                pairId,
                index: index + 1,
                market: {
                    id: pairId,
                    token0: pair.token0,
                    token1: pair.token1,
                },
                impermanentLoss: stats[pairId].aggregatedStats.impermanentLoss,
                liquidity,
                fees: stats[pairId].aggregatedStats.totalFees,
                returnsUSD: stats[pairId].aggregatedStats.totalReturn,
                action: { id: pairId },
            };
        })
        .sort((a, b) => parseInt(b.liquidity, 10) - parseInt(a.liquidity, 10));

    const formatPair = ({
        token0,
        token1,
    }: {
        token0: Token;
        token1: Token;
    }) => {
        return (
            <span>
                {resolveLogo(token0.id)}{' '}
                <span className='market-data-pair-span positions-table-pair-span'>
                    {token0.symbol}/{token1.symbol}
                </span>{' '}
                {resolveLogo(token1.id)}
            </span>
        );
    };

    const renderManageLiquidity = ({ id }: { id: string }) => (
        <button
            className='btn-addl'
            onClick={() => handleAddLiquidity(id)}
        >
            Manage Liquidity
        </button>
    );
    const formatLiquidity = (val: string | BigNumber): string =>
        new BigNumber(val).isZero()
            ? 'Position Closed'
            : formatUSD(new BigNumber(val).toNumber());
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
            formatter: formatUSD,
        },
        {
            dataField: 'returnsUSD',
            text: 'USD Returns',
            sort: true,
            formatter: formatUSD,
        },
        {
            dataField: 'action',
            text: 'Manage Liquidity',
            sort: false,
            formatter: renderManageLiquidity,
        },
    ];

    const onRowClick = (e: SyntheticEvent, row: PositionTableRow) => {
        setPairId(row.pairId);
    };
    const getRowStyle = (row: PositionTableRow) => {
        const styles: {
            borderLeft: number;
            borderRight: number;
            backgroundColor?: string;
        } = { borderLeft: 0, borderRight: 0 };

        if (row.pairId === pairId) {
            styles.backgroundColor = 'rgba(0, 0, 0, 0.075)';
        }

        return styles;
    };

    return (
        <div className='il-market-container'>
            <BootstrapTable
                headerClasses='market-data-table-header'
                rowClasses='market-data-table-row'
                keyField='index'
                data={tableData}
                columns={columns}
                rowStyle={{ borderLeft: 0, borderRight: 0 }}
                bordered={false}
                condensed={true}
                rowEvents={{ onClick: onRowClick }}
            />
        </div>
    );
}

PositionsTable.propTypes = {
    positionData: PropTypes.shape({
        positions: PropTypes.objectOf(PositionData),
        stats: PropTypes.objectOf(
            PropTypes.shape({
                historicalData: PropTypes.arrayOf(
                    PropTypes.oneOf([DailyData, HourlyData])
                ),
                statsWindows: PropTypes.arrayOf(LPStats),
                aggregatedStats: LPStats,
            })
        ),
    }),
    pairId: PropTypes.string,
    setPairId: PropTypes.func,
};

export default PositionsTable;
