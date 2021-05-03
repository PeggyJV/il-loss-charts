import { useState } from 'react';

import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';
import { Price, Token } from '@uniswap/sdk-core';
import { priceToClosestTick } from '@uniswap/v3-sdk';

import './add-liquidity-v3.scss';
import 'rc-slider/assets/index.css';
import { Box } from '@material-ui/core';
import { EthGasPrices } from '@sommelier/shared-types';
import config from 'config';
import erc20Abi from 'constants/abis/erc20.json';
import addLiquidityAbi from 'constants/abis/uniswap_v3_add_liquidity.json';

import { TokenInput } from 'components/token-input';
import { WalletBalance } from 'components/wallet-balance';
import { toastSuccess, toastWarn } from 'util/toasters';
import { compactHash } from 'util/formats';

import { WalletBalances } from 'types/states';
import { useWallet } from 'hooks/use-wallet';
import { useMarketData } from 'hooks/use-market-data';
import { PoolOverview } from 'hooks/data-fetchers';
import { debug } from 'util/debug';

type Props = {
    balances: WalletBalances;
    pool: PoolOverview | null;
    gasPrices: EthGasPrices | null;
};

export type PriceDirection = 'bullish' | 'bearish' | 'neutral';

export const AddLiquidityV3 = ({
    balances,
    pool,
    gasPrices,
}: Props): JSX.Element | null => {
    const [token0Amount, setToken0Amount] = useState('0');
    const [token, setToken] = useState('ETH');
    // TODO calculate price impact
    const [slippageTolerance, setSlippageTolerance] = useState<number>(3.0);
    const [currentGasPrice, setCurrentGasPrice] = useState<number | undefined>(
        gasPrices?.standard
    );
    const { wallet } = useWallet();
    const [priceDirection, setPriceDirection] = useState<PriceDirection>('neutral');
    let provider: ethers.providers.Web3Provider | null = null;
    if (wallet.provider) {
        provider = new ethers.providers.Web3Provider(wallet?.provider);
    }

    (window as any).pool = pool;

    const token0 = pool?.token0?.id ?? '';
    const token1 = pool?.token1?.id ?? '';
    const { newPair: marketData, indicators } = useMarketData(token0, token1);
    (window as any).indicators = indicators;

    const SELECTED_INDICATOR_NAME = 'bollingerEMANormalBand';
    
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
            token === 'ETH'
                ? 'addLiquidityEthForUniV3'
                : 'addLiquidityForUniV3';
        const tokenId = 0;
        // TODO set real current price
        const currentPrice = 1634.7;
        // TODO calculate expected
        const expectedBaseAmount = parseFloat(token0Amount);
        const expectedQuoteAmount = expectedBaseAmount * currentPrice;
        const amount0Desired = ethers.utils
            .parseUnits(expectedBaseAmount.toString(), 18)
            .toString();
        const amount1Desired = ethers.utils
            .parseUnits(expectedQuoteAmount.toString(), 18)
            .toString();
            
        const slippageRatio = new BigNumber(slippageTolerance).div(100);
        const amount0Min = new BigNumber(expectedBaseAmount).times(new BigNumber(1).minus(slippageRatio));
        const amount1Min = new BigNumber(expectedQuoteAmount).times(new BigNumber(1).minus(slippageRatio));

        const indicator = indicators[SELECTED_INDICATOR_NAME];

        const [lowerBound, upperBound] = indicator.bounds[priceDirection];
        // Convert to lower tick and upper ticks
        const baseTokenCurrency = new Token(Number(wallet.network), pool.token0.id, Number(pool.token0.decimals), pool.token0.symbol, pool.token0.name);
        const quoteTokenCurrency = new Token(Number(wallet.network), pool.token0.id, Number(pool.token1.decimals), pool.token1.symbol, pool.token1.name);
        const lowerBoundPrice = new Price(baseTokenCurrency, quoteTokenCurrency, lowerBound, 1);
        const lowerBoundTick = priceToClosestTick(lowerBoundPrice);
        const upperBoundPrice = new Price(baseTokenCurrency, quoteTokenCurrency, upperBound, 1);
        const upperBoundTick = priceToClosestTick(upperBoundPrice);

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

        const decimals = parseInt(balances[token]?.decimals || '0', 10);
        if (decimals === 0) {
            throw new Error(
                `Do not have decimal units for ${decimals} - unsafe, cannot proceed`
            );
        }

        let baseMsgValue = ethers.utils.parseUnits('0.005', 18);
        if (token === 'ETH') {
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

    // useEffect(() => {
    //     const reserveLookup: Record<string, string> = {
    //         [pairData?.token0.symbol as string]: pairData?.reserve0 || '',
    //         [pairData?.token1.symbol as string]: pairData?.reserve1 || '',
    //     };
    //     // const CONTRACT_ADDRESS = twoSide
    //     //     ? EXCHANGE_TWO_SIDE_ADD_ABI_ADDRESS
    //     //     : EXCHANGE_ADD_ABI_ADDRESS;

    //     const CONTRACT_ADDRESS = '0xA522AA47C40F2BAC847cbe4D37455c521E69DEa7';

    // //     const tokenDataMap = Object.keys(balances).reduce<
    //         Record<
    //             string,
    //             {
    //                 id: string;
    //                 balance: string;
    //                 allowance: {
    //                     [address: string]: string;
    //                 };
    //                 reserve: string;
    //             }
    //         >
    //     >((acc, token) => {
    //         if (token === 'currentPair') return acc;
    //         const balance = ethers.utils.formatUnits(
    //             balances?.[token].balance || 0,
    //             parseInt(balances[token]?.decimals || '0', 10)
    //         );

    //         const allowance = ethers.utils.formatUnits(
    //             balances?.[token].allowance?.[CONTRACT_ADDRESS] || 0,
    //             parseInt(balances[token]?.decimals || '0', 10)
    //         );

    //         const id = balances?.[token].id;

    //         const reserve =
    //             token === 'ETH' ? reserveLookup['WETH'] : reserveLookup[token];

    //         acc[token] = {
    //             id,
    //             balance,
    //             allowance: {
    //                 [CONTRACT_ADDRESS]: allowance,
    //             },
    //             reserve,
    //         };
    //         return acc;
    //     }, {});

    //     setTokenData(tokenDataMap);
    // }, [balances, pairData]);

    // if (!marketData) return null;
    if (!pool || !pool?.token0 || !pool?.token1) return null;
    debug.marketData = marketData;
    const currentPrice = parseFloat(pool.token0Price);

    let liquidityLow, liquidityHigh;
    if (indicators == null) {
        liquidityLow = (currentPrice * 0.9).toString();
        liquidityHigh = (currentPrice * 1.1).toString();
    }

    return (
        <>
            <div className='add-v3-container'>
                <div className='token-and-wallet'>
                    <div className='token-pair-selector'>
                        <TokenInput
                            token={token}
                            amount={token0Amount}
                            updateAmount={setToken0Amount}
                            updateToken={(token) => {
                                console.log(token);
                                setToken(token);
                            }}
                            handleTokenRatio={() => {
                                return '';
                            }}
                            options={['ETH', token0, token1]}
                            balances={balances}
                            twoSide={false}
                        />
                        {/* <FontAwesomeIcon icon={faRetweet} /> */}

                        {/* <TokenInput
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
                        /> */}
                    </div>
                    <div className='wallet-fees'>
                        <WalletBalance balances={balances} />
                    </div>
                </div>
                <div className='preview'>
                    <Box display='flex' justifyContent='space-between'>
                        <div>Current Price</div>
                        <div>
                            <span className='face-deep'>{currentPrice} {pool.token0.symbol} per {pool.token1.symbol}</span>
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
