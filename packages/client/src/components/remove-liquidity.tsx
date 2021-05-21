import { useState, useEffect, useMemo } from 'react';
import {
    Container,
    Row,
    Col,
    InputGroup,
    Form,
    FormControl,
    Modal,
} from 'react-bootstrap';
import { Box } from '@material-ui/core';

import { Combobox } from 'react-widgets';
import { ethers } from 'ethers';
import BigNumber from 'bignumber.js';
import { compactHash } from 'util/formats';
import { usePendingTx, PendingTx } from 'hooks/use-pending-tx';
import mixpanel from 'util/mixpanel';
import classNames from 'classnames';
import erc20Abi from 'constants/abis/erc20.json';
import exchangeRemoveAbi from 'constants/abis/volumefi_remove_liquidity_uniswap.json';

const EXCHANGE_REMOVE_ABI_ADDRESS =
    '0x430f33353490b256D2fD7bBD9DaDF3BB7f905E78';

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

import { resolveLogo } from 'components/token-with-logo';
import { RemoveLiquidityActionButton } from 'components/liquidity-action-button';
import { toastWarn } from 'util/toasters';

function RemoveLiquidity({
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
    const [exitToken, setExitToken] = useState<string>('ETH');
    const [exitAmount, setExitAmount] = useState<string>('0');
    const [slippageTolerance, setSlippageTolerance] = useState<number>(3.0);
    const [currentGasPrice, setCurrentGasPrice] = useState<number | undefined>(
        gasPrices?.standard,
    );
    const [approvalState, setApprovalState] = useState<'needed' | 'done'>(
        'needed',
    );
    const [txSubmitted, setTxSubmitted] = useState(false);
    const { setPendingTx } = usePendingTx();
    const resetForm = () => {
        setExitToken('ETH');
        setSlippageTolerance(3.0);
        setExitAmount('0');
    };

    const expectedExitToken = useMemo(() => {
        if (!positionData || !pairData) return '0';

        const pctShare = new BigNumber(exitAmount).div(pairData.totalSupply);
        // Calculate amount of base token one will get, plus swap data

        const symbol0 = pairData.token0.symbol;
        const symbol1 = pairData.token1.symbol;

        const currentInvariant = new BigNumber(pairData.reserve0).times(
            pairData.reserve1,
        );

        if (
            exitToken === symbol0 ||
            (symbol0 === 'WETH' && exitToken === 'ETH')
        ) {
            // We want to sell symbol1 to get symbol0
            let expectedToken0 = pctShare.times(pairData.reserve0);
            const expectedToken1 = pctShare.times(pairData.reserve1);

            // Deduct fee from amount we can swap
            const purchasingPower = new BigNumber(0.997).times(expectedToken1);
            const updatedReserve1 = new BigNumber(pairData.reserve1).plus(
                purchasingPower,
            );
            const updatedReserve0 = currentInvariant.div(updatedReserve1);
            // const newPriceRatio = updatedReserve0.div(updatedReserve1);

            const expectedAdditionalToken0 = updatedReserve0
                .minus(pairData.reserve0)
                .times(-1)
                .toFixed(4);
            const invariantAfterSwap = updatedReserve0.times(updatedReserve1);

            if (invariantAfterSwap.toFixed(4) !== currentInvariant.toFixed(4)) {
                // throw new Error(`Swap expectations do not meet invariant - old ${currentInvariant.toFixed(4)} - new ${invariantAfterSwap.toFixed(4)}`);
                console.warn(
                    `Swap expectations do not meet invariant - old ${currentInvariant.toFixed()} - new ${invariantAfterSwap.toFixed()}`,
                );
            }

            expectedToken0 = expectedToken0.plus(expectedAdditionalToken0);
            return expectedToken0.toFixed(4);
        } else if (
            exitToken === symbol1 ||
            (symbol1 === 'WETH' && exitToken === 'ETH')
        ) {
            // We want to sell symbol0 to get symbol1
            const expectedToken0 = pctShare.times(pairData.reserve0);
            let expectedToken1 = pctShare.times(pairData.reserve1);

            // Deduct fee from amount we can swap
            const purchasingPower = new BigNumber(0.997).times(expectedToken0);
            const updatedReserve0 = new BigNumber(pairData.reserve0).plus(
                purchasingPower,
            );
            const updatedReserve1 = currentInvariant.div(updatedReserve0);
            // const newPriceRatio = updatedReserve0.div(updatedReserve1);

            const expectedAdditionalToken1 = updatedReserve1
                .minus(pairData.reserve1)
                .times(-1)
                .toFixed(4);
            const invariantAfterSwap = updatedReserve0.times(updatedReserve1);

            if (invariantAfterSwap.toFixed(4) !== currentInvariant.toFixed(4)) {
                // throw new Error(`Swap expectations do not meet invariant - old ${currentInvariant.toFixed(4)} - new ${invariantAfterSwap.toFixed(4)}`);
                console.warn(
                    `Swap expectations do not meet invariant - old ${currentInvariant.toFixed()} - new ${invariantAfterSwap.toFixed()}`,
                );
            }

            expectedToken1 = expectedToken1.plus(expectedAdditionalToken1);
            return expectedToken1.toFixed(4);
        } else if (exitToken === 'ETH') {
            // We need to sell both symbol0 and symbol1 - we need to estimate this one
            // TODO: Figure out better estimation once we figure out ETH pairs
            const owedEth = pctShare.times(pairData.trackedReserveETH);
            return owedEth.toFixed(4);
        } else {
            console.warn(
                `Exit token ${exitToken} does not belong to pair - could not calculate price impact`,
            );
            return '0';
        }
        // If we are selling X LP tokens,
        // we need to figure out the LP share
        // then figure out the amount of tokens that belong to that share
    }, [exitToken, exitAmount, pairData, positionData]);

    let currentLpTokens = '0';

    useEffect(() => {
        // No need to check allowances for ETH
        const allowance =
            balances?.currentPair?.allowance?.[EXCHANGE_REMOVE_ABI_ADDRESS];

        if (!allowance) return;

        const exitAmountNum = new BigNumber(exitAmount);
        const allowanceStr = ethers.utils.formatUnits(
            allowance || 0,
            parseInt(balances.currentPair?.decimals || '0', 10),
        );
        const allowanceNum = new BigNumber(allowanceStr);

        // If allowance is less than entry amount, make it needed
        if (exitAmountNum.gt(allowanceNum)) {
            setApprovalState('needed');
        } else {
            // else make it done
            setApprovalState('done');
        }
    }, [exitAmount, balances]);

    useEffect(() => {
        setExitAmount('0');
    }, []);

    const doApprove = async () => {
        if (!pairData || !provider) return;

        if (!currentGasPrice) {
            throw new Error('Gas price not selected.');
        }

        // // Create signer
        const signer = provider.getSigner();
        // // Create read-write contract instance

        const pairContract = new ethers.Contract(pairData.id, erc20Abi, signer);

        const decimals = parseInt(balances.currentPair?.decimals || '0', 10);
        if (decimals === 0) {
            throw new Error(
                `Do not have decimal units for ${decimals} - unsafe, cannot proceed`,
            );
        }

        const baseAmount = ethers.utils
            .parseUnits(
                new BigNumber(exitAmount).times(100).toString(),
                decimals,
            )
            .toString();
        const baseGasPrice = ethers.utils
            .parseUnits(currentGasPrice.toString(), 9)
            .toString();

        // Call the contract and sign
        let gasEstimate: ethers.BigNumber;

        try {
            gasEstimate = await pairContract.estimateGas.approve(
                EXCHANGE_REMOVE_ABI_ADDRESS,
                baseAmount,
                { gasPrice: baseGasPrice },
            );

            // Add a 30% buffer over the ethers.js gas estimate. We don't want transactions to fail
            gasEstimate = gasEstimate.add(gasEstimate.div(3));
        } catch (err) {
            // We could not estimate gas, for whaever reason, so we will use a high default to be safe.
            console.error(`Could not estimate gas: ${err.message as string}`);

            gasEstimate = ethers.BigNumber.from('1000000');
        }

        // // Approve the add liquidity contract to spend entry tokens
        const { hash } = await pairContract.approve(
            EXCHANGE_REMOVE_ABI_ADDRESS,
            baseAmount,
            {
                gasPrice: baseGasPrice,
                gasLimit: gasEstimate,
            },
        );

        // setApprovalState('pending');
        toastWarn(`Approving tx ${compactHash(hash)}`);
        setPendingTx &&
            setPendingTx(
                (state: PendingTx): PendingTx =>
                    ({
                        approval: [...state.approval, hash],
                        confirm: [...state.confirm],
                    } as PendingTx),
            );
        await provider.waitForTransaction(hash);
        setPendingTx &&
            setPendingTx(
                (state: PendingTx): PendingTx =>
                    ({
                        approval: [...state.approval.filter((h) => h !== hash)],
                        confirm: [...state.confirm],
                    } as PendingTx),
            );
        // setApprovalState('done');
        onClose();
        await doRemoveLiquidity();
    };

    const doRemoveLiquidity = async () => {
        if (!pairData || !provider || !currentLpTokens) return;

        if (!currentGasPrice) {
            throw new Error('Gas price not selected.');
        }

        // Create signer
        const signer = provider.getSigner();
        // Create read-write contract instance
        const removeLiquidityContract = new ethers.Contract(
            EXCHANGE_REMOVE_ABI_ADDRESS,
            exchangeRemoveAbi,
            signer,
        );

        // Call the contract and sign
        let exitAddress = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

        if (exitToken === pairData.token0.symbol) {
            exitAddress = pairData.token0.id;
        } else if (exitToken === pairData.token1.symbol) {
            exitAddress = pairData.token1.id;
        }

        const baseGasPrice = ethers.utils
            .parseUnits(currentGasPrice.toString(), 9)
            .toString();

        const baseMsgValue = ethers.utils.parseUnits('0.01', 18).toString();
        const baseLpTokens = ethers.utils
            .parseUnits(exitAmount.toString(), 18)
            .toString();

        const expectedExitTokensNum = new BigNumber(expectedExitToken);
        const slippageRatio = new BigNumber(slippageTolerance).div(100);
        const minExitTokens = expectedExitTokensNum.times(
            new BigNumber(1).minus(slippageRatio),
        );
        const baseMinExitTokens = ethers.utils
            .parseUnits(
                minExitTokens.toString(),
                balances[exitToken]?.decimals || 18,
            )
            .toString();

        // Call the contract and sign
        let gasEstimate: ethers.BigNumber;

        try {
            gasEstimate = await removeLiquidityContract.estimateGas[
                'divestUniPairToToken(address,address,uint256,uint256)'
            ](pairData.id, exitAddress, baseLpTokens, baseMinExitTokens, {
                gasPrice: baseGasPrice,
                value: baseMsgValue, // flat fee sent to contract - 0.001 ETH
            });

            // Add a 30% buffer over the ethers.js gas estimate. We don't want transactions to fail
            gasEstimate = gasEstimate.add(gasEstimate.div(3));
        } catch (err) {
            // We could not estimate gas, for whaever reason, so we will use a high default to be safe.
            console.error(`Could not estimate gas: ${err.message as string}`);

            gasEstimate = ethers.BigNumber.from('1000000');
        }

        const { hash } = await removeLiquidityContract[
            'divestUniPairToToken(address,address,uint256,uint256)'
        ](pairData.id, exitAddress, baseLpTokens, baseMinExitTokens, {
            gasPrice: baseGasPrice,
            gasLimit: gasEstimate,
            value: baseMsgValue, // flat fee sent to contract - 0.0005 ETH
        });

        try {
            const metrics = {
                distinct_id: pairData.id,
                pair_id: pairData.id,
                exitToken,
                gasEstimate,
                exitAmount,
                slippageTolerance,
            };

            mixpanel.track('transaction:removeLiquidity', metrics);
        } catch (e) {
            console.error(`Metrics error on remove liquidity.`);
        }

        setTxSubmitted(true);

        // Close the modal after one second
        setTimeout(() => {
            setTxSubmitted(false);
            resetForm();
            onClose();
            onDone?.(hash);
        }, 500);
    };

    if (positionData && pairData) {
        const pairPosition = positionData.positions[pairData.id];

        if (!pairPosition) {
            currentLpTokens = new BigNumber(0).toFixed();
        } else {
            const lastPosition = pairPosition[pairPosition.length - 1];
            currentLpTokens = new BigNumber(
                lastPosition.liquidityTokenBalance,
            ).toFixed();
        }
    }

    const removeLiquidityActionState: ManageLiquidityActionState = useMemo(() => {
        if (gasPrices == null) {
            return 'awaitingGasPrices';
        } else if (txSubmitted) {
            return 'submitted';
        } else if (!exitAmount || new BigNumber(exitAmount).lte(0)) {
            return 'amountNotEntered';
        } else if (new BigNumber(exitAmount).gt(currentLpTokens || 0)) {
            return 'insufficientFunds';
        } else if (currentGasPrice == null) {
            return 'gasPriceNotSelected';
        } else if (approvalState === 'needed') {
            return 'needsApproval';
            // } else if (approvalState === 'pending') {
            //     return 'waitingApproval';
        } else if (
            new BigNumber(exitAmount).lte(currentLpTokens || 0) &&
            new BigNumber(exitAmount).gt(0)
        ) {
            return 'needsSubmit';
        } else {
            return 'unknown';
        }
    }, [
        gasPrices,
        currentGasPrice,
        currentLpTokens,
        exitAmount,
        txSubmitted,
        approvalState,
    ]);

    if (!wallet || !provider || !pairData) {
        return <p className='centered'>Connect your wallet to continue.</p>;
    }

    const renderPairText = (
        pair: string | { id: string; symbol: string },
    ): string => {
        // If pair is string, it's typed in so return
        if (typeof pair === 'string') return pair;

        return pair.symbol;
    };

    const handleChange = (value: string | { symbol: string }): void => {
        // If pair is string, it's typed in
        // so just override one side
        if (typeof value === 'string') {
            if (balances[value]) {
                setExitToken(balances[value].symbol as string);
            }
            return;
        } else {
            setExitToken(value.symbol);
        }
    };

    if (!currentLpTokens || new BigNumber(currentLpTokens).eq(0)) {
        return (
            <Modal.Body className='connect-wallet-modal'>
                <Container className='error-container'>
                    No LP position in {pairData.token0.symbol}/
                    {pairData.token1.symbol}.
                </Container>
            </Modal.Body>
        );
    }

    const exitOptions = Object.values(balances).filter(
        (balance) => balance.id !== pairData.id,
    );

    return (
        <>
            <Modal.Body className='connect-wallet-modal'>
                <Box display='flex' justifyContent='flex-end'>
                    <div className='balances-container'>
                        <p className='sub-heading'>
                            <strong>Wallet Balance</strong>
                        </p>
                        <table>
                            <tr>
                                <td>
                                    <strong>LP Token</strong>
                                </td>
                                <td>{currentLpTokens}</td>
                            </tr>
                        </table>
                    </div>
                </Box>
                <br />
                {/* <Form.Label>
                    <h5>
                        LP Tokens&nbsp;&nbsp;
                        {currentLpTokens}&nbsp;&nbsp;
                    </h5>
                </Form.Label> */}
                <Form.Group as={Row}>
                    <InputGroup>
                        <Form.Label column sm={6}>
                            Tokens to Liquidate
                        </Form.Label>
                        <button
                            className='max-balance-link'
                            onClick={() => setExitAmount(currentLpTokens)}
                        >
                            Max
                        </button>
                        <FormControl
                            min='0'
                            placeholder='Tokens To Liquidate'
                            value={exitAmount}
                            onChange={(e) => {
                                const val = e.target.value;

                                if (!val || !new BigNumber(val).isNaN()) {
                                    setExitAmount(val);
                                }
                            }}
                        />
                    </InputGroup>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column sm={6}>
                        Exit Token
                    </Form.Label>
                    <Col sm={6}>
                        <Combobox
                            data={exitOptions}
                            value={exitToken}
                            textField={renderPairText}
                            itemComponent={({ item: token }) => (
                                <span>
                                    {resolveLogo(token.id)} {token.symbol}
                                </span>
                            )}
                            caseSensitive={false}
                            onChange={handleChange}
                        />
                    </Col>
                </Form.Group>
                <Form.Group as={Row}>
                    <Form.Label column sm={6}>
                        Expected Payout
                    </Form.Label>
                    <Col sm={6}>
                        <p>
                            {resolveLogo(balances[exitToken].id)}{' '}
                            {expectedExitToken !== 'NaN'
                                ? expectedExitToken
                                : 0}{' '}
                            {balances[exitToken].symbol}
                        </p>
                    </Col>
                </Form.Group>
                <br />
                <p className='sub-heading'>
                    <strong>Transaction Settings</strong>
                </p>
                {/* <Card body> */}
                <Form.Group as={Row}>
                    <Form.Label column sm={6}>
                        Slippage Tolerance:
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
                                        parseFloat(e.target.value),
                                    );
                                }}
                            />
                            <InputGroup.Append>
                                <InputGroup.Text>%</InputGroup.Text>
                            </InputGroup.Append>
                        </InputGroup>
                    </Col>
                </Form.Group>
                {gasPrices && (
                    <Form.Group className='transaction-speed-input'>
                        <Form.Label>Transaction Speed</Form.Label>
                        <div className='button-group-h'>
                            <button
                                className={classNames({
                                    active:
                                        currentGasPrice === gasPrices.standard,
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
                                onClick={() =>
                                    setCurrentGasPrice(gasPrices.fast)
                                }
                            >
                                Fast <br />({gasPrices.fast} Gwei)
                            </button>
                            <button
                                className={classNames({
                                    active:
                                        currentGasPrice === gasPrices.fastest,
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
                {/* </Card> */}
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
                <RemoveLiquidityActionButton
                    state={removeLiquidityActionState}
                    onApprove={doApprove}
                    onRemoveLiquidity={doRemoveLiquidity}
                />
            </Modal.Footer>
        </>
    );
}

export default RemoveLiquidity;
