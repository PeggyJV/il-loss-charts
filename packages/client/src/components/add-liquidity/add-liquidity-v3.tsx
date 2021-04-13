import { useState, useEffect, useContext } from 'react';
import './add-liquidity-v3.scss';
import { TokenInput } from 'components/token-input';
import { WalletBalance } from 'components/wallet-balance';
import { WalletBalances } from 'types/states';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    Form,
    Row,
    FormControl,
    InputGroup,
    Dropdown,
    DropdownButton,
} from 'react-bootstrap';
import { faRetweet } from '@fortawesome/free-solid-svg-icons';
type Props = {
    balances: WalletBalances;
    pairId: string | null;
};
export const AddLiquidityV3 = ({ balances, pairId }: Props): JSX.Element => {
    const selectStyles = {
        valueContainer: (provided: { [key: string]: string }) => ({
            ...provided,
            background: 'var(--bgDeep)',
            color: 'var(--facePrimary)',
        }),
    };
    return (
        <>
            <div className='container'>
                <div className='token-and-wallet'>
                    <div className='token-pair-selector'>
                        <TokenInput
                            token={'ETH'}
                            amount={'0'}
                            updateAmount={() => {
                                return '';
                            }}
                            updateToken={() => {
                                return '';
                            }}
                            handleTokenRatio={() => {
                                return '';
                            }}
                            options={['ETH', 'WETH']}
                            balances={balances}
                            twoSide={false}
                        />
                        <FontAwesomeIcon icon={faRetweet} />

                        <TokenInput
                            token={'ETH'}
                            amount={'0'}
                            updateAmount={() => {
                                return '';
                            }}
                            updateToken={() => {
                                return '';
                            }}
                            handleTokenRatio={() => {
                                return '';
                            }}
                            options={['ETH', 'WETH']}
                            balances={balances}
                            twoSide={true}
                        />
                    </div>
                    <div className='wallet-fees'>
                        <WalletBalance balances={balances} />
                    </div>
                </div>
                <br />
                <div className='template-container'>
                    <button className='btn-neutral'>STD RANGE</button>
                    <button className='btn-addl'>10% of MID</button>
                    <button className='btn-neutral'>5% of VOL</button>
                </div>
            </div>
            &nbsp;&nbsp;&nbsp;&nbsp;
            <div className='container'>
               <h3>Position Preview</h3>
               <p>$5231</p>
               <p>2.3ETH</p>
               <p>0.3% Fee Pool</p>
               <p>{'1.17 ETH in DAI'}</p>
               <p>{'2117 DAI in ETH'}</p>
               <p>Chart</p>
            </div>
        </>
    );
};
