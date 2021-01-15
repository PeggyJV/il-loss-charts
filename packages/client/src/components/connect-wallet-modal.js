import PropTypes from 'prop-types';
import { Button, Modal } from 'react-bootstrap';

function ConnectWalletModal({ show, setShow, setWallet }) {
    const handleClose = () => setShow(false);

    const ethereum = window.ethereum;
    const hasMetamask = ethereum?.isMetaMask;

    const connectMetaMask = async () => {
        console.log('CONNECTING METAMASK');
        const accounts = await ethereum.request({
            method: 'eth_requestAccounts',
        });
        const account = accounts[0];
        console.log('THIS IS ACCOUNT', account);
        window.account = account;
    };

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Connect Wallet</Modal.Title>
            </Modal.Header>
            <Modal.Body className='connect-wallet-modal'>
                <Button
                    variant='outline-secondary'
                    disabled={!hasMetamask}
                    onClick={connectMetaMask}
                >
                    Metamask
                </Button>
            </Modal.Body>
        </Modal>
    );
}

ConnectWalletModal.propTypes = {
    show: PropTypes.bool.isRequired,
    setShow: PropTypes.func.isRequired,
    setWallet: PropTypes.func.isRequired,
};

export default ConnectWalletModal;
