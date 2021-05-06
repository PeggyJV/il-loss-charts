import classNames from 'classnames';
import { useEffect, useState } from 'react';
import BigNumber from 'bignumber.js';
import { WalletBalances } from 'types/states';
import { ethers } from 'ethers';
import { useWallet } from 'hooks/use-wallet';
import { Rings } from 'react-loading-icons';
export const LiquidityActionButton = ({
    tokenInputState,
    onClick,
    balances,
    pendingApproval,
    pendingBounds,
}: {
    tokenInputState: any;
    onClick: () => void;
    balances: WalletBalances;
    pendingApproval: boolean;
    pendingBounds: boolean;
}): JSX.Element => {
    // const [isDisabled, setIsDisabled] = useState(disabled);
    const [buttonState, setButtonState] = useState('Add Liquidity');
    const { wallet } = useWallet();

    useEffect(() => {
        const numOfTokens = tokenInputState?.selectedTokens?.length ?? 0;

        if (pendingApproval) {
            setButtonState('pendingApproval');
            return;
        }

        if (!wallet?.account) {
            setButtonState('connectWallet');
            return;
        }

        if (tokenInputState?.selectedTokens.length !== 2) {
            setButtonState('selectTokens');
            return;
        }

        for (let i = 0; i < numOfTokens; i++) {
            const symbol = tokenInputState?.selectedTokens[i];
            if (!tokenInputState[symbol].amount) {
                setButtonState('enterAmount');
                return;
            }
            const tokenAmount = new BigNumber(tokenInputState[symbol].amount);

            if (!tokenAmount || tokenAmount.lte(0)) {
                setButtonState('enterAmount');
                return;
            }
        }

        for (let i = 0; i < numOfTokens; i++) {
            const symbol = tokenInputState?.selectedTokens[i];
            const tokenAmount = new BigNumber(tokenInputState[symbol].amount);
            const tokenBalance =
                ethers.utils.formatUnits(
                    balances?.[symbol].balance || 0,
                    parseInt(balances[symbol]?.decimals || '0', 10)
                ) || '0';

            if (tokenAmount.gt(tokenBalance)) {
                setButtonState('insufficientFunds');
                return;
            }
        }

        if(pendingBounds) {
            setButtonState('pendingBounds');
            return;
        }
        setButtonState('addLiquidity');
    }, [balances, pendingApproval, pendingBounds, tokenInputState, wallet?.account]);

    switch (buttonState) {
        case 'pendingApproval':
            return (
                <button
                    disabled={true}
                    onClick={onClick}
                    className={classNames('btn-addl', 'no-hover', 'warn')}
                >
                    <Rings width='24px' height='24px' />
                    {' Approving '}
                </button>
            );
        case 'connectWallet':
            return (
                <button
                    disabled={true}
                    onClick={onClick}
                    className={classNames('btn-addl', 'btn-negative')}
                >
                    {'Connect Wallet'}
                </button>
            );
        case 'selectTokens':
            return (
                <button
                    disabled={true}
                    onClick={onClick}
                    className={classNames('btn-addl', 'btn-negative')}
                >
                    {'Select (2) Tokens'}
                </button>
            );
        case 'enterAmount':
            return (
                <button
                    disabled={true}
                    onClick={onClick}
                    className={classNames('btn-addl', 'btn-negative')}
                >
                    {'Enter Amount(s)'}
                </button>
            );
        case 'insufficientFunds':
            return (
                <button
                    disabled={true}
                    onClick={onClick}
                    className={classNames('btn-addl', 'btn-negative')}
                >
                    {'Insufficient Funds'}
                </button>
            );
        case 'pendingBounds': 
        return (
            <button
                disabled={true}
                onClick={onClick}
                className={classNames('btn-addl', 'no-hover', 'warn')}
            >
                <Rings width='24px' height='24px' />
                {' Calculating Range '}
            </button>
        );
        case 'addLiquidity':
            return (
                <button
                    disabled={false}
                    onClick={onClick}
                    className={classNames('btn-addl')}
                >
                    {' Add Liquidity'}
                </button>
            );
        default:
            return (
                <button
                    disabled={true}
                    onClick={onClick}
                    className={classNames('btn-addl', 'btn-negative')}
                >
                    <Rings width='24px' height='24px' />
                    {' Awaiting Details'}
                </button>
            );
    }
};
