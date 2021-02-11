import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
    Row,
    Col,
    Card,
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

import erc20Abi from 'constants/abis/erc20.json';

import { Token, MarketStats, UniswapPair } from '@sommelier/shared-types';
import { Wallet } from 'types/states';

import { UniswapApiFetcher as Uniswap } from 'services/api';

import { resolveLogo } from 'components/token-with-logo';

function AddLiquidityModal({
    show,
    setShow,
    wallet,
    pair,
}: {
    wallet: Wallet;
    show: boolean;
    setShow: (show: boolean) => void;
    pair: MarketStats | null;
}): JSX.Element | null {
    const handleClose = () => setShow(false);
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

    let provider: ethers.providers.Web3Provider | null = null;

    if (wallet.provider) {
        provider = new ethers.providers.Web3Provider(wallet?.provider);
    }

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

        console.log('GETTING BALANCES', wallet.account);
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
                    `Could not fetch pair data for ${pair.id}: ${error.message}`
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
        setEntryAmount(0);
    }, [entryToken]);

    if (!wallet || !provider || !pair) {
        return (
            <Modal show={show} onHide={handleClose}>
                <Modal.Body className='connect-wallet-modal'>
                    <p className='centered'>Connect your wallet to continue.</p>
                </Modal.Body>
            </Modal>
        );
    }

    const maxBalance = balances[entryToken]?.balance;
    const maxBalanceStr = ethers.utils.formatUnits(
        maxBalance || 0,
        parseInt(balances[entryToken]?.decimals || '0', 10)
    );

    let expectedToken0: string;
    let expectedToken1: string;

    // Calculate expected LP shares
    (window as any).balances = balances;
    (window as any).pairData = pairData;
    (window as any).ethers = ethers;

    if (!maxBalance || !pairData) {
        return null;
    }

    if (entryToken === 'ETH') {
        const amt = new BigNumber(entryAmount);
        const pctShare = amt.div(pairData.trackedReserveETH);

        expectedToken0 = pctShare.times(pairData.reserve0).toFixed(4);
        expectedToken1 = pctShare.times(pairData.reserve1).toFixed(4);
    } else if (entryToken === pairData.token0.symbol) {
        const amt = new BigNumber(entryAmount);
        // Half of the value will go to the other token
        const pctShare = amt.div(2).div(pairData.reserve0);

        expectedToken0 = pctShare.times(pairData.reserve0).toFixed(4);
        expectedToken1 = pctShare.times(pairData.reserve1).toFixed(4);
    } else if (entryToken === pairData.token1.symbol) {
        const amt = new BigNumber(entryAmount);
        // Half of the value will go to the other token
        const pctShare = amt.div(2).div(pairData.reserve1);

        expectedToken0 = pctShare.times(pairData.reserve0).toFixed(4);
        expectedToken1 = pctShare.times(pairData.reserve1).toFixed(4);
    } else {
        throw new Error('Entry token does not belong to pair');
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
                        {expectedToken0 !== 'NaN' ? expectedToken0 : 0}{' '}
                        {pair.token0.symbol}
                    </p>
                    <p>
                        {resolveLogo(pair.token1.id)}{' '}
                        {expectedToken1 !== 'NaN' ? expectedToken1 : 0}{' '}
                        {pair.token1.symbol}
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
                    <Form.Group>
                        <Form.Label>Transaction Speed:</Form.Label>
                    </Form.Group>
                </Card>
            </Modal.Body>
            <Modal.Footer>
                {new BigNumber(entryAmount).lte(maxBalanceStr) ? (
                    <Button variant='success'>Confirm</Button>
                ) : (
                    <Button variant='secondary' disabled>
                        Insufficient Funds
                    </Button>
                )}
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
