import { Card, ListGroup } from 'react-bootstrap';
import BigNumber from 'bignumber.js';

const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'

    // These options are needed to round to whole numbers if that's what you want.
    //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
    //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
});

function LatestTradeSidebar({ latestBlock, latestSwaps }) {
    return (
        <Card className='chart-card no-border'>
            <Card.Header>
                <strong>Latest Block: #{latestBlock}</strong>
            </Card.Header>
            <Card.Body className='trades-sidebar-content'>
                <ListGroup variant="flush">
                    {latestSwaps.map((swap, index) => <SwapInfo swap={swap} key={index} />)}
                </ListGroup>
            </Card.Body>
        </Card>
    );
}

function SwapInfo({ swap }) {
    const outSide = new BigNumber(swap.amount0Out).eq(0) ? '1' : '0';
    const inSide = outSide === '0' ? '1' : '0';

    const outToken = swap.pair[`token${outSide}`].symbol;
    const inToken = swap.pair[`token${inSide}`].symbol;
    const outAmount = new BigNumber(swap[`amount${outSide}Out`]).toFixed(3);
    const inAmount = new BigNumber(swap[`amount${inSide}In`]).toFixed(3);

    return (
        <ListGroup.Item>
            {outAmount} {outToken} for {inAmount} {inToken}
        </ListGroup.Item>
    )
}

export default LatestTradeSidebar;