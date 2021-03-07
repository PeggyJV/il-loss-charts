import { Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleNotch, faCheck } from '@fortawesome/free-solid-svg-icons';

import { ManageLiquidityActionState } from 'types/states';

export function AddLiquidityActionButton({ 
    state,
    onApprove,
    onAddLiquidity
}:{ 
    state: ManageLiquidityActionState;
    onApprove: () => void;
    onAddLiquidity: () => void;
}): JSX.Element {
    switch(state) {
        case 'awaitingGasPrices':
            return (
                <Button variant='secondary' disabled>
                    <FontAwesomeIcon icon={faCircleNotch} className='fa-spin' />{' '}
                    Awaiting gas prices...
                </Button>
            )
        case 'gasPriceNotSelected':
            return (
                <Button variant='secondary' disabled>
                    Select Gas Price
                </Button>
            );
        case 'amountNotEntered':
            return (
                <Button variant='secondary' disabled>
                    Enter Amount
                </Button>
            );
        case 'insufficientFunds':
            return (
                <Button variant='secondary' disabled>
                    Insufficient Funds
                </Button>
            );
        case 'slippageTooHigh':
            return (
                <Button variant='danger' disabled>
                    Slippage Too High
                </Button>
            );
        case 'needsApproval':  
            return (
                <Button variant='success' onClick={onApprove}>
                    Approve
                </Button>
            );
        case 'waitingApproval':
            return (
                <Button variant='secondary' disabled>
                    <FontAwesomeIcon icon={faCircleNotch} className='fa-spin' />{' '}
                    Awaiting approval...
                </Button>
            );
        case 'needsSubmit':
            return (
                <Button variant='success' onClick={onAddLiquidity}>
                    Confirm
                </Button>
            );
        case 'submitted': 
            return (
                <Button variant='success' disabled>
                    <FontAwesomeIcon icon={faCheck} />{' '}
                    Submitted
                </Button>
            );
        default: 
            return (
                <Button variant='secondary' disabled>
                    <FontAwesomeIcon icon={faCircleNotch} className='fa-spin' />{' '}
                    Awaiting Details...
                </Button>
            );
    }
}

export function RemoveLiquidityActionButton({
    state,
    onApprove,
    onRemoveLiquidity
}: {
    state: ManageLiquidityActionState;
    onApprove: () => void;
    onRemoveLiquidity: () => void;
}): JSX.Element {
    switch (state) {
        case 'awaitingGasPrices':
            return (
                <Button variant='secondary' disabled>
                    <FontAwesomeIcon icon={faCircleNotch} className='fa-spin' />{' '}
                    Awaiting gas prices...
                </Button>
            )
        case 'gasPriceNotSelected':
            return (
                <Button variant='secondary' disabled>
                    Select Gas Price
                </Button>
            );
        case 'amountNotEntered':
            return (
                <Button variant='secondary' disabled>
                    Enter Amount
                </Button>
            );
        case 'insufficientFunds':
            return (
                <Button variant='secondary' disabled>
                    Insufficient Funds
                </Button>
            );
        case 'needsApproval':
            return (
                <Button variant='success' onClick={onApprove}>
                    Approve
                </Button>
            );
        case 'waitingApproval':
            return (
                <Button variant='secondary' disabled>
                    <FontAwesomeIcon icon={faCircleNotch} className='fa-spin' />{' '}
                    Awaiting approval...
                </Button>
            );
        case 'needsSubmit':
            return (
                <Button variant='success' onClick={onRemoveLiquidity}>
                    Confirm
                </Button>
            );
        case 'submitted':
            return (
                <Button variant='success' disabled>
                    <FontAwesomeIcon icon={faCheck} />{' '}
                    Submitted
                </Button>
            );
        default:
            return (
                <Button variant='secondary' disabled>
                    <FontAwesomeIcon icon={faCircleNotch} className='fa-spin' />{' '}
                    Awaiting Details...
                </Button>
            )
    }
}