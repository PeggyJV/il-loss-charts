import PropTypes from 'prop-types';
import { Modal } from 'react-bootstrap';

import { ethers } from 'ethers';

import useWallet from 'hooks/use-wallet';

function AddLiquidityModal({
    show,
    setShow,
    wallet,
}: ReturnType<typeof useWallet> & {
    show: boolean;
    setShow: (show: boolean) => void;
}): JSX.Element {
    const handleClose = () => setShow(false);

    if (!wallet) {
        return (
            <Modal show={show} onHide={handleClose}>
                <Modal.Body className='connect-wallet-modal'>
                    <p className='centered'>Connect your wallet to continue.</p>
                </Modal.Body>
            </Modal>
        );
    }

    if (wallet.providerName === 'metamask') {
        if (!(window as any).ethereum) {
            throw new Error(
                'Metamask wallet connected but window.ethereum does not exist.'
            );
        }
        const provider = new ethers.providers.Web3Provider(
            (window as any).ethereum
        );
    }

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Add Liquidity</Modal.Title>
            </Modal.Header>
            <Modal.Body className='connect-wallet-modal'>
                <p className='centered'>
                    Choose a wallet provider to connect with.
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
        provider: PropTypes.string,
    }).isRequired,
};

export default AddLiquidityModal;
