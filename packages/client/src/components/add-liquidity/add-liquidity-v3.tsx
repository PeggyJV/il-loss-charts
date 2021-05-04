import { useState, useContext, useEffect, useReducer } from 'react';

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

const ETH_ID = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export const AddLiquidityV3 = ({
    pool,
    balances,
}: Props): JSX.Element | null => {
    const [token0Amount, setToken0Amount] = useState('0');
    const [token1Amount, setToken1Amount] = useState('0');
    const [priceImpact, setPriceImpact] = useState('0');

    const token0 = pool?.token0?.id ?? '';
    const token1 = pool?.token1?.id ?? '';
    const token0Symbol = pool?.token0?.symbol ?? '';
    const token1Symbol = pool?.token1?.symbol ?? '';

    // State here is used to compute what tokens are being used to add liquidity with.

    // one-side or not
    // token0 id symbol amount
    // token1 id symbol amount
    const initialState: Record<string, any> = {
        [token0Symbol]: {
            id: pool?.token0?.id,
            name: pool?.token0?.name,
            symbol: pool?.token0?.symbol,
            amount: 0,
            selected: false,
        },
        [token1Symbol]: {
            id: pool?.token1?.id,
            name: pool?.token1?.name,
            symbol: pool?.token1?.symbol,
            amount: 0,
            selected: false,
        },
        ETH: {
            id: ETH_ID,
            symbol: 'ETH',
            name: 'Ethereum',
            amount: 0,
            selected: true,
        },
        selectedTokens: ['ETH'],
        isWETHSelected:
            pool?.token0?.symbol === 'WETH' || pool?.token1?.symbol === 'WETH',
    };

    const reducer = (
        state: { [x: string]: any },
        action: { type: any; payload: { sym: any; amount?: any } }
    ) => {
        let sym: string;
        let amt: string;
        let selectedSymbols: Array<string>;
        // eslint-disable-next-line no-debugger
        switch (action.type) {
            case 'toggle':
                sym = action.payload.sym;
                // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
                selectedSymbols = state[sym].selected
                    ? state.selectedTokens.filter(
                          (symbol: string) => symbol !== sym
                      )
                    : [...state.selectedTokens, sym];

                return {
                    ...state,
                    selectedTokens: selectedSymbols,
                    [sym]: { ...state[sym], selected: !state[sym].selected },
                };
            case 'update-amount':
                sym = action.payload.sym;
                amt = action.payload.amount;
                return {
                    ...state,
                    [sym]: { ...state[sym], amount: amt },
                };
            default:
                throw new Error();
        }
    };

    const [state, dispatch] = useReducer(reducer, initialState);

    // const [token, setToken] = useState('ETH');
    // TODO calculate price impact
    const { currentGasPrice, slippageTolerance } = useContext(LiquidityContext);
    const [sentiment, setSentiment] = useState<Sentiment>('neutral');
    const [bounds, setBounds] = useState<{
        prices: [number, number];
        ticks: [number, number];
    }>({ prices: [0, 0], ticks: [0, 0] });
    const { wallet } = useWallet();

    let provider: ethers.providers.Web3Provider | null = null;
    if (wallet.provider) {
        provider = new ethers.providers.Web3Provider(wallet?.provider);
    }

    (window as any).pool = pool;
    // const token0 = pool?.token0?.id ?? '';
    // const token1 = pool?.token1?.id ?? '';

    const { newPair: marketData, indicators } = useMarketData(
        pool?.token1,
        pool?.token0,
        wallet.network
    );
    (window as any).marketData = marketData;
    (window as any).indicators = indicators;

    // returns a tuple [token0, token1];
    const getTokensWithAmounts = () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return state.selectedTokens.map((symbol: string) => state[symbol]);
    };

    debug.selectedTokens = getTokensWithAmounts();
    const SELECTED_INDICATOR_NAME = 'bollingerEMANormalBand';
    const currentPrice =
        marketData?.quotePrice ?? parseFloat(pool?.token0Price || '0');

    useEffect(() => {
        if (!pool) {
            return;
        }

        const getPriceImpact = async () => {
            const baseTokenCurrency = new Token(
                Number(wallet.network),
                pool.token0.id,
                Number(pool.token0.decimals),
                pool.token0.symbol,
                pool.token0.name
            );
            const quoteTokenCurrency = new Token(
                Number(wallet.network),
                pool.token1.id,
                Number(pool.token1.decimals),
                pool.token1.symbol,
                pool.token1.name
            );

            const uniPool = new Pool(
                baseTokenCurrency,
                quoteTokenCurrency,
                (parseInt(pool.feeTier, 10) as any) as FeeAmount,
                pool.sqrtPrice,
                pool.liquidity,
                parseInt(pool.tick || '0', 10),
                []
            );

            const totalAmount = parseFloat(token0Amount);
            const expectedBaseAmount = totalAmount / 2;

            const [expectedQuoteAmount] = await uniPool.getOutputAmount(
                new TokenAmount(baseTokenCurrency, expectedBaseAmount)
            );
            const priceImpact = new BigNumber(expectedQuoteAmountNoSlippage)
                .minus(expectedQuoteAmount.toFixed(8))
                .div(expectedQuoteAmountNoSlippage)
                .times(100)
                .toFixed();

            setPriceImpact(priceImpact);

            debug.indicators = indicators;

            if (indicators) {
                const indicator = indicators[SELECTED_INDICATOR_NAME];
                const [lowerBound, upperBound] = indicator.bounds[sentiment];

                // Convert to lower tick and upper ticks
                const lowerBoundPrice = new Price(
                    baseTokenCurrency,
                    quoteTokenCurrency,
                    ethers.utils
                        .parseUnits(
                            lowerBound.toString(),
                            quoteTokenCurrency.decimals
                        )
                        .toString(),
                    1
                );
                const lowerBoundTick = priceToClosestTick(lowerBoundPrice);
                const upperBoundPrice = new Price(
                    baseTokenCurrency,
                    quoteTokenCurrency,
                    ethers.utils
                        .parseUnits(
                            upperBound.toString(),
                            quoteTokenCurrency.decimals
                        )
                        .toString(),
                    1
                );
                const upperBoundTick = priceToClosestTick(upperBoundPrice);

                setBounds({
                    prices: [lowerBound, upperBound],
                    // prices: [lowerBoundPrice.toFixed(), upperBoundPrice.toFixed()],
                    ticks: [lowerBoundTick, upperBoundTick],
                });
            }
        };

        void getPriceImpact();
    }, [token0Amount, sentiment]);

    if (!pool) return null;

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
            bounds.ticks[0], // tickLower
            bounds.ticks[1], // tickUpper
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

    // if (!pool || !pool?.token0 || !pool?.token1) return null;
    debug.marketData = marketData;

    const selectedSymbolCount = state.selectedTokens.length;
    const isToken0Active = state?.[token0Symbol]?.selected;
    const isToken1Active = state?.[token1Symbol]?.selected;
    const isTokenETHActive = state?.['ETH']?.selected;
    const isToken0Disabled = !isToken0Active && selectedSymbolCount === 2;
    const isToken1Disabled = !isToken1Active && selectedSymbolCount === 2;
    const isTokenETHDisabled =
        !isTokenETHActive &&
        (selectedSymbolCount === 2 || state['WETH']?.selected);
    const selectedSymbol0 = state.selectedTokens[0];
    const selectedSymbol1 = state.selectedTokens[1];
    const disableWETH = state['ETH'].selected;
    return (
        <>
            <div className='add-v3-container'>
                <Box
                    display='flex'
                    justifyContent='space-between'
                    alignItems='center'
                >
                    <div>Input Token(s) 2 max</div>
                    <Box display='flex' className='token-select'>
                        <button
                            className={classNames('token-with-logo', {
                                active: isToken0Active,
                                disabled:
                                    isToken0Disabled ||
                                    (token0Symbol === 'WETH' && disableWETH),
                            })}
                            disabled={
                                isToken0Disabled ||
                                (token0Symbol === 'WETH' && disableWETH)
                            }
                            onClick={() => {
                                dispatch({
                                    type: 'toggle',
                                    payload: { sym: token0Symbol },
                                });
                            }}
                        >
                            {resolveLogo(pool?.token0?.id)}&nbsp;
                            {pool?.token0?.symbol}
                        </button>
                        <button
                            className={classNames('token-with-logo', {
                                active: isToken1Active,
                                disabled:
                                    isToken1Disabled ||
                                    (token1Symbol === 'WETH' && disableWETH),
                            })}
                            disabled={
                                isToken1Disabled ||
                                (token1Symbol === 'WETH' && disableWETH)
                            }
                            onClick={() => {
                                if (
                                    !isToken1Active &&
                                    selectedSymbolCount === 2
                                )
                                    return;
                                dispatch({
                                    type: 'toggle',
                                    payload: { sym: token1Symbol },
                                });
                            }}
                        >
                            {resolveLogo(pool?.token1?.id)}&nbsp;
                            {pool?.token1?.symbol}
                        </button>
                        <button
                            className={classNames('token-with-logo', {
                                active: isTokenETHActive,
                                disabled: isTokenETHDisabled,
                            })}
                            disabled={isTokenETHDisabled}
                            onClick={() => {
                                if (
                                    !isTokenETHActive &&
                                    selectedSymbolCount === 2
                                )
                                    return;
                                dispatch({
                                    type: 'toggle',
                                    payload: { sym: 'ETH' },
                                });
                            }}
                        >
                            {resolveLogo(ETH_ID)}&nbsp;
                            {'ETH'}
                        </button>
                    </Box>
                </Box>
                <br />
                <Box display='flex' justifyContent='space-between'>
                    <Box width='48%'>
                        {selectedSymbol0 && (
                            <TokenWithBalance
                                id={state[selectedSymbol0].id}
                                name={selectedSymbol0}
                                balance={balances?.[selectedSymbol0]?.balance}
                                decimals={balances?.[selectedSymbol0]?.decimals}
                            />
                        )}
                        <br />
                        {selectedSymbol1 && (
                            <TokenWithBalance
                                id={state[selectedSymbol1].id}
                                name={selectedSymbol1}
                                balance={balances?.[selectedSymbol1]?.balance}
                                decimals={balances?.[selectedSymbol1]?.decimals}
                            />
                        )}
                    </Box>
                    <Box width='48%'>
                        {selectedSymbol0 && (
                            <TokenInput
                                token={selectedSymbol0}
                                amount={state[selectedSymbol0].amount}
                                updateAmount={(amt: string) => {
                                    dispatch({
                                        type: 'update-amount',
                                        payload: {
                                            sym: selectedSymbol0,
                                            amount: amt,
                                        },
                                    });
                                }}
                                handleTokenRatio={() => {
                                    return '';
                                }}
                                balances={balances}
                                twoSide={false}
                            />
                        )}
                        <br />
                        {selectedSymbol1 && (
                            <TokenInput
                                token={selectedSymbol1}
                                amount={state[selectedSymbol1].amount}
                                updateAmount={(amt: string) => {
                                    dispatch({
                                        type: 'update-amount',
                                        payload: {
                                            sym: selectedSymbol1,
                                            amount: amt,
                                        },
                                    });
                                }}
                                handleTokenRatio={() => {
                                    return '';
                                }}
                                balances={balances}
                                twoSide={true}
                            />
                        )}
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
                            'sentiment-button': true,
                            active: sentiment === 'bearish',
                        })}
                        onClick={() => setSentiment('bearish')}
                    >
                        📉 Bearish
                    </div>
                    <div
                        className={classNames({
                            'sentiment-button': true,
                            active: sentiment === 'neutral',
                        })}
                        onClick={() => setSentiment('neutral')}
                    >
                        Neutral
                    </div>
                    <div
                        className={classNames({
                            'sentiment-button': true,
                            active: sentiment === 'bullish',
                        })}
                        onClick={() => setSentiment('bullish')}
                    >
                        📈 Bullish
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
                                {bounds.prices[0]} to {bounds.prices[1]}
                            </span>
                        </div>
                    </Box>
                    {selectedSymbolCount == 1 && (
                        <Box display='flex' justifyContent='space-between'>
                            <div>Expected Price Impact</div>
                            <div>
                                <span className='price-impact'>
                                    {priceImpact}%
                                </span>
                            </div>
                        </Box>
                    )}
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
