import PropTypes from 'prop-types';
import { Button, Modal } from 'react-bootstrap';

function ConnectWalletModal({ show, setShow, setWallet, wallet }) {
    const handleClose = () => setShow(false);

    const ethereum = window.ethereum;
    const hasMetamask = ethereum?.isMetaMask;

    const connectMetaMask = async () => {
        const accounts = await ethereum.request({
            method: 'eth_requestAccounts',
        });
        const [account] = accounts;
        setWallet({ account, provider: 'metamask' });

        ethereum.on('accountsChanged', (accounts) => {
            const [account] = accounts;
            setWallet({ account, provider: 'metamask' });
        });
    };

    const disconnectWallet = () => {
        setWallet({ account: null, provider: null });
    };

    const titleText = wallet?.account
        ? `Connected: ${wallet.account}`
        : 'Connect Wallet';

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header className='connect-wallet-modal-header' closeButton>
                <Modal.Title>{titleText}</Modal.Title>
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
            {wallet && (
                <Modal.Footer>
                    <Button
                        variant='danger'
                        size='sm'
                        onClick={disconnectWallet}
                    >
                        Disconnect
                    </Button>
                </Modal.Footer>
            )}
        </Modal>
    );
}

ConnectWalletModal.propTypes = {
    show: PropTypes.bool.isRequired,
    setShow: PropTypes.func.isRequired,
    setWallet: PropTypes.func.isRequired,
    wallet: PropTypes.shape({
        account: PropTypes.string,
        provider: PropTypes.string,
    }).isRequired,
};

export default ConnectWalletModal;
