import { useState, useEffect, useContext, useCallback } from 'react';
import {
    Row,
    Col,
    Form,
    FormControl,
    InputGroup,
    Modal,
} from 'react-bootstrap';

import { ethers } from 'ethers';
import BigNumber from 'bignumber.js';
import { PendingTxContext, PendingTx } from 'app';
import { compactHash } from 'util/formats';
import { TokenInput } from 'components/token-input';
import { WalletBalance } from 'components/wallet-balance';
import mixpanel from 'util/mixpanel';
import erc20Abi from 'constants/abis/erc20.json';
import exchangeAddAbi from 'constants/abis/volumefi_add_liquidity_uniswap.json';
import exchangeTwoSideAddAbi from 'constants/abis/volumefi_two_side_add_liquidity_uniswap.json';

const EXCHANGE_ADD_ABI_ADDRESS = '0xFd8A61F94604aeD5977B31930b48f1a94ff3a195';
const EXCHANGE_TWO_SIDE_ADD_ABI_ADDRESS =
    '0xA522AA47C40F2BAC847cbe4D37455c521E69DEa7';

import {
    EthGasPrices,
    LPPositionData,
    IUniswapPair,
} from '@sommelier/shared-types';
import {
    Wallet,
    WalletBalances,
    ManageLiquidityActionState,
} from 'types/states';

import { calculatePoolEntryData } from 'util/uniswap-pricing';

import { resolveLogo } from 'components/token-with-logo';
import { AddLiquidityActionButton } from 'components/liquidity-action-button';
import classNames from 'classnames';
import { toastWarn } from 'util/toasters';

function AddLiquidity({
    wallet,
    provider,
    pairData,
    positionData,
    gasPrices,
    balances,
    onDone,
    onClose,
}: {
    wallet: Wallet;
    provider: ethers.providers.Web3Provider | null;
    pairData: IUniswapPair | null;
    positionData: LPPositionData<string> | null;
    gasPrices: EthGasPrices | null;
    balances: WalletBalances;
    onDone: (hash?: string) => void;
    onClose: () => void;
}): JSX.Element | null {
    const [tokenOne, setTokenOne] = useState<string>('ETH');
    const [tokenTwo, setTokenTwo] = useState<string>('');
    const [tokenOneAmount, setTokenOneAmount] = useState<string>('');
    const [tokenTwoAmount, setTokenTwoAmount] = useState<string>('');
    const [slippageTolerance, setSlippageTolerance] = useState<number>(3.0);
    const [currentGasPrice, setCurrentGasPrice] = useState<number | undefined>(
        gasPrices?.standard
    );
    const [approvalState, setApprovalState] = useState<'needed' | 'done'>(
        'needed'
    );
    // const [tokensNeedApproval, setTokensNeedApproval] = useState<Set<string>>(
    //     new Set()
    // );

    /* 
        token: {allowance, balance}
    */
    const [tokenData, setTokenData] = useState<Record<
        string,
        {
            id: string;
            balance: string;
            allowance: { [a: string]: string };
            reserve: string;
        }
    > | null>(null);
    const [approvalList, setApprovalList] = useState<Set<string>>(new Set());
    const [twoSide, setTwoSide] = useState<boolean>(false);
    const [txSubmitted, setTxSubmitted] = useState(false);
    // const maxBalance = balances[entryToken]?.balance;
    // const maxBalanceStr = ethers.utils.formatUnits(
    //     maxBalance || 0,
    //     parseInt(balances[entryToken]?.decimals || '0', 10)
    // );

    const { setPendingTx } = useContext(PendingTxContext);

    const resetForm = () => {
        setTokenOne('ETH');
        setTokenOneAmount('');
        setTokenTwo('');
        setTokenTwoAmount('');
        setSlippageTolerance(3.0);
        setTwoSide(false);
    };

    const {
        expectedLpTokens,
        expectedPoolToken0,
        expectedPoolToken1,
        expectedPriceImpact,
    } = calculatePoolEntryData(pairData, tokenOne, tokenOneAmount);

    // Effect checks allowances and updates approval state
    // TODO allowances seems like an abstraction, custom hook this
    useEffect(() => {
        // No need to check allowances for ETH
        if (!twoSide) {
            if (tokenOne === 'ETH' || !tokenOneAmount) return;

            const allowance =
                balances[tokenOne]?.allowance?.[
                    EXCHANGE_TWO_SIDE_ADD_ABI_ADDRESS
                ];

            if (!allowance) return;

            const tokenOneAmountBig = new BigNumber(tokenOneAmount);
            const allowanceStr = ethers.utils.formatUnits(
                allowance || 0,
                parseInt(balances[tokenOne]?.decimals || '0', 10)
            );
            const allowanceNum = new BigNumber(allowanceStr);
            // If allowance is less than entry amount, make it needed
            if (tokenOneAmountBig.gt(allowanceNum)) {
                setApprovalState('needed');
                setApprovalList((list) => {
                    const newList = new Set(list);
                    newList.add(tokenOne);
                    return newList;
                });
                return;
            }
        } else {
            if (!tokenOneAmount || !tokenTwoAmount) return;

            const tokenOneAmountBig = new BigNumber(tokenOneAmount);
            const tokenTwoAmountBig = new BigNumber(tokenTwoAmount);
            const allowanceOne =
                tokenData?.[tokenOne]?.allowance?.[
                    EXCHANGE_TWO_SIDE_ADD_ABI_ADDRESS
                ] || '0';
            const allowanceTwo =
                tokenData?.[tokenTwo]?.allowance?.[
                    EXCHANGE_TWO_SIDE_ADD_ABI_ADDRESS
                ] || '0';
            const allowanceOneBig = new BigNumber(allowanceOne);
            const allowanceTwoBig = new BigNumber(allowanceTwo);
            const cond1 =
                tokenOne !== 'ETH' && tokenOneAmountBig.gt(allowanceOneBig);
            const cond2 =
                tokenTwo !== 'ETH' && tokenTwoAmountBig.gt(allowanceTwoBig);

            if (cond1 || cond2) {
                cond1 &&
                    setApprovalList((list) => {
                        const newList = new Set(list);
                        newList.add(tokenOne);
                        return newList;
                    });
                cond2 &&
                    setApprovalList((list) => {
                        const newList = new Set(list);
                        newList.add(tokenTwo);
                        return newList;
                    });

                setApprovalState('needed');
                return;
            }
        }

        setApprovalState('done');
    }, [
        tokenOne,
        tokenOneAmount,
        balances,
        twoSide,
        tokenTwoAmount,
        tokenData,
        tokenTwo,
    ]);

    useEffect(() => {
        const reserveLookup: Record<string, string> = {
            [pairData?.token0.symbol as string]: pairData?.reserve0 || '',
            [pairData?.token1.symbol as string]: pairData?.reserve1 || '',
        };
        const CONTRACT_ADDRESS = twoSide
            ? EXCHANGE_TWO_SIDE_ADD_ABI_ADDRESS
            : EXCHANGE_ADD_ABI_ADDRESS;

        const tokenDataMap = Object.keys(balances).reduce<
            Record<
                string,
                {
                    id: string;
                    balance: string;
                    allowance: {
                        [address: string]: string;
                    };
                    reserve: string;
                }
            >
        >((acc, token) => {
            if (token === 'currentPair') return acc;
            const balance = ethers.utils.formatUnits(
                balances?.[token].balance || 0,
                parseInt(balances[token]?.decimals || '0', 10)
            );

            const allowance = ethers.utils.formatUnits(
                balances?.[token].allowance?.[CONTRACT_ADDRESS] || 0,
                parseInt(balances[token]?.decimals || '0', 10)
            );

            const id = balances?.[token].id;

            const reserve =
                token === 'ETH' ? reserveLookup['WETH'] : reserveLookup[token];

            acc[token] = {
                id,
                balance,
                allowance: {
                    [CONTRACT_ADDRESS]: allowance,
                },
                reserve,
            };
            return acc;
        }, {});

        setTokenData(tokenDataMap);
    }, [balances, pairData, twoSide]);
    useEffect(() => {
        twoSide && setTokenOne('ETH');
    }, [twoSide]);

    useEffect(() => {
        setTokenOneAmount('');
        setTokenTwoAmount('');
    }, [tokenOne, tokenTwo]);

    /* 
    tokenData = { [symbol]: {id, balance, allowance, reserve}}
    */

    const handleTokenRatio = useCallback(
        (token: string, amount: string) => {
            if (!twoSide) return;

            let price: BigNumber;
            let priceStr: string;

            /*
        W = (Wr * I) / Ir
        Wr: Ir = W : I

        [symbol]: {id, allowance, balance, reserve}
        */
            switch (token) {
                case tokenOne:
                    price = new BigNumber(
                        tokenData?.[tokenTwo]?.reserve as string
                    )
                        .times(new BigNumber(amount))
                        .div(
                            new BigNumber(
                                tokenData?.[tokenOne].reserve as string
                            )
                        );
                    priceStr = price.isNaN() ? '' : price.toFixed(7);
                    setTokenTwoAmount(priceStr);
                    break;
                case tokenTwo:
                    price = new BigNumber(
                        tokenData?.[tokenOne]?.reserve as string
                    )
                        .times(new BigNumber(amount))
                        .div(
                            new BigNumber(
                                tokenData?.[tokenTwo].reserve as string
                            )
                        );
                    priceStr = price.isNaN() ? '' : price.toFixed(7);
                    setTokenOneAmount(priceStr);
                    break;
                default:
                    console.warn('No matching token. Cannot update ratio');
            }
        },
        [tokenData, tokenOne, tokenTwo, twoSide]
    );
    // useEffect(() => {
    //     twoSide && handleTokenRatio(tokenOne, tokenOneAmount);
    // }, [handleTokenRatio, tokenOne, tokenOneAmount, twoSide]);

    const doApprove = async () => {
        if (!pairData || !provider || !approvalList.size) return;

        if (!currentGasPrice) {
            throw new Error('Gas price not selected.');
        }

        // Create signer
        const signer = provider.getSigner();

        // can use ts config option to allow iterating over iterables
        for (const token of Array.from(approvalList)) {
            const sellToken = tokenData?.[token].id;
            if (token !== tokenOne && token !== tokenTwo) return;
            if (!sellToken) return;

            const sellTokenContract = new ethers.Contract(
                sellToken,
                erc20Abi,
                signer
            );

            const decimals = parseInt(balances[token]?.decimals || '0', 10);
            if (decimals === 0) {
                throw new Error(
                    `Do not have decimal units for ${decimals} - unsafe, cannot proceed`
                );
            }

            let tokenAmount: string;
            if (token === tokenOne) tokenAmount = tokenOneAmount;
            else tokenAmount = tokenTwoAmount;

            const baseAmount = ethers.utils
                .parseUnits(
                    new BigNumber(tokenAmount).times(100).toString(),
                    decimals
                )
                .toString();
            const baseGasPrice = ethers.utils
                .parseUnits(currentGasPrice.toString(), 9)
                .toString();

            // Call the contract and sign
            let gasEstimate: ethers.BigNumber;

            try {
                gasEstimate = await sellTokenContract.estimateGas.approve(
                    twoSide
                        ? EXCHANGE_TWO_SIDE_ADD_ABI_ADDRESS
                        : EXCHANGE_ADD_ABI_ADDRESS,
                    baseAmount,
                    { gasPrice: baseGasPrice }
                );

                // Add a 30% buffer over the ethers.js gas estimate. We don't want transactions to fail
                gasEstimate = gasEstimate.add(gasEstimate.div(3));
            } catch (err) {
                // We could not estimate gas, for whaever reason, so we will use a high default to be safe.
                console.error(
                    `Could not estimate gas fees: ${err.message as string}`
                );

                gasEstimate = ethers.BigNumber.from('1000000');
            }

            // Approve the add liquidity contract to spend entry tokens
            const { hash } = await sellTokenContract.approve(
                twoSide
                    ? EXCHANGE_TWO_SIDE_ADD_ABI_ADDRESS
                    : EXCHANGE_ADD_ABI_ADDRESS,
                baseAmount,
                {
                    gasPrice: baseGasPrice,
                    gasLimit: gasEstimate, // setting a high gas limit because it is hard to predict gas we will use
                }
            );

            // setApprovalState('pending');
            toastWarn(`Approving tx ${compactHash(hash)}`);
            setPendingTx &&
                setPendingTx(
                    (state: PendingTx): PendingTx =>
                        ({
                            approval: [...state.approval, hash],
                            confirm: [...state.confirm],
                        } as PendingTx)
                );
            onClose();
            await provider.waitForTransaction(hash);
        }
        // setApprovalState('done');
        twoSide ? await doTwoSideAddLiquidity() : await doAddLiquidity();
    };

    const doAddLiquidity = async () => {
        if (!pairData || !provider) return;

        if (!currentGasPrice) {
            throw new Error('Gas price not selected.');
        }

        const expectedLpTokensNum = new BigNumber(expectedLpTokens);
        const slippageRatio = new BigNumber(slippageTolerance).div(100);
        const minPoolTokens = expectedLpTokensNum.times(
            new BigNumber(1).minus(slippageRatio)
        );

        let sellToken = tokenOne;
        const symbol0 = pairData.token0.symbol;
        const symbol1 = pairData.token1.symbol;
        const pairAddress = pairData.id;

        if (tokenOne === symbol0 && symbol0 !== 'WETH') {
            sellToken = pairData.token0.id;
        } else if (tokenOne === symbol1 && symbol1 !== 'WETH') {
            sellToken = pairData.token1.id;
        } else if (tokenOne === 'WETH') {
            // We have WETH
            sellToken = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
        } else if (tokenOne === 'ETH') {
            sellToken = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
        } else {
            throw new Error(`Could not sell from this token: ${sellToken}`);
        }

        // Create signer
        const signer = provider.getSigner();
        // Create read-write contract instance
        const addLiquidityContract = new ethers.Contract(
            EXCHANGE_ADD_ABI_ADDRESS,
            exchangeAddAbi,
            signer
        );

        const decimals = parseInt(balances[tokenOne]?.decimals || '0', 10);
        if (decimals === 0) {
            throw new Error(
                `Do not have decimal units for ${decimals} - unsafe, cannot proceed`
            );
        }

        const baseAmount = ethers.utils
            .parseUnits(tokenOneAmount.toString(), decimals)
            .toString();
        const baseMinPoolTokens = ethers.utils
            .parseUnits(minPoolTokens.toString(), 18)
            .toString();
        let baseMsgValue = ethers.utils.parseUnits('0.005', 18);
        if (tokenOne === 'ETH') {
            baseMsgValue = baseMsgValue.add(
                ethers.utils.parseUnits(tokenOneAmount.toString(), decimals)
            );
        }
        const value = baseMsgValue.toString();
        const baseGasPrice = ethers.utils
            .parseUnits(currentGasPrice.toString(), 9)
            .toString();

        try {
            mixpanel.track('transaction:addLiquidity', {
                distinct_id: pairAddress,
                amount: tokenOneAmount.toString(),
                tokenOne,
                pair: pairAddress,
                slippageTolerance,
                wallet: wallet.account,
            });
        } catch (e) {
            console.error(`Metrics error on add liquidity.`);
        }

        // Call the contract and sign
        let gasEstimate: ethers.BigNumber;

        try {
            gasEstimate = await addLiquidityContract.estimateGas[
                'investTokenForEthPair(address,address,uint256,uint256)'
            ](sellToken, pairAddress, baseAmount, baseMinPoolTokens, {
                gasPrice: baseGasPrice,
                value, // flat fee sent to contract - 0.0005 ETH - with ETH added if used as entry
            });

            // Add a 30% buffer over the ethers.js gas estimate. We don't want transactions to fail
            gasEstimate = gasEstimate.add(gasEstimate.div(3));
        } catch (err) {
            // We could not estimate gas, for whaever reason, so we will use a high default to be safe.
            console.error(`Could not estimate gas: ${err.message as string}`);

            gasEstimate = ethers.BigNumber.from('1000000');
        }

        const { hash } = await addLiquidityContract[
            'investTokenForEthPair(address,address,uint256,uint256)'
        ](sellToken, pairAddress, baseAmount, baseMinPoolTokens, {
            gasPrice: baseGasPrice,
            gasLimit: gasEstimate,
            value, // flat fee sent to contract - 0.0005 ETH - with ETH added if used as entry
        });

        setTxSubmitted(true);

        // Close the modal after one second
        setTimeout(() => {
            setTxSubmitted(false);
            resetForm();
            onClose();
            onDone?.(hash);
        }, 500);
    };

    const doTwoSideAddLiquidity = async () => {
        if (!pairData || !provider || !tokenData) return;

        if (!currentGasPrice) throw new Error('Gas price not selected.');

        const pairAddress = pairData.id;
        const tokenAAddress = tokenData?.[tokenOne].id;
        const tokenBAddress = tokenData?.[tokenTwo].id;

        const slippageRatio = 0.5;
        const amountAMin = new BigNumber(tokenOneAmount).times(
            new BigNumber(1).minus(slippageRatio)
        );

        const amountBMin = new BigNumber(tokenTwoAmount).times(
            new BigNumber(1).minus(slippageRatio)
        );

        const amountAMinStr = ethers.utils
            .parseUnits(amountAMin.toString(), 18)
            .toString();
        const amountBMinStr = ethers.utils
            .parseUnits(amountBMin.toString(), 18)
            .toString();

        const signer = provider.getSigner();
        const addTwoSideLiquidityContract = new ethers.Contract(
            EXCHANGE_TWO_SIDE_ADD_ABI_ADDRESS,
            exchangeTwoSideAddAbi as ethers.ContractInterface,
            signer
        );

        const decimalsOne = parseInt(balances[tokenOne]?.decimals || '0', 10);

        const decimalsTwo = parseInt(balances[tokenOne]?.decimals || '0', 10);

        if (decimalsOne === 0 || decimalsTwo === 0) {
            throw new Error(
                `Do not have decimal units for tokens - unsafe, cannot proceed`
            );
        }

        const amountADesired = ethers.utils
            .parseUnits(tokenOneAmount.toString(), decimalsOne)
            .toString();

        const amountBDesired = ethers.utils
            .parseUnits(tokenTwoAmount.toString(), decimalsTwo)
            .toString();

        const baseGasPrice = ethers.utils
            .parseUnits(currentGasPrice.toString(), 9)
            .toString();

        try {
            mixpanel.track('transaction:addTwoSideLiquidity', {
                distinct_id: pairAddress,
                amountA: tokenOneAmount.toString(),
                amountB: tokenTwoAmount.toString(),
                tokenOne,
                tokenTwo,
                pair: pairAddress,
                slippageTolerance,
                wallet: wallet.account,
            });
        } catch (e) {
            console.error(`Metrics error on add liquidity.`);
        }

        const ERC20_PAIR =
            'addLiquidity(address,address,uint256,uint256,uint256,uint256,address)';
        const ERC20_PAIR_ARGS = [
            tokenAAddress,
            tokenBAddress,
            amountADesired,
            amountBDesired,
            amountAMinStr,
            amountBMinStr,
            wallet.account,
        ];

        const ETH_PAIR =
            'addLiquidityETH(address,uint256,uint256,uint256,address)';
        const ETH_PAIR_ARGS = [
            tokenBAddress,
            amountBDesired,
            amountAMinStr,
            amountBMinStr,
            wallet.account,
        ];

        let fnInterface, fnArgs;

        if (tokenOne === 'ETH') {
            fnInterface = ETH_PAIR;
            fnArgs = ETH_PAIR_ARGS;
        } else {
            fnInterface = ERC20_PAIR;
            fnArgs = ERC20_PAIR_ARGS;
        }

        if(!fnInterface || !fnArgs){
            throw Error('Unknown contract interface');
        }
        // Call the contract and sign
        let gasEstimate: ethers.BigNumber;
        try {
            gasEstimate = await addTwoSideLiquidityContract.estimateGas[
                fnInterface
            ](...fnArgs, {
                gasPrice: baseGasPrice,
            });

            // Add a 30% buffer over the ethers.js gas estimate. We don't want transactions to fail
            gasEstimate = gasEstimate.add(gasEstimate.div(3));
        } catch (err) {
            // We could not estimate gas, for whaever reason, so we will use a high default to be safe.
            console.error(`Could not estimate gas: ${err.message as string}`);

            gasEstimate = ethers.BigNumber.from('1000000');
        }

        const { hash } = await addTwoSideLiquidityContract[fnInterface](
            ...fnArgs,
            {
                gasPrice: baseGasPrice,
                gasLimit: gasEstimate,
            }
        );

        setTxSubmitted(true);

        // Close the modal after one second
        setTimeout(() => {
            setTxSubmitted(false);
            resetForm();
            onClose();
            onDone?.(hash);
        }, 500);
    };

    const addLiquidityActionState = (): ManageLiquidityActionState => {
        const tokenOneBalance = tokenData?.[tokenOne]?.balance || 0;
        const tokenTwoBalance = tokenData?.[tokenTwo]?.balance || 0;

        if (gasPrices == null) {
            return 'awaitingGasPrices';
        } else if (txSubmitted) {
            return 'submitted';
        } else if (!tokenOneAmount || new BigNumber(tokenOneAmount).lte(0)) {
            return 'amountNotEntered';
        } else if (new BigNumber(tokenOneAmount).gt(tokenOneBalance)) {
            return 'insufficientFunds';
        } else if (new BigNumber(expectedPriceImpact).gt(slippageTolerance)) {
            return 'slippageTooHigh';
        } else if (currentGasPrice == null) {
            return 'gasPriceNotSelected';
        } else if (
            !twoSide &&
            approvalState === 'needed' &&
            tokenOne !== 'ETH'
        ) {
            return 'needsApproval';
            // } else if (approvalState === 'pending') {
            //     return 'waitingApproval';
        } else if (
            !twoSide &&
            new BigNumber(tokenOneAmount).lte(tokenOneBalance) &&
            new BigNumber(tokenOneAmount).gt(0)
        ) {
            return 'needsSubmit';
        } else if (twoSide) {
            if (!tokenTwoAmount || new BigNumber(tokenTwoAmount).lte(0))
                return 'amountNotEntered';

            if (approvalState === 'needed') return 'needsApproval';

            if (
                new BigNumber(tokenOneAmount).gt(tokenOneBalance) ||
                new BigNumber(tokenTwoAmount).gt(tokenTwoBalance)
            )
                return 'insufficientFunds';
            if (
                new BigNumber(tokenOneAmount).lte(tokenOneBalance) &&
                new BigNumber(tokenOneAmount).gt(0) &&
                new BigNumber(tokenTwoAmount).lte(tokenTwoBalance) &&
                new BigNumber(tokenTwoAmount).gt(0)
            )
                return 'needsSubmit';
        }
        return 'unknown';
    };

    if (!wallet || !provider || !pairData) {
        return <p className='centered'>Connect your wallet to continue.</p>;
    }

    let currentLpTokens: string | null = null;

    // if (!maxBalance || !pairData) {
    //     return null;
    // }

    if (positionData) {
        const pairPosition = positionData.positions[pairData.id];

        if (!pairPosition) {
            currentLpTokens = new BigNumber(0).toFixed(4);
        } else {
            const lastPosition = pairPosition[pairPosition.length - 1];
            currentLpTokens = new BigNumber(
                lastPosition.liquidityTokenBalance
            ).toFixed(4);
        }
    }

    const dropdownOptions = (tokenData && Object.keys(tokenData)) || [];
    const dropdownOptionsPairTwo =
        tokenData &&
        Object.keys(tokenData).filter(
            (symbol) => symbol !== 'ETH' && symbol !== 'WETH'
        );

    const showTwoSide = (): JSX.Element | null => {
        const tkn1 = pairData?.token0?.symbol;
        const tkn2 = pairData?.token1?.symbol;
        if (!tokenData?.[tkn1]?.balance || !tokenData?.[tkn2]?.balance)
            return null;

        if (
            new BigNumber(tokenData[tkn1]?.balance).gt(0) &&
            new BigNumber(tokenData[tkn2]?.balance).gt(0)
        )
            return (
                <div style={{ textAlign: 'right' }}>
                    <input
                        type='checkbox'
                        checked={twoSide}
                        onChange={() => {
                            setTwoSide((twoSide) => !twoSide);
                            setTokenTwo(dropdownOptionsPairTwo?.[0] || '');
                            handleTokenRatio(tokenOne, tokenOneAmount);
                        }}
                        id='two-side'
                    />
                    &nbsp;
                    <label htmlFor='two-side'>Two Side</label>
                </div>
            );

        return null;
    };

    const PoolShare = (): JSX.Element => (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <div>
                <p className='sub-heading'>
                    <strong>Pool Share</strong>
                </p>
            </div>
            <div className='card modal-pool-shares'>
                <div>
                    {resolveLogo(pairData.token0.id)} {pairData.token0.symbol}
                </div>
                <div>
                    {expectedPoolToken0 !== 'NaN' ? expectedPoolToken0 : 0}{' '}
                </div>
                <div>
                    {resolveLogo(pairData.token1.id)} {pairData.token1.symbol}
                </div>
                <div>
                    {expectedPoolToken1 !== 'NaN' ? expectedPoolToken1 : 0}{' '}
                </div>

                <div>LP Tokens</div>
                <div>
                    {expectedLpTokens !== 'NaN' ? expectedLpTokens : 0}{' '}
                    {currentLpTokens && (
                        <span className='current-lp-tokens'>
                            {' '}
                            ({currentLpTokens} Current)
                        </span>
                    )}
                </div>
                <div>Price Impact</div>
                <div>
                    {expectedPriceImpact !== 'NaN' ? expectedPriceImpact : 0}%
                </div>
            </div>
        </div>
    );

    const TransactionSettings = () => (
        <>
            <p className='sub-heading'>
                <strong>Transaction Settings</strong>
            </p>
            {!twoSide && (
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
                <Form.Group className='transaction-speed-input'>
                    <Form.Label>Transaction Speed</Form.Label>
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
                </Form.Group>
            )}
        </>
    );

    return (
        <>
            <Modal.Body className='connect-wallet-modal'>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <WalletBalance balances={balances} />
                </div>
                <br />
                {/* <Form.Label>
                        <h5>
                            Available <strong>{entryToken}</strong>{' '}
                            {maxBalanceStr}
                        </h5>
                    </Form.Label> */}
                {/* &nbsp;&nbsp;
                    <button
                        className='btn-neutral'
                        onClick={() => setEntryAmount(maxBalanceStr)}
                    >
                        Max
                    </button> */}
                <TokenInput
                    token={tokenOne}
                    amount={tokenOneAmount}
                    updateAmount={setTokenOneAmount}
                    updateToken={setTokenOne}
                    handleTokenRatio={handleTokenRatio}
                    options={twoSide ? ['ETH', 'WETH'] : dropdownOptions}
                    balances={balances}
                    twoSide={twoSide}
                />
                {showTwoSide()}
                {twoSide && (
                    <TokenInput
                        token={tokenTwo}
                        amount={tokenTwoAmount}
                        updateAmount={setTokenTwoAmount}
                        updateToken={setTokenTwo}
                        handleTokenRatio={handleTokenRatio}
                        options={dropdownOptionsPairTwo || []}
                        balances={balances}
                        twoSide={twoSide}
                    />
                )}
                <TransactionSettings />
                <PoolShare />
                {new BigNumber(pairData.reserveUSD).lt(2000000) && (
                    <div className='warn-well'>
                        <p>
                            <strong>Warning: </strong> Low liquidity pairs can
                            experience high slippage at low entry amounts. Be
                            careful when using high slippage tolerance.
                        </p>
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer className='manage-liquidity-modal-footer'>
                <AddLiquidityActionButton
                    state={addLiquidityActionState()}
                    onApprove={doApprove}
                    onAddLiquidity={
                        twoSide ? doTwoSideAddLiquidity : doAddLiquidity
                    }
                />
            </Modal.Footer>
        </>
    );
}

export default AddLiquidity;
