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
import { toastSuccess, toastWarn, toastError } from 'util/toasters';
import { compactHash } from 'util/formats';
import { WalletBalances } from 'types/states';
import { useWallet } from 'hooks/use-wallet';
import { useMarketData } from 'hooks';
import { LiquidityActionButton } from 'components/add-liquidity/liquidity-action-button';
import { EthGasPrices } from '@sommelier/shared-types';
import { PoolOverview } from 'hooks/data-fetchers';
import { debug } from 'util/debug';
import classNames from 'classnames';

type Props = {
    balances: WalletBalances;
    pool: PoolOverview | null;
    gasPrices: EthGasPrices | null;
};

export type Sentiment = 'bullish' | 'bearish' | 'neutral';

const ETH_ID = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export const AddLiquidityV3 = ({
    pool,
    balances,
    gasPrices,
}: Props): JSX.Element | null => {
    const [priceImpact, setPriceImpact] = useState('0');
    const [pendingApproval, setPendingApproval] = useState(false);
    const token0 = pool?.token0?.id ?? '';
    const token1 = pool?.token1?.id ?? '';
    const token0Symbol = pool?.token0?.symbol ?? '';
    const token1Symbol = pool?.token1?.symbol ?? '';

    // State here is used to compute what tokens are being used to add liquidity with.
    const initialState: Record<string, any> = {
        [token0Symbol]: {
            id: pool?.token0?.id,
            name: pool?.token0?.name,
            symbol: pool?.token0?.symbol,
            amount: '',
            selected: false,
        },
        [token1Symbol]: {
            id: pool?.token1?.id,
            name: pool?.token1?.name,
            symbol: pool?.token1?.symbol,
            amount: '',
            selected: false,
        },
        ETH: {
            id: ETH_ID,
            symbol: 'ETH',
            name: 'Ethereum',
            amount: '',
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

    const [tokenInputState, dispatch] = useReducer(reducer, initialState);

    // const [token, setToken] = useState('ETH');
    // TODO calculate price impact
    const { selectedGasPrice, slippageTolerance } = useContext(
        LiquidityContext
    );
    let currentGasPrice: number | null = null;
    if (gasPrices && selectedGasPrice) {
        currentGasPrice = gasPrices[selectedGasPrice];
    }

    const [sentiment, setSentiment] = useState<Sentiment>('neutral');
    const [bounds, setBounds] = useState<{
        prices: [number, number];
        ticks: [number, number];
    }>({ prices: [0, 0], ticks: [0, 0] });
    const [expectedAmounts, setExpectedAmounts] = useState<
        [BigNumber, BigNumber]
    >([new BigNumber(0), new BigNumber(0)]);
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
    debug.marketData = marketData;
    debug.indicators = indicators;


    const getTokensWithAmounts = () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return tokenInputState.selectedTokens.map(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            (symbol: string) => tokenInputState[symbol]
        );
    };

    debug.selectedTokens = getTokensWithAmounts();
    const SELECTED_INDICATOR_NAME = 'bollingerEMANormalBand';
    const currentPrice =
        marketData?.quotePrice ?? parseFloat(pool?.token0Price || '0');

    useEffect(() => {
        if (!pool) {
            return;
        }

        const getPriceImpact = () => {
            if (tokenInputState.selectedTokens.length !== 1) {
                return;
            }

            const selectedToken = tokenInputState.selectedTokens[0];

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

            console.log('THIS IS STATE', tokenInputState);
            const totalAmount = parseFloat(
                tokenInputState[selectedToken].amount
            );
            console.log('THIS IS TOTAL AMOUNT', totalAmount);
            let expectedBaseAmount: BigNumber, expectedQuoteAmount: BigNumber;

            if (selectedToken === 'ETH') {
                if (pool.token0.symbol === 'WETH') {
                    // selected token is base
                    expectedBaseAmount = new BigNumber(totalAmount).div(2);

                    // TODO: reintroduce once we have per-tick liquidity
                    // const baseAmountInBaseUnits = ethers.utils
                    //     .parseUnits(
                    //         expectedBaseAmount.toFixed(),
                    //         baseTokenCurrency.decimals
                    //     )
                    //     .toString()

                    // const [expectedOutput] = await uniPool.getOutputAmount(
                    //     new TokenAmount(baseTokenCurrency, baseAmountInBaseUnits)
                    // );

                    // expectedQuoteAmount = new BigNumber(expectedOutput.toFixed());
                    expectedQuoteAmount = expectedBaseAmount.times(
                        currentPrice
                    );
                } else {
                    // selected token is quote
                    expectedQuoteAmount = new BigNumber(totalAmount).div(2);

                    // TODO: reintroduce once we have per-tick liquidity
                    // const quoteAmountInBaseUnits = ethers.utils
                    //     .parseUnits(
                    //         expectedQuoteAmount.toFixed(),
                    //         baseTokenCurrency.decimals
                    //     )
                    //     .toString();

                    // const [expectedOutput] = await uniPool.getOutputAmount(
                    //     new TokenAmount(baseTokenCurrency, quoteAmountInBaseUnits)
                    // );

                    // expectedBaseAmount = new BigNumber(expectedOutput.toFixed());
                    expectedBaseAmount = expectedQuoteAmount.times(
                        1 / currentPrice
                    );
                }
            } else if (selectedToken === pool.token0.symbol) {
                // selected token is base
                expectedBaseAmount = new BigNumber(totalAmount).div(2);

                // TODO: reintroduce once we have per-tick liquidity
                // const baseAmountInBaseUnits = ethers.utils
                //     .parseUnits(
                //         expectedBaseAmount.toFixed(),
                //         baseTokenCurrency.decimals
                //     )
                //     .toString();

                // const [expectedOutput] = await uniPool.getOutputAmount(
                //     new TokenAmount(baseTokenCurrency, baseAmountInBaseUnits)
                // );

                // expectedQuoteAmount = new BigNumber(expectedOutput.toFixed());
                expectedQuoteAmount = expectedBaseAmount.times(currentPrice);
            } else {
                // selected token is quote
                expectedQuoteAmount = new BigNumber(totalAmount).div(2);

                // TODO: reintroduce once we have per-tick liquidity
                // const quoteAmountInBaseUnits = ethers.utils
                //     .parseUnits(
                //         expectedQuoteAmount.toFixed(),
                //         baseTokenCurrency.decimals
                //     )
                //     .toString()

                // const [expectedOutput] = await uniPool.getOutputAmount(
                //     new TokenAmount(baseTokenCurrency, quoteAmountInBaseUnits)
                // );

                // expectedBaseAmount = new BigNumber(expectedOutput.toFixed());
                expectedBaseAmount = expectedQuoteAmount.times(
                    1 / currentPrice
                );
            }

            setExpectedAmounts([expectedBaseAmount, expectedQuoteAmount]);

            const expectedQuoteAmountNoSlippage = expectedBaseAmount.times(
                currentPrice
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
    }, [tokenInputState, sentiment, indicators]);

    if (!pool) return null;

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

        const isEthAdd =
            tokenInputState.selectedTokens.length == 1 &&
            tokenInputState.selectedTokens[0] === 'ETH';

        const fnName = isEthAdd
            ? 'addLiquidityEthForUniV3'
            : 'addLiquidityForUniV3';
        const tokenId = 0;
        const [expectedBaseAmount, expectedQuoteAmount] = expectedAmounts;

        let expectedQuoteAmountNoSlippage: BigNumber;
        if (tokenInputState.selectedTokens.length === 1) {
            expectedQuoteAmountNoSlippage = expectedBaseAmount.times(
                currentPrice
            );
        } else {
            expectedQuoteAmountNoSlippage = expectedQuoteAmount;
        }

        console.log('SLIPPAGE RATIO', slippageTolerance);
        const slippageRatio = new BigNumber(slippageTolerance as number).div(
            100
        );
        const amount0Min = new BigNumber(expectedBaseAmount).times(
            new BigNumber(1).minus(slippageRatio)
        );
        const amount1Min = new BigNumber(expectedQuoteAmountNoSlippage).times(
            new BigNumber(1).minus(slippageRatio)
        );

        const baseAmount0Desired = ethers.utils
            .parseUnits(
                expectedBaseAmount.toFixed(Number(pool.token0.decimals)),
                pool.token0.decimals
            )
            .toString();

        const baseAmount1Desired = ethers.utils
            .parseUnits(
                expectedQuoteAmountNoSlippage.toFixed(
                    Number(pool.token1.decimals)
                ),
                pool.token1.decimals
            )
            .toString();

        const baseAmount0Min = ethers.utils
            .parseUnits(
                amount0Min.toFixed(Number(pool.token0.decimals)),
                pool.token0.decimals
            )
            .toString();
        const baseAmount1Min = ethers.utils
            .parseUnits(
                amount1Min.toFixed(Number(pool.token0.decimals)),
                pool.token1.decimals
            )
            .toString();

        const mintParams = [
            token0, // token0
            token1, // token1
            pool.feeTier, // feeTier
            bounds.ticks[0], // tickLower
            bounds.ticks[1], // tickUpper
            baseAmount0Desired, // amount0Desired
            baseAmount1Desired, // amount1Desired
            baseAmount0Min, // amount0Min
            baseAmount1Min, // amount1Min
            wallet.account, // recipient
            Math.floor(Date.now() / 1000) + 86400000, // deadline
        ];

        const baseGasPrice = ethers.utils
            .parseUnits(currentGasPrice.toString(), 9)
            .toString();

        // approve DAI. TODO: Make this approval separate
        for (const tokenSymbol of tokenInputState.selectedTokens) {
            if (tokenSymbol === 'ETH') continue;
            const erc20Contract = new ethers.Contract(
                tokenInputState[tokenSymbol].id,
                erc20Abi,
                signer
            );

            const amountDesired =
                tokenSymbol === pool.token0.symbol
                    ? baseAmount0Desired
                    : baseAmount1Desired;

            const baseApproveAmount = ethers.utils
                .parseUnits((parseInt(amountDesired, 10) * 100).toString(), 18)
                .toString();

            // Call the contract and sign
            let approvalEstimate: ethers.BigNumber;

            try {
                approvalEstimate = await erc20Contract.estimateGas.approve(
                    addLiquidityContractAddress,
                    baseApproveAmount,
                    { gasPrice: baseGasPrice }
                );

                // Add a 30% buffer over the ethers.js gas estimate. We don't want transactions to fail
                approvalEstimate = approvalEstimate.add(
                    approvalEstimate.div(3)
                );
            } catch (err) {
                // We could not estimate gas, for whaever reason, so we will use a high default to be safe.
                console.error(
                    `Could not estimate gas fees: ${err.message as string}`
                );

                approvalEstimate = ethers.BigNumber.from('1000000');
            }

            // Approve the add liquidity contract to spend entry tokens
            setPendingApproval(true);
            const {
                hash: approveHash,
            } = await erc20Contract.approve(
                addLiquidityContractAddress,
                baseApproveAmount,
                { gasPrice: baseGasPrice, gasLimit: approvalEstimate }
            );

            // setApprovalState('pending');
            toastWarn(`Approving tx ${compactHash(approveHash)}`);

            await provider.waitForTransaction(approveHash);
            setPendingApproval(false);
        }

        console.log('THIS IS MINT PARAMS');
        console.log(mintParams);
        console.log('FN NAME', fnName);

        let baseMsgValue = ethers.utils.parseUnits('0.005', 18);
        if (tokenInputState.selectedTokens.includes('ETH')) {
            const ethAmount = ethers.utils.parseEther(
                tokenInputState['ETH'].amount
            );
            baseMsgValue = baseMsgValue.add(ethAmount);
        }

        const value = baseMsgValue.toString();

        // Call the contract and sign
        let gasEstimate: ethers.BigNumber;

        try {
            gasEstimate = await addLiquidityContract.estimateGas[fnName](
                tokenId,
                mintParams,
                {
                    gasPrice: baseGasPrice,
                    value, // flat fee sent to contract - 0.0005 ETH - with ETH added if used as entry
                }
            );

            // Add a 30% buffer over the ethers.js gas estimate. We don't want transactions to fail
            gasEstimate = gasEstimate.add(gasEstimate.div(3));
        } catch (err) {
            // We could not estimate gas, for whaever reason, so we will use a high default to be safe.
            console.error(`Could not estimate gas: ${err.message as string}`);

            toastError(
                'Could not estimate gas for this transaction. Check your parameters or try a different pool.'
            );
            return;
        }

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

    const selectedSymbolCount = tokenInputState.selectedTokens.length;
    const isToken0Active = tokenInputState?.[token0Symbol]?.selected;
    const isToken1Active = tokenInputState?.[token1Symbol]?.selected;
    const isTokenETHActive = tokenInputState?.['ETH']?.selected;
    const isToken0Disabled = !isToken0Active && selectedSymbolCount === 2;
    const isToken1Disabled = !isToken1Active && selectedSymbolCount === 2;
    const isTokenETHDisabled =
        !isTokenETHActive &&
        (selectedSymbolCount === 2 || tokenInputState['WETH']?.selected);
    const selectedSymbol0 = tokenInputState.selectedTokens[0];
    const selectedSymbol1 = tokenInputState.selectedTokens[1];
    const disableWETH = tokenInputState['ETH'].selected;

    return (
        <>
            <div className='add-v3-container'>
                <Box
                    display='flex'
                    justifyContent='space-between'
                    alignItems='center'
                >
                    <div>Select 1 or 2 token(s)</div>
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
                            {/* {resolveLogo(pool?.token0?.id)}&nbsp; */}
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
                            {/* {resolveLogo(pool?.token1?.id)}&nbsp; */}
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
                            {/* {resolveLogo(ETH_ID)}&nbsp; */}
                            {'ETH'}
                        </button>
                    </Box>
                </Box>
                <br />
                <Box display='flex' justifyContent='space-between'>
                    <Box width='48%'>
                        {selectedSymbol0 && (
                            <TokenWithBalance
                                id={tokenInputState[selectedSymbol0].id}
                                name={selectedSymbol0}
                                balance={balances?.[selectedSymbol0]?.balance}
                                decimals={balances?.[selectedSymbol0]?.decimals}
                            />
                        )}
                        <br />
                        {selectedSymbol1 && (
                            <TokenWithBalance
                                id={tokenInputState[selectedSymbol1].id}
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
                                amount={tokenInputState[selectedSymbol0].amount}
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
                                amount={tokenInputState[selectedSymbol1].amount}
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
                    {/* TODO Re-introduce once we know per-tick liqudity
                        {selectedSymbolCount == 1 && (
                        <Box display='flex' justifyContent='space-between'>
                            <div>Expected Price Impact</div>
                            <div>
                                <span className='price-impact'>
                                    {priceImpact}%
                                </span>
                            </div>
                        </Box>
                    )} */}
                </div>
                <br />
                <div>
                    <LiquidityActionButton
                        tokenInputState={tokenInputState}
                        pendingApproval={pendingApproval}
                        onClick={() => doAddLiquidity()}
                        balances={balances}
                    />
                </div>
            </div>
        </>
    );
};
