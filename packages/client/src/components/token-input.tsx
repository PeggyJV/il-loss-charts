import classNames from 'classnames';
import { ethers } from 'ethers';
import { WalletBalances } from 'types/states';
import BigNumber from 'bignumber.js';

const toBalanceStr = (token: string, balances: WalletBalances): string => {
    const balance = balances[token]?.balance;

    return new BigNumber(
        ethers.utils.formatUnits(
            balance || 0,
            parseInt(balances[token]?.decimals || '0', 10),
        ),
    ).toFixed();
};

type TokenInputProps = {
    token: string;
    amount: string;
    updateAmount: (amount: string) => void;
    handleTokenRatio: (token: string, amount: string) => void;
    balances: WalletBalances;
    twoSide: boolean;
    disabled: boolean;
};
export const TokenInput = ({
    token,
    amount,
    updateAmount,
    handleTokenRatio,
    balances,
    twoSide,
    disabled,
}: TokenInputProps): JSX.Element => (
    <div className={classNames({ 'token-input': true, disabled })}>
        <button
            className=''
            disabled={!balances?.[token] || disabled}
            onClick={() => {
                updateAmount(toBalanceStr(token, balances));
                handleTokenRatio(token, toBalanceStr(token, balances));
            }}
        >
            Max
        </button>
        &nbsp;
        <input
            placeholder='Enter Amount'
            value={amount}
            disabled={disabled}
            onChange={(e) => {
                const val = e.target.value;

                if (!val || !new BigNumber(val).isNaN()) {
                    updateAmount(val);
                    twoSide && handleTokenRatio(token, val);
                }
            }}
        />
    </div>
);
