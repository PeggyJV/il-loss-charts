import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'react-bootstrap';

import { ethers } from 'ethers';

import erc20Abi from 'constants/abis/erc20.json';

import { MarketStats } from '@sommelier/shared-types';
import { Wallet } from 'types/states';

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
}): JSX.Element {
    const handleClose = () => setShow(false);
    const [balances, setBalances] = useState<{
        [tokenName: string]: { balance: ethers.BigNumber };
    }>({});

    let provider: ethers.providers.Web3Provider | null = null;

    if (wallet.provider) {
        provider = new ethers.providers.Web3Provider(wallet?.provider);
    }

    useEffect(() => {
        // get balances of both tokens
        const getBalances = async () => {
            if (!provider || !wallet.account) return;

            const tokenBalances = [pair.token0.id, pair.token1.id].map(
                (tokenAddress) => {
                    if (!tokenAddress) {
                        throw new Error(
                            'Could not get balance for pair without token address'
                        );
                    }
                    const token = new ethers.Contract(
                        tokenAddress,
                        erc20Abi
                    ).connect(provider as ethers.provider.Web3Provider);
                    const balance = token.balanceOf(wallet.account);
                }
            );

            const ethBalance = await provider.getBalance(wallet.account);

            // Get balance for other two tokens
            setBalances((prevBalances) => ({
                ...prevBalances,
                eth: { balance: ethBalance },
            }));
        };

        void getBalances();
    }, [wallet, provider]);

    if (!wallet || !provider) {
        return (
            <Modal show={show} onHide={handleClose}>
                <Modal.Body className='connect-wallet-modal'>
                    <p className='centered'>Connect your wallet to continue.</p>
                </Modal.Body>
            </Modal>
        );
    }

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Add Liquidity</Modal.Title>
            </Modal.Header>
            <Modal.Body className='connect-wallet-modal'>
                <p className='centered'>
                    Your ETH balance:{' '}
                    {ethers.utils.formatEther(balances.eth?.balance || 0) ||
                        'Fetching...'}
                </p>
            </Modal.Body>
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
