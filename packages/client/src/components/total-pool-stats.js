import { useState } from 'react';
import { Row, Col, Button, Card } from 'react-bootstrap';
import USDValueWidget from 'components/usd-value-widget';

function PercentChangeStat({ value }) {
    const sign = value.isPositive() ? '↗' : '↘';
    const className = value.isPositive() ? 'pct-change-up' : 'pct-change-down';

    return <span className={className}>{value.toFixed(2)}% {sign}</span>;
}


function TotalPoolStats({ allPairs, lpInfo, lpStats }) {
    const [window, setWindow] = useState('total');

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

    const handleSetWindow = (selectedWindow) => {
        // Reset to total if already clicked
        if (window === selectedWindow) setWindow('total');
        else setWindow(selectedWindow);
    }

    const prefix = window === 'day' ? '24h' : window === 'week' ? '7d' : '';

    return (
        <div className='pool-stats-container'>
            <USDValueWidget
                title={`${prefix} USD Volume - #${allPairs.lookups[lpInfo.pairData.id].volumeRanking}`}
                value={stats.volumeUSD}
                footnote={window !== 'total' && <PercentChangeStat value={stats.volumeUSDChange.times(100)} />}
            />
            <USDValueWidget
                title={`Total Liquidity - #${allPairs.lookups[lpInfo.pairData.id].liquidityRanking}`}
                value={stats.liquidityUSD}
                footnote={window !== 'total' && <PercentChangeStat value={stats.liquidityUSDChange.times(100)} />}
            />
            <USDValueWidget
                title={`${prefix} Fees Collected - #${allPairs.lookups[lpInfo.pairData.id].volumeRanking}`}
                value={stats.feesUSD}
                footnote={window !== 'total' && <PercentChangeStat value={stats.feesUSDChange.times(100)} />}
            />
            <Card className='stats-card window-button-card no-border' body>
                <Button variant={window === 'day' ? 'primary' : 'outline-primary'} size='sm' className='window-button' onClick={() => handleSetWindow('day')}>24H</Button>
                <Button variant={window === 'week' ? 'primary' : 'outline-primary'} size='sm' className='window-button' onClick={() => handleSetWindow('week')}>7D</Button>
            </Card>
        </div>
    );
}

export default TotalPoolStats;