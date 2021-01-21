import PropTypes from 'prop-types';
import { Button, Modal } from 'react-bootstrap';
import Cookies from 'universal-cookie';

import { ReactComponent as MetamaskLogo } from 'styles/metamask-logo.svg';

const cookies = new Cookies();

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
        // Save wallet in cookie so it says on reload, with 24h ttl
        cookies.set('current_wallet', { account, provider: 'metamask' }, { expires: new Date(Date.now() + 1000 * 60 * 60 * 24) });

        ethereum.on('accountsChanged', (accounts) => {
            const [account] = accounts;
            setWallet({ account, provider: 'metamask' });
            cookies.set('current_wallet', { account, provider: 'metamask' }, { expires: new Date(Date.now() + 1000 * 60 * 60 * 24) });
        });
    };

    const disconnectWallet = () => {
        setWallet({ account: null, provider: null });
        cookies.remove('current_wallet');
    };

    const titleText = wallet?.account
        ? `Connected: ${wallet.account}`
        : 'Connect Wallet';

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header className='connect-wallet-modal-header' closeButton>
                <Modal.Title className='connect-wallet-modal-title'>{titleText}</Modal.Title>
            </Modal.Header>
            <Modal.Body className='connect-wallet-modal'>
                <p className='centered'>Choose a wallet provider to connect with.</p>
                <Button
                    className='connect-wallet-modal-option'
                    variant='outline-secondary'
                    disabled={!hasMetamask}
                    onClick={connectMetaMask}
                >
                    <MetamaskLogo />
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
