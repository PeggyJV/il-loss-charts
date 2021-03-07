import { useState, useEffect, useMemo } from 'react';
import {
    Alert,
    Row,
    Col,
    Card,
    ButtonGroup,
    Button,
    DropdownButton,
    Dropdown,
    Form,
    FormControl,
    InputGroup,
    Modal,
} from 'react-bootstrap';

import { ethers } from 'ethers';
import BigNumber from 'bignumber.js';

import mixpanel from 'util/mixpanel';

import erc20Abi from 'constants/abis/erc20.json';
import exchangeAddAbi from 'constants/abis/volumefi_add_liquidity_uniswap.json';

const EXCHANGE_ADD_ABI_ADDRESS = '0xFd8A61F94604aeD5977B31930b48f1a94ff3a195';

import {
    EthGasPrices,
    LPPositionData,
    UniswapPair,
    Token,
} from '@sommelier/shared-types';
import { Wallet, WalletBalances, ManageLiquidityActionState } from 'types/states';

import { calculatePoolEntryData } from 'util/uniswap-pricing';

import { resolveLogo } from 'components/token-with-logo';
import { AddLiquidityActionButton } from 'components/liquidity-action-button';

function AddLiquidity({
    wallet,
    provider,
    pairData,
    positionData,
    gasPrices,
    balances,
    onDone
}: {
    wallet: Wallet;
    provider: ethers.providers.Web3Provider | null;
    pairData: UniswapPair | null;
    positionData: LPPositionData<string> | null;
    gasPrices: EthGasPrices | null;
    balances: WalletBalances
    onDone: () => void | null
}): JSX.Element | null {
    const [entryToken, setEntryToken] = useState<string>('ETH');
    const [entryAmount, setEntryAmount] = useState<number>(0);
    const [slippageTolerance, setSlippageTolerance] = useState<number>(3.0);
    const [currentGasPrice, setCurrentGasPrice] = useState<number | undefined>(
        gasPrices?.standard
    );
    const [approvalState, setApprovalState] = useState<'needed' | 'pending' | 'done'>('needed');
    const [txSubmitted, setTxSubmitted] = useState(false);
    const maxBalance = balances[entryToken]?.balance;
    const maxBalanceStr = ethers.utils.formatUnits(
        maxBalance || 0,
        parseInt(balances[entryToken]?.decimals || '0', 10)
    );

    const resetForm = () => {
        setEntryToken('ETH');
        setEntryAmount(0);
        setSlippageTolerance(3.0);
    };

    const {
        expectedLpTokens,
        expectedPoolToken0,
        expectedPoolToken1,
        expectedPriceImpact
    } = calculatePoolEntryData(pairData, entryToken, entryAmount);

    useEffect(() => {
        // No need to check allowances for ETH
        if (entryToken === 'ETH' || !entryAmount) return;

        const allowance = balances[entryToken]?.allowance;

        if (!allowance) return;

        const entryAmtNum = new BigNumber(entryAmount);
        const allowanceStr = ethers.utils.formatUnits(
            allowance || 0,
            parseInt(balances[entryToken]?.decimals || '0', 10)
        );
        const allowanceNum = new BigNumber(allowanceStr);

        // If allowance is less than entry amount, make it needed
        if (entryAmtNum.gt(allowanceNum)) {
            setApprovalState('needed');
        } else {
            // else make it done
            setApprovalState('done')
        }
    }, [entryAmount, entryToken, balances]);

    useEffect(() => {
        setEntryAmount(0);
    }, [entryToken]);

    const doApprove = async () => {
        if (!pairData || !provider) return;

        if (!currentGasPrice) {
            throw new Error('Gas price not selected.');
        }

        // Create signer
        const signer = provider.getSigner();
        // Create read-write contract instance

        let sellToken = entryToken;
        const symbol0 = pairData.token0.symbol;
        const symbol1 = pairData.token1.symbol;

        if (entryToken === symbol0 && symbol0 !== 'WETH') {
            sellToken = (pairData.token0 as Token).id;
        } else if (entryToken === symbol1 && symbol1 !== 'WETH') {
            sellToken = (pairData.token1 as Token).id;
        } else if (entryToken === 'WETH') {
            // We have ETH
            sellToken = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
        } else {
            throw new Error(`Could not sell from this token: ${sellToken}`);
        }

        const sellTokenContract = new ethers.Contract(
            sellToken,
            erc20Abi,
            signer
        );

        const decimals = parseInt(balances[entryToken]?.decimals || '0', 10);
        if (decimals === 0) {
            throw new Error(
                `Do not have decimal units for ${decimals} - unsafe, cannot proceed`
            );
        }

        const baseAmount = ethers.utils
            .parseUnits((entryAmount * 100).toString(), decimals)
            .toString();
        const baseGasPrice = ethers.utils
            .parseUnits(currentGasPrice.toString(), 9)
            .toString();

        // Approve the add liquidity contract to spend entry tokens
        const txResponse = await sellTokenContract.approve(EXCHANGE_ADD_ABI_ADDRESS, baseAmount, {
            gasPrice: baseGasPrice,
            gasLimit: '200000', // setting a high gas limit because it is hard to predict gas we will use
        });

        setApprovalState('pending');
        await provider.waitForTransaction(txResponse.hash);
        setApprovalState('done');
    }

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

        let sellToken = entryToken;
        const symbol0 = pairData.token0.symbol;
        const symbol1 = pairData.token1.symbol;
        const pairAddress = pairData.id;

        if (entryToken === symbol0 && symbol0 !== 'WETH') {
            sellToken = (pairData.token0 as Token).id;
        } else if (entryToken === symbol1 && symbol1 !== 'WETH') {
            sellToken = (pairData.token1 as Token).id;
        } else if (entryToken === 'WETH') {
            // We have ETH
            sellToken = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
        } else if (entryToken === 'ETH') {
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

        const decimals = parseInt(balances[entryToken]?.decimals || '0', 10);
        if (decimals === 0) {
            throw new Error(
                `Do not have decimal units for ${decimals} - unsafe, cannot proceed`
            );
        }

        const baseAmount = ethers.utils
            .parseUnits(entryAmount.toString(), decimals)
            .toString();
        const baseMinPoolTokens = ethers.utils
            .parseUnits(minPoolTokens.toString(), 18)
            .toString();
        let baseMsgValue = ethers.utils.parseUnits('0.005', 18);
        if (entryToken === 'ETH') {
            baseMsgValue = baseMsgValue.add(
                ethers.utils.parseUnits(entryAmount.toString(), decimals)
            );
        }
        const value = baseMsgValue.toString();
        const baseGasPrice = ethers.utils
            .parseUnits(currentGasPrice.toString(), 9)
            .toString();

        try {
            mixpanel.track('transaction:addLiquidity', {
                amount: entryAmount.toString(),
                entryToken,
                pair: pairAddress,
                slippageTolerance,
                wallet: wallet.account
            });
        } catch (e) {
            console.error(`Metrics error on add liquidity.`);
        }

        // Call the contract and sign
        await addLiquidityContract[
            'investTokenForEthPair(address,address,uint256,uint256)'
        ](sellToken, pairAddress, baseAmount, baseMinPoolTokens, {
            gasPrice: baseGasPrice,
            gasLimit: '500000', // setting a high gas limit because it is hard to predict gas we will use
            value, // flat fee sent to contract - 0.0005 ETH - with ETH added if used as entry
        });

        setTxSubmitted(true);

        // Close the modal after one second
        setTimeout(() => {
            setTxSubmitted(false);
            resetForm();
            onDone?.();
        }, 1000);
    };

    const addLiquidityActionState: ManageLiquidityActionState = useMemo(() => {
        if (gasPrices == null) {
            return 'awaitingGasPrices';
        } else if (txSubmitted) {
            return 'submitted';
        } else if (!entryAmount || new BigNumber(entryAmount).lte(0)) {
            return 'amountNotEntered';
        } else if (new BigNumber(entryAmount).gt(maxBalanceStr)) {
            return 'insufficientFunds';
        } else if (new BigNumber(expectedPriceImpact).gt(slippageTolerance)) {
            return 'slippageTooHigh';
        } else if (currentGasPrice == null) {
            return 'gasPriceNotSelected';
        } else if (approvalState === 'needed' && entryToken !== 'ETH') {
            return 'needsApproval';
        } else if (approvalState === 'pending') {
            return 'waitingApproval';
        } else if (new BigNumber(entryAmount).lte(maxBalanceStr) &&
            new BigNumber(entryAmount).gt(0)) {
            return 'needsSubmit'
        } else {
            return 'unknown';
        }
    }, [
        gasPrices,
        currentGasPrice,
        entryAmount,
        entryToken,
        maxBalanceStr,
        expectedPriceImpact,
        slippageTolerance,
        txSubmitted,
        approvalState
    ]);


    if (!wallet || !provider || !pairData) {
        return (
            <p className='centered'>Connect your wallet to continue.</p>
        );
    }

    let currentLpTokens: string | null = null;


    if (!maxBalance || !pairData) {
        return null;
    }

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

    return (
        <>
            <Modal.Body className='connect-wallet-modal'>
                <Form.Group>
                    <Form.Label>
                        <strong>Available {entryToken}:</strong> {maxBalanceStr}
                    </Form.Label>
                    <InputGroup>
                        <FormControl
                            min='0'
                            placeholder='Amount'
                            value={entryAmount}
                            type='number'
                            onChange={(e) => {
                                setEntryAmount(parseFloat(e.target.value));
                            }}
                        />
                        <DropdownButton
                            as={InputGroup.Append}
                            title={entryToken}
                        >
                            {Object.values(balances).map((token) => (
                                <Dropdown.Item
                                    key={token.symbol}
                                    active={token.symbol === entryToken}
                                    onClick={() =>
                                        setEntryToken(token.symbol as string)
                                    }
                                >
                                    {token.symbol}
                                </Dropdown.Item>
                            ))}
                        </DropdownButton>
                    </InputGroup>
                </Form.Group>
                <Card body>
                    <p>
                        <strong>Expected Pool Shares</strong>
                    </p>
                    <p>
                        {resolveLogo(pairData.token0.id)}{' '}
                        {expectedPoolToken0 !== 'NaN' ? expectedPoolToken0 : 0}{' '}
                        {pairData.token0.symbol}
                    </p>
                    <p>
                        {resolveLogo(pairData.token1.id)}{' '}
                        {expectedPoolToken1 !== 'NaN' ? expectedPoolToken1 : 0}{' '}
                        {pairData.token1.symbol}
                    </p>
                    <p>
                        {expectedLpTokens !== 'NaN' ? expectedLpTokens : 0} LP
                        Tokens
                        {currentLpTokens && (
                            <span className='current-lp-tokens'>
                                {' '}
                                ({currentLpTokens} Current)
                            </span>
                        )}
                    </p>
                    <p>
                        <strong>Price Impact:</strong>{' '}
                        {expectedPriceImpact !== 'NaN' ? expectedPriceImpact : 0}%
                    </p>
                </Card>
                <br />
                <Card body>
                    <p>
                        <strong>Transaction Settings</strong>
                    </p>
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
                                        setSlippageTolerance(parseFloat(e.target.value))
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
                            <Form.Label>Transaction Speed:</Form.Label>
                            <ButtonGroup>
                                <Button
                                    variant='outline-dark'
                                    size='sm'
                                    active={
                                        currentGasPrice === gasPrices.standard
                                    }
                                    onClick={() =>
                                        setCurrentGasPrice(gasPrices.standard)
                                    }
                                >
                                    Standard <br />({gasPrices.standard} Gwei)
                                </Button>
                                <Button
                                    variant='outline-dark'
                                    size='sm'
                                    active={currentGasPrice === gasPrices.fast}
                                    onClick={() =>
                                        setCurrentGasPrice(gasPrices.fast)
                                    }
                                >
                                    Fast <br />({gasPrices.fast} Gwei)
                                </Button>
                                <Button
                                    variant='outline-dark'
                                    size='sm'
                                    active={
                                        currentGasPrice === gasPrices.fastest
                                    }
                                    onClick={() =>
                                        setCurrentGasPrice(gasPrices.fastest)
                                    }
                                >
                                    Fastest <br />({gasPrices.fastest} Gwei)
                                </Button>
                            </ButtonGroup>
                        </Form.Group>
                    )}
                </Card>
                {new BigNumber(pairData.reserveUSD).lt(2000000) &&
                    <>
                        <br />
                        <Alert variant='warning'>
                            <strong>Warning: </strong> Low liquidity pairs can experience high slippage
                            at low entry amounts. Be careful when using high slippage tolerance.
                        </Alert>
                    </>
                }
            </Modal.Body>
            <Modal.Footer>
                <AddLiquidityActionButton
                    state={addLiquidityActionState}
                    onApprove={doApprove}
                    onAddLiquidity={doAddLiquidity}
                />
            </Modal.Footer>
        </>
    );
}

export default AddLiquidity;
