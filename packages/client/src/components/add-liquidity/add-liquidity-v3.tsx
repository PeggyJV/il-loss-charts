import { useState, useEffect, useContext } from 'react';
import './add-liquidity-v3.scss';
import {WalletBalance} from 'components/wallet-balance';
import {WalletBalances} from 'types/states';
type Props = {
  balances: WalletBalances;
  pairId: string | null;
}
export const AddLiquidityV3 = ({balances, pairId}: Props): JSX.Element => {
return (
    <div className='container'>
        <WalletBalance balances={balances} />
    </div>
);
};
