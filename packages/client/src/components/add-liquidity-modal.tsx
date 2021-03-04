import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
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

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleNotch, faCheck } from '@fortawesome/free-solid-svg-icons';

import mixpanel from 'util/mixpanel';

import erc20Abi from 'constants/abis/erc20.json';
import exchangeAddAbi from 'constants/abis/volumefi_add_liquidity_uniswap.json';
import exchangeRemoveAbi from 'constants/abis/volumefi_remove_liquidity_uniswap.json';

const EXCHANGE_ADD_ABI_ADDRESS = '0xFd8A61F94604aeD5977B31930b48f1a94ff3a195';
const EXCHANGE_REMOVE_ABI_ADDRESS = '0x418915329226AE7fCcB20A2354BbbF0F6c22Bd92';

import {
    EthGasPrices,
    LPPositionData,
    MarketStats,
    UniswapPair,
    Token,
} from '@sommelier/shared-types';
import { Wallet } from 'types/states';

import { UniswapApiFetcher as Uniswap } from 'services/api';
import { calculatePoolEntryData } from 'util/uniswap-pricing';

import { resolveLogo } from 'components/token-with-logo';

function AddLiquidityModal({
    show,
    setShow,
    wallet,
    pair,
    gasPrices,
}: {
    wallet: Wallet;
    show: boolean;
    setShow: (show: boolean) => void;
    pair: MarketStats | null;
    gasPrices: EthGasPrices | null;
}): JSX.Element | null {
    const handleClose = () => {
        resetForm();
        setShow(false);
    }
    const [balances, setBalances] = useState<{
        [tokenName: string]: {
            balance: ethers.BigNumber;
            symbol?: string;
            decimals?: string;
        };
    }>({});
    const [entryToken, setEntryToken] = useState<string>('ETH');
    const [entryAmount, setEntryAmount] = useState<number>(0);
    const [slippageTolerance, setSlippageTolerance] = useState<number>(3.0);
    const [pairData, setPairData] = useState<UniswapPair | null>(null);
    const [
        positionData,
        setPositionData,
    ] = useState<LPPositionData<string> | null>(null);
    const [currentGasPrice, setCurrentGasPrice] = useState<number | undefined>(
        gasPrices?.standard
    );
    const [txSubmitted, setTxSubmitted] = useState(false);
    const maxBalance = balances[entryToken]?.balance;
    const maxBalanceStr = ethers.utils.formatUnits(
        maxBalance || 0,
        parseInt(balances[entryToken]?.decimals || '0', 10)
    );

    let provider: ethers.providers.Web3Provider | null = null;

    if (wallet.provider) {
        provider = new ethers.providers.Web3Provider(wallet?.provider);
    }

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
        // get balances of both tokens
        const getBalances = async () => {
            if (!provider || !wallet.account || !pair) return;

            const getTokenBalances = [pair.token0.id, pair.token1.id].map(
                async (tokenAddress) => {
                    if (!tokenAddress) {
                        throw new Error(
                            'Could not get balance for pair without token address'
                        );
                    }
                    const token = new ethers.Contract(
                        tokenAddress,
                        erc20Abi
                    ).connect(provider as ethers.providers.Web3Provider);
                    const balance: ethers.BigNumber = await token.balanceOf(
                        wallet.account
                    );
                    return balance;
                }
            );

            const getEthBalance = provider.getBalance(wallet.account);
            const [
                ethBalance,
                token0Balance,
                token1Balance,
            ] = await Promise.all([getEthBalance, ...getTokenBalances]);

            // Get balance for other two tokens
            setBalances((prevBalances) => ({
                ...prevBalances,
                ETH: { symbol: 'ETH', balance: ethBalance, decimals: '18' },
                [pair.token0.symbol as string]: {
                    symbol: pair.token0.symbol,
                    balance: token0Balance,
                    decimals: pair.token0.decimals,
                },
                [pair.token1.symbol as string]: {
                    symbol: pair.token1.symbol,
                    balance: token1Balance,
                    decimals: pair.token0.decimals,
                },
            }));
        };

        void getBalances();
    }, [wallet, show]);

    useEffect(() => {
        const fetchPairData = async () => {
            if (!pair) return;

            // Fetch pair overview when pair ID changes
            // Default to createdAt date if LP date not set
            const { data: newPair, error } = await Uniswap.getPairOverview(
                pair.id
            );

            if (error) {
                // we could not get data for this new pair
                console.warn(
                    `Could not fetch pair data for ${pair.id}: ${error}`
                );
                return;
            }

            if (newPair) {
                setPairData(newPair);
            }
        };

        void fetchPairData();
    }, [pair]);

    useEffect(() => {
        const fetchPositionsForWallet = async () => {
            if (!wallet.account) return;

            const {
                data: positionData,
                error,
            } = await Uniswap.getPositionStats(wallet.account);

            if (error) {
                // we could not list pairs
                console.warn(`Could not get position stats: ${error}`);
                return;
            }

            if (positionData) {
                setPositionData(positionData);
            }

            // mixpanel.track('positions:query', {
            //     address: wallet.account,
            // });
        };

        if (wallet.account) {
            void fetchPositionsForWallet();
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wallet.account]);

    useEffect(() => {
        setEntryAmount(0);
    }, [entryToken]);

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
            handleClose();
        }, 1000);
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
            signer
        );

        // Call the contract and sign
        const ethAddress = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
        const baseGasPrice = ethers.utils
            .parseUnits(currentGasPrice.toString(), 9)
            .toString();

        const baseMsgValue = ethers.utils.parseUnits('0.01', 18).toString();
        const baseLpTokens = ethers.utils
            .parseUnits(currentLpTokens.toString(), 18)
            .toString();

        await removeLiquidityContract[
            'divestEthPairToToken(address,address,uint256)'
        ](pairData.id, ethAddress, baseLpTokens, {
            gasPrice: baseGasPrice,
            gasLimit: '500000', // setting a high gas limit because it is hard to predict gas we will use
            value: baseMsgValue, // flat fee sent to contract - 0.0005 ETH
        });
    }

    const modalFooter = useMemo(() => {
        if (gasPrices == null) {
            return (
                <Button variant='secondary' disabled>
                    <FontAwesomeIcon icon={faCircleNotch} className='fa-spin' />{' '}
                    Awaiting gas prices...
                </Button>
            )
        } else if (txSubmitted) {
            return (
                <Button variant='success' disabled>
                    <FontAwesomeIcon icon={faCheck} />{' '}
                    Submitted
                </Button>
            );
        } else if (new BigNumber(entryAmount).lte(0)) {
            return (
                <Button variant='secondary' disabled>
                    Enter Amount
                </Button>
            );
        } else if (new BigNumber(entryAmount).gte(maxBalanceStr)) {
            return (
                <Button variant='secondary' disabled>
                    Insufficient Funds
                </Button>
            );
        } else if (new BigNumber(expectedPriceImpact).gt(slippageTolerance)) {
            return (
                <Button variant='danger' disabled>
                    Slippage Too High
                </Button>
            )
        } else if (currentGasPrice == null) {
            return (
                <Button variant='secondary' disabled>
                    Select Gas Price
                </Button>
            );
        } else if (new BigNumber(entryAmount).lte(maxBalanceStr) &&
            new BigNumber(entryAmount).gt(0)) {
            return (
                <Button variant='success' onClick={doAddLiquidity}>
                    Confirm
                </Button>
            );
        }
    }, [gasPrices, currentGasPrice, entryAmount, maxBalanceStr, expectedPriceImpact, slippageTolerance, txSubmitted]);


    if (!wallet || !provider || !pair) {
        return (
            <Modal show={show} onHide={handleClose}>
                <Modal.Body className='connect-wallet-modal'>
                    <p className='centered'>Connect your wallet to continue.</p>
                </Modal.Body>
            </Modal>
        );
    }

    let currentLpTokens: string | null = null;

    // Calculate expected LP shares
    (window as any).balances = balances;
    (window as any).pairData = pairData;
    (window as any).positionData = positionData;
    (window as any).ethers = ethers;
    (window as any).gasPrices = gasPrices;

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
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Add Liquidity</Modal.Title>
            </Modal.Header>
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
                        {resolveLogo(pair.token0.id)}{' '}
                        {expectedPoolToken0 !== 'NaN' ? expectedPoolToken0 : 0}{' '}
                        {pair.token0.symbol}
                    </p>
                    <p>
                        {resolveLogo(pair.token1.id)}{' '}
                        {expectedPoolToken1 !== 'NaN' ? expectedPoolToken1 : 0}{' '}
                        {pair.token1.symbol}
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
                {currentLpTokens && parseFloat(currentLpTokens) > 0 &&
                    <Button variant='primary' onClick={doRemoveLiquidity}>
                        Remove Liquidity
                    </Button>
                }
                {modalFooter}
            </Modal.Footer>
        </Modal>
    );
}

AddLiquidityModal.propTypes = {
    show: PropTypes.bool.isRequired,
    setShow: PropTypes.func.isRequired,
    wallet: PropTypes.shape({
        account: PropTypes.string,
        providerName: PropTypes.string,
        provider: PropTypes.object,
    }).isRequired,
};

export default AddLiquidityModal;
