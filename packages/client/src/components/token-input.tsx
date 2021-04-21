import {
    DropdownButton,
    Dropdown,
    Form,
    FormControl,
    InputGroup,
} from 'react-bootstrap';
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
    updateToken: React.Dispatch<React.SetStateAction<string>>;
    handleTokenRatio: (token: string, amount: string) => void;
    options: string[];
    balances: WalletBalances;
    twoSide: boolean;
};
export const TokenInput = ({
    token,
    amount,
    updateAmount,
    updateToken,
    handleTokenRatio,
    options,
    balances,
    twoSide,
}: TokenInputProps): JSX.Element => (
    <Form.Group>
        <InputGroup>
            <button
                className='max-balance-link'
                onClick={() => {
                    updateAmount(toBalanceStr(token, balances));
                    handleTokenRatio(token, toBalanceStr(token, balances));
                }}
            >
                Max
            </button>
            <FormControl
                min='0'
                size='lg'
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
            <DropdownButton as={InputGroup.Append} title={token}>
                {options.map((t) => (
                    <Dropdown.Item
                        key={t}
                        active={t === token}
                        onClick={() => updateToken(t)}
                    >
                        {t}
                    </Dropdown.Item>
                ))}
            </DropdownButton>
        </InputGroup>
    </Form.Group>
);
