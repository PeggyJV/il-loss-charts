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
import { Wallet, ManageLiquidityActionState } from 'types/states';

import { UniswapApiFetcher as Uniswap } from 'services/api';
import { calculatePoolEntryData } from 'util/uniswap-pricing';

import { resolveLogo } from 'components/token-with-logo';
import { AddLiquidityActionButton } from 'components/liquidity-action-button';
import AddLiquidity from 'components/add-liquidity';

function ManageLiquidityModal({
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
        setShow(false);
    }
    const [balances, setBalances] = useState<{
        [tokenName: string]: {
            balance: ethers.BigNumber;
            symbol?: string;
            decimals?: string;
            allowance: ethers.BigNumber;
        };
    }>({});
    const [pairData, setPairData] = useState<UniswapPair | null>(null);
    const [
        positionData,
        setPositionData,
    ] = useState<LPPositionData<string> | null>(null);

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

            const getAllowances = [pair.token0.id, pair.token1.id].map(
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
                    const allowance: ethers.BigNumber = await token.allowance(
                        wallet.account,
                        EXCHANGE_ADD_ABI_ADDRESS
                    );
                    return allowance;
                }
            );

            const getEthBalance = provider.getBalance(wallet.account);
            const [
                ethBalance,
                token0Balance,
                token1Balance,
                token0Allowance,
                token1Allowance
            ] = await Promise.all([getEthBalance, ...getTokenBalances, ...getAllowances]);

            // Get balance for other two tokens
            setBalances({
                ETH: { symbol: 'ETH', balance: ethBalance, decimals: '18', allowance: ethers.BigNumber.from(0) },
                [pair.token0.symbol as string]: {
                    symbol: pair.token0.symbol,
                    balance: token0Balance,
                    decimals: pair.token0.decimals,
                    allowance: token0Allowance
                },
                [pair.token1.symbol as string]: {
                    symbol: pair.token1.symbol,
                    balance: token1Balance,
                    decimals: pair.token0.decimals,
                    allowance: token1Allowance
                },
            });
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

    // const doRemoveLiquidity = async () => {
    //     if (!pairData || !provider || !currentLpTokens) return;

    //     if (!currentGasPrice) {
    //         throw new Error('Gas price not selected.');
    //     }

    //     // Create signer
    //     const signer = provider.getSigner();
    //     // Create read-write contract instance
    //     const removeLiquidityContract = new ethers.Contract(
    //         EXCHANGE_REMOVE_ABI_ADDRESS,
    //         exchangeRemoveAbi,
    //         signer
    //     );

    //     // Call the contract and sign
    //     const ethAddress = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
    //     const baseGasPrice = ethers.utils
    //         .parseUnits(currentGasPrice.toString(), 9)
    //         .toString();

    //     const baseMsgValue = ethers.utils.parseUnits('0.01', 18).toString();
    //     const baseLpTokens = ethers.utils
    //         .parseUnits(currentLpTokens.toString(), 18)
    //         .toString();

    //     await removeLiquidityContract[
    //         'divestEthPairToToken(address,address,uint256)'
    //     ](pairData.id, ethAddress, baseLpTokens, {
    //         gasPrice: baseGasPrice,
    //         gasLimit: '500000', // setting a high gas limit because it is hard to predict gas we will use
    //         value: baseMsgValue, // flat fee sent to contract - 0.0005 ETH
    //     });
    // }

    if (!wallet || !provider || !pair) {
        return (
            <Modal show={show} onHide={handleClose}>
                <Modal.Body className='connect-wallet-modal'>
                    <p className='centered'>Connect your wallet to continue.</p>
                </Modal.Body>
            </Modal>
        );
    }

    // Calculate expected LP shares
    (window as any).balances = balances;
    (window as any).pairData = pairData;
    (window as any).positionData = positionData;
    (window as any).ethers = ethers;
    (window as any).gasPrices = gasPrices;

    if (!pairData) {
        return null;
    }

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Add Liquidity</Modal.Title>
            </Modal.Header>
            <AddLiquidity
                wallet={wallet}
                provider={provider}
                pairData={pairData}
                positionData={positionData}
                gasPrices={gasPrices}
                balances={balances}
                onDone={handleClose}
            />
        </Modal>
    );
}

ManageLiquidityModal.propTypes = {
    show: PropTypes.bool.isRequired,
    setShow: PropTypes.func.isRequired,
    wallet: PropTypes.shape({
        account: PropTypes.string,
        providerName: PropTypes.string,
        provider: PropTypes.object,
    }).isRequired,
};

export default ManageLiquidityModal;
