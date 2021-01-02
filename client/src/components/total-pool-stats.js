import { useState } from 'react';
import { Row, Col, Button, Card } from 'react-bootstrap';
import USDValueWidget from 'components/usd-value-widget';


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


    return (
        <Row noGutters>
            <Col lg={3}>
                <USDValueWidget
                    title={`USD Volume - #${allPairs.lookups[lpInfo.pairData.id].volumeRanking}`}
                    value={stats.volumeUSD}
                />
                {window !== 'total' && `${stats.volumeUSDChange.times(100).toFixed(2)}% Change`}
            </Col>
            <Col lg={3}>
                <USDValueWidget
                    title={`Total Liquidity - #${allPairs.lookups[lpInfo.pairData.id].liquidityRanking}`}
                    value={stats.liquidityUSD}
                />
                {window !== 'total' && `${stats.liquidityUSDChange.times(100).toFixed(2)}% Change`}
            </Col>
            <Col lg={3}>
                <USDValueWidget
                    title={`Total Fees - #${allPairs.lookups[lpInfo.pairData.id].volumeRanking}`}
                    value={stats.feesUSD}
                />
                {window !== 'total' && `${stats.feesUSDChange.times(100).toFixed(2)}% Change`}

            </Col>
            <Col lg={3}>
                <Card className='stats-card window-button-card no-border' body>
                    <Button variant={window === 'day' ? 'primary' : 'outline-primary'} size='sm' onClick={() => handleSetWindow('day')}>24H</Button>
                    <Button variant={window === 'week' ? 'primary' : 'outline-primary'} size='sm' onClick={() => handleSetWindow('week')}>7D</Button>
                </Card>
            </Col>
        </Row>
    );
}

export default TotalPoolStats;