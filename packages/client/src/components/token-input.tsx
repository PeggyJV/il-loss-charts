
import { ethers } from 'ethers';
import { WalletBalances } from 'types/states';
import BigNumber from 'bignumber.js';

const toBalanceStr = (token: string, balances: WalletBalances): string => {
    const balance = balances[token]?.balance;
    console.log(balance.toString());

    return new BigNumber(
        ethers.utils.formatUnits(
            balance || 0,
            parseInt(balances[token]?.decimals || '0', 10)
        )
    ).toFixed(7);
};

type TokenInputProps = {
    token: string;
    amount: string;
    updateAmount: React.Dispatch<React.SetStateAction<string>>;
    handleTokenRatio: (token: string, amount: string) => void;
    balances: WalletBalances;
    twoSide: boolean;
};
export const TokenInput = ({
    token,
    amount,
    updateAmount,
    handleTokenRatio,
    balances,
    twoSide,
}: TokenInputProps): JSX.Element => (
    <div className='token-input'>
        <button
            className=''
            onClick={() => {
                updateAmount(toBalanceStr(token, balances));
                handleTokenRatio(token, toBalanceStr(token, balances));
            }}
        >
            Max
        </button>
        &nbsp;
        <input
            placeholder='Amount'
            value={amount}
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
