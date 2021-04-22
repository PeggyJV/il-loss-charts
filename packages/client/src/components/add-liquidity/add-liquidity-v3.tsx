import { useState } from 'react';
import './add-liquidity-v3.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { TokenInput } from 'components/token-input';
import { WalletBalance } from 'components/wallet-balance';
import { IUniswapPair } from '@sommelier/shared-types';
import { WalletBalances } from 'types/states';
import 'rc-slider/assets/index.css';
import { faRetweet } from '@fortawesome/free-solid-svg-icons';
type Props = {
    balances: WalletBalances;
    pairId: string | null;
    pairData: IUniswapPair | null;
};
export const AddLiquidityV3 = ({
    balances,
    pairData,
}: Props): JSX.Element => {
    
    const [token0Amount, setToken0Amount] = useState('0');
    const [token1Amount, setToken1Amount] = useState('0');

    const token0 = pairData?.token0.symbol ?? '';
    const token1 = pairData?.token1.symbol ?? '';

    return (
        <>
            <div className='add-v3-container'>
                <div className='token-and-wallet'>
                    <div className='token-pair-selector'>
                        <TokenInput
                            token={token0}
                            amount={token0Amount}
                            updateAmount={setToken0Amount}
                            updateToken={() => {
                                return '';
                            }}
                            handleTokenRatio={() => {
                                return '';
                            }}
                            options={['ETH', token0]}
                            balances={balances}
                            twoSide={false}
                        />
                        <FontAwesomeIcon icon={faRetweet} />

                        <TokenInput
                            token={token1}
                            amount={token1Amount}
                            updateAmount={setToken1Amount}
                            updateToken={() => {
                                return '';
                            }}
                            handleTokenRatio={() => {
                                return '';
                            }}
                            options={['ETH', token1]}
                            balances={balances}
                            twoSide={true}
                        />
                    </div>
                    <div className='wallet-fees'>
                        <WalletBalance balances={balances} />
                    </div>
                </div>
                <br />
                {/* <div className='tab-container'>
                    <div className='tab'>
                        <h3>MAKE</h3>
                        <p className='returns'>2.9ETH</p>
                        <p className='fees'>9.8% fees 24hrs</p>
                    </div>
                    <div className='tab selected'>
                        <h3>MAKE</h3>
                        <p className='returns'>4.1ETH</p>
                        <p className='fees'>18.5% fees 24hrs</p>
                    </div>
                    <div className='tab'>
                        <h3>MAKE</h3>
                        <p className='returns'>3.1ETH</p>
                        <p className='fees'>13.2% fees 24hrs</p>
                    </div>
                </div> */}
                <div className='preview-container'>
                    {/* <div className='header'>
                        <h4>Position Preview</h4>
                        <div className='total-and-pool'>
                            <p className='total'>$5231.45</p>
                            <p className='fee'>0.3% Fee Pool </p>
                        </div>
                    </div>
                    <div className='pair-bar'>
                        <p>
                            <span>{token0Logo}</span>
                            {`2.123 `}
                            <span>{token0}</span>
                        </p>
                        <FontAwesomeIcon icon={faLink} className='fa-pulse' />
                        <p>
                            <span>{token1Logo}</span>
                            {`2117 `}
                            <span>{token1}</span>
                        </p>
                    </div>
                    <div className='range-container'>
                        <Range defaultValue={[0, 100]} value={[20, 80]} />
                    </div> */}
                    <div className='btn-container'>
                        <button className='btn-addl'>ADD LIQUIDITY</button>
                    </div>
                </div>
            </div>
        </>
    );
};
