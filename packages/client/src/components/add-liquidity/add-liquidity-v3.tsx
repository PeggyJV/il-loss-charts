import { useState, useContext } from 'react';

import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';
import { Price, Token, TokenAmount } from '@uniswap/sdk-core';
import { FeeAmount, Pool, priceToClosestTick } from '@uniswap/v3-sdk';
import { resolveLogo } from 'components/token-with-logo';
import { TokenWithBalance } from 'components/token-with-balance';
import './add-liquidity-v3.scss';
import 'rc-slider/assets/index.css';
import { Box } from '@material-ui/core';
import config from 'config';
import erc20Abi from 'constants/abis/erc20.json';
import addLiquidityAbi from 'constants/abis/uniswap_v3_add_liquidity.json';
import { LiquidityContext } from 'containers/liquidity-container';
import { TokenInput } from 'components/token-input';
import { toastSuccess, toastWarn } from 'util/toasters';
import { compactHash } from 'util/formats';
// import { Grid } from 'react-loading-icons';
import { WalletBalances } from 'types/states';
import { useWallet } from 'hooks/use-wallet';
import { useMarketData } from 'hooks/use-market-data';
import { PoolOverview } from 'hooks/data-fetchers';
import { debug } from 'util/debug';
import classNames from 'classnames';

type Props = {
    balances: WalletBalances;
    pool: PoolOverview | null;
};

export type Sentiment = 'bullish' | 'bearish' | 'neutral';

export const AddLiquidityV3 = ({
    pool,
    balances,
}: Props): JSX.Element | null => {
    const [token0, setToken0] = useState(pool?.token0?.id ?? '');
    const [token1, setToken1] = useState(pool?.token1?.id ?? '');
    const [token0Amount, setToken0Amount] = useState('0');
    const [token1Amount, setToken1Amount] = useState('0');

    const token0Symbol = pool?.token0?.symbol ?? '';
    const token1Symbol = pool?.token1?.symbol ?? '';
    // State here is used to compute what tokens are being used to add liquidity with.
    // const initialState = {
    //     [token0Symbol]: pool?.token0,
    //     [token1Symbol]: pool?.token1,
    // };

    // const reducer = (
    //     state: { [x: string]: any },
    //     action: { type: any; payload: { sym: any } }
    // ) => {
    //     let sym; let token;
    //     switch (action.type) {
    //         case 'remove':
    //             sym = action.payload.sym;
    //             const { [sym]: omit, ...rest } = state;
    //             return { ...rest };
    //         case 'add':
    //             const token = action.payload.token;
    //             return { ...state, token };
    //         default:
    //             throw new Error();
    //     }
    // };
    // const [state, dispatch] = useReducer(reducer, initialState);
    // console.log('state ', state);
    // const [token, setToken] = useState('ETH');
    // TODO calculate price impact
    const { currentGasPrice, slippageTolerance } = useContext(LiquidityContext);
    const [sentiment, setSentiment] = useState<Sentiment>('neutral');
    const { wallet } = useWallet();

    let provider: ethers.providers.Web3Provider | null = null;
    if (wallet.provider) {
        provider = new ethers.providers.Web3Provider(wallet?.provider);
    }

    (window as any).pool = pool;
    const ETH_ID = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
    // const token0 = pool?.token0?.id ?? '';
    // const token1 = pool?.token1?.id ?? '';

    const { newPair: marketData, indicators } = useMarketData(pool?.token1, pool?.token0, wallet.network);
    (window as any).marketData = marketData;
    (window as any).indicators = indicators;

    const SELECTED_INDICATOR_NAME = 'bollingerEMANormalBand';
    const currentPrice = marketData?.quotePrice ?? parseFloat(pool?.token0Price || '0');

    let liquidityLow: number, liquidityHigh: number;
    if (indicators == null) {
        liquidityLow = (currentPrice * 0.9);
        liquidityHigh = (currentPrice * 1.1);
    } else {
        const indicator = indicators[SELECTED_INDICATOR_NAME];
        const [lowerBound, upperBound] = indicator.bounds[sentiment];
        liquidityLow = lowerBound;
        liquidityHigh = upperBound;
    }

    const doAddLiquidity = async () => {
        if (!pool || !provider || !indicators) return;
        if (!currentGasPrice) {
            throw new Error('Gas price not selected.');
        }

        const addLiquidityContractAddress =
            config.networks[wallet.network || '1']?.contracts?.ADD_LIQUIDITY_V3;

        if (!addLiquidityContractAddress) {
            throw new Error(
                'Add liquidity contract not available on this network.'
            );
        }

        // Create signer
        const signer = provider.getSigner();
        // Create read-write contract instance
        const addLiquidityContract = new ethers.Contract(
            addLiquidityContractAddress,
            addLiquidityAbi,
            signer
        );

        debug.contract = addLiquidityContract;

        const fnName =
            token0 === 'ETH'
                ? 'addLiquidityEthForUniV3'
                : 'addLiquidityForUniV3';
        const tokenId = 0;

        // Convert to lower tick and upper ticks
        const baseTokenCurrency = new Token(
            Number(wallet.network),
            pool.token0.id,
            Number(pool.token0.decimals),
            pool.token0.symbol,
            pool.token0.name
        );
        const quoteTokenCurrency = new Token(
            Number(wallet.network),
            pool.token0.id,
            Number(pool.token1.decimals),
            pool.token1.symbol,
            pool.token1.name
        );
        const lowerBoundPrice = new Price(
            baseTokenCurrency,
            quoteTokenCurrency,
            liquidityLow,
            1
        );
        const lowerBoundTick = priceToClosestTick(lowerBoundPrice);
        const upperBoundPrice = new Price(
            baseTokenCurrency,
            quoteTokenCurrency,
            liquidityHigh,
            1
        );
        const upperBoundTick = priceToClosestTick(upperBoundPrice);

        const uniPool = new Pool(
            baseTokenCurrency, 
            quoteTokenCurrency, 
            parseInt(pool.feeTier, 10) as any as FeeAmount,
            pool.sqrtPrice,
            pool.liquidity,
            parseInt(pool.tick || '0', 10),
            []
        );

        // TODO calculate expected depending on input token (also handle two side)
        const totalAmount = parseFloat(token0Amount);
        const expectedBaseAmount = totalAmount / 2;
        const expectedQuoteAmountNoSlippage = expectedBaseAmount * currentPrice;
        const amount0Desired = ethers.utils
            .parseUnits(expectedBaseAmount.toString(), 18)
            .toString();
        const amount1Desired = ethers.utils
            .parseUnits(expectedQuoteAmountNoSlippage.toString(), 18)
            .toString();

        const expectedQuoteAmount = await uniPool.getOutputAmount(new TokenAmount(baseTokenCurrency, expectedBaseAmount));


        const slippageRatio = new BigNumber(slippageTolerance as number).div(
            100
        );
        const amount0Min = new BigNumber(expectedBaseAmount).times(
            new BigNumber(1).minus(slippageRatio)
        );
        const amount1Min = new BigNumber(expectedQuoteAmountNoSlippage).times(
            new BigNumber(1).minus(slippageRatio)
        );

        const mintParams = [
            token0, // token0
            token1, // token1
            pool.feeTier, // feeTier
            lowerBoundTick, // tickLower
            upperBoundTick, // tickUpper
            amount0Desired, // amount0Desired
            amount1Desired, // amount1Desired
            amount0Min, // amount0Min
            amount1Min, // amount1Min
            wallet.account, // recipient
            Math.floor(Date.now() / 1000) + 86400000, // deadline
        ];

        // approve DAI. TODO: Make this approval separate
        const daiContract = new ethers.Contract(token1, erc20Abi, signer);

        const baseApproveAmount = ethers.utils
            .parseUnits(
                new BigNumber(amount1Desired.toString()).times(100).toFixed(),
                18
            )
            .toString();
        const baseGasPrice = ethers.utils
            .parseUnits(currentGasPrice.toString(), 9)
            .toString();

        // Call the contract and sign
        let approvalEstimate: ethers.BigNumber;

        try {
            approvalEstimate = await daiContract.estimateGas.approve(
                addLiquidityContractAddress,
                baseApproveAmount,
                { gasPrice: baseGasPrice }
            );

            // Add a 30% buffer over the ethers.js gas estimate. We don't want transactions to fail
            approvalEstimate = approvalEstimate.add(approvalEstimate.div(3));
        } catch (err) {
            // We could not estimate gas, for whaever reason, so we will use a high default to be safe.
            console.error(
                `Could not estimate gas fees: ${err.message as string}`
            );

            approvalEstimate = ethers.BigNumber.from('1000000');
        }

        // Approve the add liquidity contract to spend entry tokens
        const {
            hash: approveHash,
        } = await daiContract.approve(
            addLiquidityContractAddress,
            baseApproveAmount,
            { gasPrice: baseGasPrice, gasLimit: approvalEstimate }
        );

        // setApprovalState('pending');
        toastWarn(`Approving tx ${compactHash(approveHash)}`);

        await provider.waitForTransaction(approveHash);

        console.log('THIS IS MINT PARAMS');
        console.log(mintParams);
        console.log('FN NAME', fnName);

        const decimals = parseInt(balances[token0]?.decimals || '0', 10);
        if (decimals === 0) {
            throw new Error(
                `Do not have decimal units for ${decimals} - unsafe, cannot proceed`
            );
        }

        let baseMsgValue = ethers.utils.parseUnits('0.005', 18);
        if (token0 === 'ETH') {
            baseMsgValue = baseMsgValue.add(amount0Desired);
        }
        const value = baseMsgValue.toString();

        // Call the contract and sign
        // let gasEstimate: ethers.BigNumber;

        // try {
        //     gasEstimate = await addLiquidityContract.estimateGas[
        //         fnName
        //     ](tokenId, mintParams, {
        //         gasPrice: baseGasPrice,
        //         value, // flat fee sent to contract - 0.0005 ETH - with ETH added if used as entry
        //     });

        //     // Add a 30% buffer over the ethers.js gas estimate. We don't want transactions to fail
        //     gasEstimate = gasEstimate.add(gasEstimate.div(3));
        // } catch (err) {
        //     // We could not estimate gas, for whaever reason, so we will use a high default to be safe.
        //     console.error(`Could not estimate gas: ${err.message as string}`);

        //     toastError('Could not estimate gas for this transaction. Check your parameters or try a different pool.');
        //     return;
        // }

        const { hash } = await addLiquidityContract[fnName](
            tokenId,
            mintParams,
            {
                gasPrice: baseGasPrice,
                value, // flat fee sent to contract - 0.0005 ETH - with ETH added if used as entry
            }
        );

        toastSuccess(`Submitted: ${compactHash(hash)}`);
    };

    if (!pool || !pool?.token0 || !pool?.token1) return null;
    debug.marketData = marketData;
    
    return (
        <>
            <div className='add-v3-container'>
                <Box
                    display='flex'
                    justifyContent='space-between'
                    alignItems='center'
                >
                    <div>Input Token(s) 2 max</div>
                    <Box display='flex'>
                        <div
                            className='token-with-logo'
                            onClick={() =>
                                setToken0(token0 ? '' : pool?.token0?.id)
                            }
                        >
                            {resolveLogo(pool?.token0?.id)}&nbsp;
                            {pool?.token0?.symbol}
                        </div>
                        <div
                            className='token-with-logo'
                            onClick={() =>
                                setToken1(token0 ? '' : pool?.token0?.id)
                            }
                        >
                            {resolveLogo(pool?.token1?.id)}&nbsp;
                            {pool?.token1?.symbol}
                        </div>
                        <div className='token-with-logo'>
                            {resolveLogo(ETH_ID)}&nbsp;
                            {'ETH'}
                        </div>
                    </Box>
                </Box>
                <br />
                <Box display='flex' justifyContent='space-between'>
                    <Box width='48%'>
                        <TokenWithBalance
                            id={pool.token0.id}
                            name={pool.token0.symbol}
                            balance={balances?.[token0Symbol]?.balance}
                            decimals={balances?.[token0Symbol]?.decimals}
                        />
                        <br />
                        <TokenWithBalance
                            id={pool.token1.id}
                            name={pool.token1.symbol}
                            balance={balances?.[token1Symbol]?.balance}
                            decimals={balances?.[token1Symbol]?.decimals}
                        />
                    </Box>
                    <Box width='48%'>
                        <TokenInput
                            token={token0Symbol}
                            amount={token0Amount}
                            updateAmount={setToken0Amount}
                            handleTokenRatio={() => {
                                return '';
                            }}
                            balances={balances}
                            twoSide={false}
                        />
                        <br />
                        <TokenInput
                            token={token1Symbol}
                            amount={token1Amount}
                            updateAmount={setToken1Amount}
                            handleTokenRatio={() => {
                                return '';
                            }}
                            balances={balances}
                            twoSide={true}
                        />
                    </Box>
                </Box>
                <br />
                <Box
                    display='flex'
                    justifyContent='space-between'
                    className='sentiment'
                >
                    <div
                        className={classNames({
                            active: sentiment === 'bullish',
                        })}
                        onClick={() => setSentiment('bullish')}
                    >
                        Bullish
                    </div>
                    <div
                        className={classNames({
                            active: sentiment === 'neutral',
                        })}
                        onClick={() => setSentiment('neutral')}
                    >
                        Neutral
                    </div>
                    <div
                        className={classNames({
                            active: sentiment === 'bearish',
                        })}
                        onClick={() => setSentiment('bearish')}
                    >
                        Bearish
                    </div>
                </Box>
                <br />
                <div className='preview'>
                    <Box display='flex' justifyContent='space-between'>
                        <div>Current Price</div>
                        <div>
                            <span className='face-deep'>
                                {currentPrice} {pool.token0.symbol} per{' '}
                                {pool.token1.symbol}
                            </span>
                        </div>
                    </Box>
                    <Box display='flex' justifyContent='space-between'>
                        <div>Liquidity Range</div>
                        <div>
                            <span className='face-positive'>
                                {liquidityLow} to {liquidityHigh}
                            </span>
                        </div>
                    </Box>
                    <Box display='flex' justifyContent='space-between'>
                        <div>Expected Price Impact</div>
                        <div>
                            <span className='price-impact'>0.2%</span>
                        </div>
                    </Box>
                </div>
                <br />
                <div>
                    <button className='btn-addl' onClick={doAddLiquidity}>
                        Add Liquidity
                    </button>
                </div>
            </div>
        </>
    );
};
