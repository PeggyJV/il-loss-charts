import { useState } from 'react';
import {
    Row,
    Col,
    Form,
    FormControl,
    InputGroup
} from 'react-bootstrap';

import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';
import classNames from 'classnames';
import './add-liquidity-v3.scss';
import 'rc-slider/assets/index.css';

import { EthGasPrices, IUniswapPair } from '@sommelier/shared-types';
import config from 'config';
import erc20Abi from 'constants/abis/erc20.json';
import addLiquidityAbi from 'constants/abis/uniswap_v3_add_liquidity.json';

import { TokenInput } from 'components/token-input';
import { WalletBalance } from 'components/wallet-balance';
import { toastSuccess, toastError, toastWarn } from 'util/toasters';
import { compactHash } from 'util/formats';

import { Wallet, WalletBalances } from 'types/states';
import { useMarketData } from 'hooks/use-market-data';

type Props = {
    wallet: Wallet;
    balances: WalletBalances;
    pairData: IUniswapPair | null;
    gasPrices: EthGasPrices | null;
};

export const AddLiquidityV3 = ({
    wallet,
    balances,
    pairData,
    gasPrices,
}: Props): JSX.Element | null => {
    const [token0Amount, setToken0Amount] = useState('0');
    const [token, setToken] = useState('ETH');
    const [slippageTolerance, setSlippageTolerance] = useState<number>(3.0);
    const [currentGasPrice, setCurrentGasPrice] = useState<number | undefined>(
        gasPrices?.standard
    );

    let provider: ethers.providers.Web3Provider | null = null;
    if (wallet.provider) {
        provider = new ethers.providers.Web3Provider(wallet?.provider);
    }

    const token0 = pairData?.token0.id ?? '';
    const token1 = pairData?.token1.id ?? '';
    const marketData = useMarketData(token0, token1);

    const doAddLiquidity = async () => {
        if (!pairData || !provider) return;
        if (!currentGasPrice) {
            throw new Error('Gas price not selected.');
        }

        const addLiquidityContractAddress = config.networks[wallet.network || '1']?.contracts?.ADD_LIQUIDITY_V3;

        if (!addLiquidityContractAddress) {
            throw new Error('Add liquidity contract not available on this network.');
        }

        // Create signer
        const signer = provider.getSigner();
        // Create read-write contract instance
        const addLiquidityContract = new ethers.Contract(
            addLiquidityContractAddress,
            addLiquidityAbi,
            signer
        );

        (window as any).contract = addLiquidityContract;

        // TODO get these addresses from pool
        const side0 = '0xc778417E063141139Fce010982780140Aa0cD5Ab';
        const side1 = '0xc7AD46e0b8a400Bb3C915120d284AafbA8fc4735';

        const fnName = token === 'ETH' ? 'addLiquidityEthForUniV3' : 'addLiquidityForUniV3';
        const tokenId = 0;
        const currentPrice = 1634.7;
        const baseAmount = parseFloat(token0Amount);
        const quoteAmount = baseAmount * currentPrice;
        const amount0Desired = ethers.utils.parseUnits(baseAmount.toString(), 18).toString();
        const amount1Desired = ethers.utils.parseUnits(quoteAmount.toString(), 18).toString();

        const mintParams = [
            side0,                                                 // token0
            side1,                                                 // token1
            500,                                                   // feeTier TODO: get from pairData
            75490,                                                  // tickLower TODO: choose dynamically from price and strategy
            77810,                                                  // tickUpper TODO: choose dynamically from price and strategy
            amount0Desired,                                         // amount0Desired
            amount1Desired,                                         // amount1Desired
            0,                                                      // amount0Min TODO: use price impact to set min
            0,                                                      // amount1Min TODO: use price impact to set min
            wallet.account,                                         // recipient
            Math.floor(Date.now() / 1000) + 86400000                // deadline
        ];

        // approve DAI. TODO: Make this approval separate
        const daiContract = new ethers.Contract(
            side1,
            erc20Abi,
            signer
        );

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
        const { hash: approveHash } = await daiContract.approve(
            addLiquidityContractAddress,
            baseApproveAmount,
            { gasPrice: baseGasPrice, gasLimit: approvalEstimate }
        );

        // setApprovalState('pending');
        toastWarn(`Approving tx ${compactHash(approveHash)}`);

        await provider.waitForTransaction(approveHash);


        console.log('THIS IS MINT PARAMS')
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
        let gasEstimate: ethers.BigNumber;

        try {
            gasEstimate = await addLiquidityContract.estimateGas[
                fnName
            ](tokenId, mintParams, {
                gasPrice: baseGasPrice,
                value, // flat fee sent to contract - 0.0005 ETH - with ETH added if used as entry
            });

            // Add a 30% buffer over the ethers.js gas estimate. We don't want transactions to fail
            gasEstimate = gasEstimate.add(gasEstimate.div(3));
        } catch (err) {
            // We could not estimate gas, for whaever reason, so we will use a high default to be safe.
            console.error(`Could not estimate gas: ${err.message as string}`);
            (window as any).gasError = err;

            toastError('Could not estimate gas for this transaction. Check your parameters or try a different pool.');
            return;
        }

        const { hash } = await addLiquidityContract[
            fnName
        ](tokenId, mintParams, {
            gasPrice: baseGasPrice,
            value, // flat fee sent to contract - 0.0005 ETH - with ETH added if used as entry
        });

        toastSuccess(`Submitted: ${compactHash(hash)}`);
    }

    // (window as any).tokenData = tokenData;
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

    if (!pairData || !marketData) return null;
    (window as any).marketData = marketData;
    const currentPrice = marketData.quotePrice || 1.234352;
    const liquidityLow = (currentPrice * 0.9).toString();
    const liquidityHigh = (currentPrice * 1.1).toString();

    const TransactionSettings = () => (
        <>
            <p className='sub-heading'>
                <strong>Transaction Settings</strong>
            </p>
            {(
                <Form.Group as={Row}>
                    <Form.Label column sm={6}>
                        Slippage Tolerance
                    </Form.Label>
                    <Col sm={2}></Col>
                    <Col sm={4}>
                        <InputGroup>
                            <FormControl
                                min='0'
                                className='slippage-tolerance-input'
                                value={slippageTolerance}
                                type='number'
                                onChange={(e) => {
                                    setSlippageTolerance(
                                        parseFloat(e.target.value)
                                    );
                                }}
                            />
                            <InputGroup.Append>
                                <InputGroup.Text>%</InputGroup.Text>
                            </InputGroup.Append>
                        </InputGroup>
                    </Col>
                </Form.Group>
            )}
            {gasPrices && (
                <Form.Group as={Row} className='transaction-speed-input'>
                        <Form.Label column sm={4}>Transaction Speed</Form.Label>
                        <Col className='gas-prices-input' sm={8}>   
                            <div className='button-group-h'>
                                <button
                                    className={classNames({
                                        active: currentGasPrice === gasPrices.standard,
                                    })}
                                    onClick={() =>
                                        setCurrentGasPrice(gasPrices.standard)
                                    }
                                >
                                    Standard <br />({gasPrices.standard} Gwei)
                                </button>
                                <button
                                    className={classNames({
                                        active: currentGasPrice === gasPrices.fast,
                                    })}
                                    onClick={() => setCurrentGasPrice(gasPrices.fast)}
                                >
                                    Fast <br />({gasPrices.fast} Gwei)
                                </button>
                                <button
                                    className={classNames({
                                        active: currentGasPrice === gasPrices.fastest,
                                    })}
                                    onClick={() =>
                                        setCurrentGasPrice(gasPrices.fastest)
                                    }
                                >
                                    Fastest <br />({gasPrices.fastest} Gwei)
                                </button>
                            </div>
                        </Col>
                </Form.Group>
            )}
        </>
    );

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
                <div className='price-container'>
                    <h3 className='price-heading'>Current Price: {currentPrice}</h3>
                    <p className='liquidity-heading'>Liquidity Range: {liquidityLow} to {liquidityHigh}</p>
                    <p className='liquidity-heading'>Expected Price Impact <span className='price-impact'>0.2%</span></p>
                </div>
                <TransactionSettings />
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
                        <button className='btn-addl' onClick={doAddLiquidity}>ADD LIQUIDITY</button>
                    </div>
                </div>
            </div>
        </>
    );
};
