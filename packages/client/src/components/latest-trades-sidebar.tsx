import { useState } from 'react';
import PropTypes from 'prop-types';
import { Card, ListGroup, Button } from 'react-bootstrap';
import BigNumber from 'bignumber.js';

import {
    IToken,
    UniswapSwap,
    UniswapMintOrBurn,
} from '@sommelier/shared-types';

import { MintOrBurn, Swap } from 'constants/prop-types';
import { formatUSD } from 'util/formats';
import { debug } from 'util/debug';

function LatestTradeSidebar({
    latestSwaps,
}: {
    latestSwaps: {
        swaps: UniswapSwap[] | null;
        mintsAndBurns: {
            mints: UniswapMintOrBurn[];
            burns: UniswapMintOrBurn[];
            combined: UniswapMintOrBurn[];
        } | null;
    } | null;
}): JSX.Element | null {
    const [mode, setMode] = useState('swaps');
    if (!latestSwaps) return null;

    const { swaps, mintsAndBurns } = latestSwaps;
    if (!swaps || !mintsAndBurns) return null;

    debug.mintsAndBurnts = mintsAndBurns;

    return (
        <Card className='chart-card'>
            <Card.Header>
                {/* <p>
                    {latestBlock ? (
                        <strong>Latest Block: #{latestBlock}</strong>
                    ) : (
                            <strong>Awaiting New Blocks...</strong>
                        )}
                </p> */}
                <div className='sidebar-buttons'>
                    <Button
                        variant={
                            mode === 'swaps' ? 'primary' : 'outline-primary'
                        }
                        size='sm'
                        className='sidebar-button'
                        onClick={() => setMode('swaps')}
                    >
                        Swaps
                    </Button>
                    <Button
                        variant={
                            mode === 'adds' ? 'primary' : 'outline-primary'
                        }
                        size='sm'
                        className='sidebar-button'
                        onClick={() => setMode('adds')}
                    >
                        Adds/Removes
                    </Button>
                </div>
            </Card.Header>
            <Card.Body className='trades-sidebar-content'>
                <ListGroup variant='flush'>
                    {mode === 'swaps' &&
                        swaps.map((swap, index) => (
                            <SwapInfo swap={swap} key={index} />
                        ))}
                    {mode === 'adds' &&
                        mintsAndBurns.combined.map((action, index) => (
                            <MintBurnInfo action={action} key={index} />
                        ))}
                </ListGroup>
            </Card.Body>
        </Card>
    );
}

LatestTradeSidebar.propTypes = {
    latestBlock: PropTypes.number,
    latestSwaps: PropTypes.shape({
        swaps: PropTypes.arrayOf(Swap).isRequired,
        mintsAndBurns: PropTypes.shape({
            mints: PropTypes.arrayOf(MintOrBurn).isRequired,
            burns: PropTypes.arrayOf(MintOrBurn).isRequired,
            combined: PropTypes.arrayOf(MintOrBurn).isRequired,
        }),
    }),
};

function SwapInfo({ swap }: { swap: UniswapSwap }) {
    const outSide = new BigNumber(swap.amount0Out).eq(0) ? '1' : '0';

    let outToken: string;
    let inToken: string;
    let outAmount: string;
    let inAmount: string;

    if (outSide === '1') {
        outToken = (swap.pair.token1 as IToken).symbol;
        inToken = (swap.pair.token0 as IToken).symbol;
        outAmount = new BigNumber(swap.amount1Out).toFixed(3);
        inAmount = new BigNumber(swap.amount0In).toFixed(3);
    } else {
        outToken = (swap.pair.token0 as IToken).symbol;
        inToken = (swap.pair.token1 as IToken).symbol;
        outAmount = new BigNumber(swap.amount0Out).toFixed(3);
        inAmount = new BigNumber(swap.amount1In).toFixed(3);
    }

    const arrowIcon = outSide === '1' ? '⬅️' : '➡️';

    return (
        <ListGroup.Item className='sidebar-item'>
            {arrowIcon} Swap {outAmount} {outToken} for {inAmount} {inToken}
        </ListGroup.Item>
    );
}

SwapInfo.propTypes = { swap: Swap.isRequired };

function MintBurnInfo({ action }: { action: UniswapMintOrBurn }) {
    const icon = action.__typename === 'Mint' ? '💰' : '🔥';
    const actionName = action.__typename === 'Mint' ? 'Add' : 'Remove';
    const pairAmounts = `${new BigNumber(action.amount0).toFixed(3)} ${
        (action.pair.token0 as IToken).symbol
    }/${new BigNumber(action.amount1).toFixed(3)} ${
        (action.pair.token1 as IToken).symbol
    }`;
    return (
        <ListGroup.Item className='sidebar-item'>
            {icon} {actionName} {formatUSD(action.amountUSD)} ({pairAmounts})
        </ListGroup.Item>
    );
}

MintBurnInfo.propTypes = { action: MintOrBurn.isRequired };

export default LatestTradeSidebar;
