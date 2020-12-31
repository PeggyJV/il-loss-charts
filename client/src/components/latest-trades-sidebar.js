import { Card, ListGroup } from 'react-bootstrap';
import BigNumber from 'bignumber.js';

function LatestTradeSidebar({ latestBlock, latestSwaps }) {
    return (
        <Card className='chart-card'>
            <Card.Header>
                {latestBlock ?
                    <strong>Latest Block: #{latestBlock}</strong>
                    :
                    <strong>Awaiting New Blocks...</strong>
                }
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
        <ListGroup.Item className='sidebar-item'>
            Swap {outAmount} {outToken} for {inAmount} {inToken}
        </ListGroup.Item>
    )
}

export default LatestTradeSidebar;