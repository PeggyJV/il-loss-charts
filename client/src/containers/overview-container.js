import { useEffect, useState } from 'react';
import BootstrapTable from 'react-bootstrap-table-next';
import BigNumber from 'bignumber.js';

import { UniswapApiFetcher as Uniswap } from 'services/api';
import { resolveLogo } from 'components/token-with-logo';

const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'

    // These options are needed to round to whole numbers if that's what you want.
    //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
    //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
});



function OverviewContainer() {
    const [marketData, setMarketData] = useState([]);

    useEffect(() => {
        const fetchMarketData = async () => {
            // Fetch all pairs
            const marketData = await Uniswap.getMarketData();
            console.log('FETCHED', marketData);
            setMarketData(marketData);
        }
        fetchMarketData();
    }, []);

    window.marketData = marketData;

    return (
        <div>
            <h4>Highest Impermanent Loss Pairs on Uniswap</h4>
            {marketData && <MarketDataTable data={marketData} />}
        </div>
    );
}

function MarketDataTable({ data }) {
    const formatCell = ({ token0, token1 }) => {
        return <span>{resolveLogo(token0.id)}{' '}{token0.symbol}/{token1.symbol}{' '}{resolveLogo(token1.id)}</span>;
    }

    const columns = [
        {
            dataField: 'market',
            text: 'Market',
            formatter: formatCell
        },
        {
            dataField: 'impermanentLoss',
            text: 'Impermanent Loss %',
            sort: true
        },
        {
            dataField: 'ilGross',
            text: 'Impermanent Loss',
            sort: true
        },
        {
            dataField: 'liquidity',
            text: 'USD Liquidity',
            sort: true
        },
        {
            dataField: 'volume',
            text: 'USD Volume',
            sort: true
        },
        {
            dataField: 'returnsUSD',
            text: 'USD Returns',
            sort: true
        }
    ];

    const sortedIl = [...data].sort((a, b) => a.ilGross - b.ilGross)
        .map(d => ({
            ...d,
            market: { token0: d.token0, token1: d.token1 },
            impermanentLoss: `${new BigNumber(d.impermanentLoss).times(100).toFixed(2)}%`,
            ilGross: formatter.format(d.ilGross),
            liquidity: formatter.format(d.liquidity),
            volume: formatter.format(d.volume),
            returnsUSD: formatter.format(d.returnsUSD)
        }));

    return <BootstrapTable keyField='market' data={sortedIl} columns={columns} formatter={formatCell} />
}

export default OverviewContainer;