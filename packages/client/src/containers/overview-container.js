import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Card, Container } from 'react-bootstrap';
import BootstrapTable from 'react-bootstrap-table-next';
import BigNumber from 'bignumber.js';
import { MarketData } from 'constants/prop-types';

import { UniswapApiFetcher as Uniswap } from 'services/api';
import { resolveLogo } from 'components/token-with-logo';

const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',

    // These options are needed to round to whole numbers if that's what you want.
    //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
    //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
});

function OverviewContainer() {
    const [marketData, setMarketData] = useState([]);
    const [currentError, setError] = useState(null);

    useEffect(() => {
        const fetchMarketData = async () => {
            // Fetch all pairs
            const { data: marketData, errors } = await Uniswap.getMarketData();

            if (errors) {
                // we could not get our market data
                console.warn(`Could not fetch marekt data: ${errors}`);
                setError(errors[0]);
                return;
            }

            setMarketData(marketData);
        };
        fetchMarketData();
    }, []);

    window.marketData = marketData;

    if (currentError) {
        return (
            <Container>
                <h2>Oops, the grapes went bad.</h2>
                <p>Error: {currentError.message}</p>

                <h6>Refresh the page to try again.</h6>
            </Container>
        );
    }

    return (
        <div>
            <h4>Highest Impermanent Loss Pairs on Uniswap since December 1</h4>
            <p>
                <em>
                    * The impermanent loss percentage is a reflection of the
                    amount of IL due to price fluctation relative to the total
                    return of the pool.
                </em>
            </p>
            {marketData && <MarketDataTable data={marketData} />}
        </div>
    );
}

function MarketDataTable({ data }) {
    const formatPair = ({ id, token0, token1 }) => {
        return (
            <span>
                {resolveLogo(token0.id)}{' '}
                <Link to={`/pair?id=${id}`}>
                    {token0.symbol}/{token1.symbol}
                </Link>{' '}
                {resolveLogo(token1.id)}
            </span>
        );
    };

    const formatPct = (val) => `${new BigNumber(val).times(100).toFixed(2)}%`;
    const formatUSD = (val) => formatter.format(parseFloat(val, 10));

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
            dataField: 'impermanentLoss',
            text: 'Impermanent Loss %',
            sort: true,
            formatter: formatPct,
        },
        {
            dataField: 'ilGross',
            text: 'Impermanent Loss',
            sort: true,
            formatter: formatUSD,
        },
        {
            dataField: 'liquidity',
            text: 'USD Liquidity',
            sort: true,
            formatter: formatUSD,
        },
        {
            dataField: 'volume',
            text: 'USD Volume',
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
            dataField: 'returnsETH',
            text: 'ETH Returns',
            sort: true,
            formatter: (val) => val.toFixed(4),
        },
    ];

    const sortedIl = [...data]
        .sort((a, b) => a.impermanentLoss - b.impermanentLoss)
        .map((d, index) => ({
            ...d,
            index: index + 1,
            market: { id: d.id, token0: d.token0, token1: d.token1 },
        }));
    window.sortedIL = sortedIl;

    return (
        <Card body className='il-market-container'>
            <BootstrapTable
                keyField='index'
                data={sortedIl}
                columns={columns}
                rowStyle={{ borderLeft: 0, borderRight: 0 }}
                bordered={false}
                condensed={true}
                striped
            />
        </Card>
    );
}

MarketDataTable.propTypes = { data: PropTypes.arrayOf(MarketData) };

export default OverviewContainer;
