import PropTypes from 'prop-types';
import { Button, Modal } from 'react-bootstrap';

import useWallet from 'hooks/use-wallet';

import { ReactComponent as MetamaskLogo } from 'styles/metamask-logo.svg';
import { ReactComponent as WalletConnectLogo } from 'styles/walletconnect-logo.svg';

function ConnectWalletModal({
    show,
    setShow,
    wallet,
    connectMetaMask,
    connectWalletConnect,
    disconnectWallet,
    availableProviders,
}: ReturnType<typeof useWallet> & {
    show: boolean;
    setShow: (show: boolean) => void;
}): JSX.Element {
    const handleClose = () => setShow(false);

    const titleText = wallet?.account
        ? `Connected: ${wallet.account}`
        : 'Connect Wallet';

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header className='connect-wallet-modal-header' closeButton>
                <Modal.Title className='connect-wallet-modal-title'>
                    {titleText}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className='connect-wallet-modal'>
                <p className='centered'>
                    Choose a wallet provider to connect with.
                </p>
                <div className='connect-wallet-modal-options-container'>
                    <Button
                        className='connect-wallet-modal-option'
                        variant='outline-secondary'
                        disabled={!availableProviders.metamask}
                        onClick={connectMetaMask}
                    >
                        <MetamaskLogo />
                    </Button>
                    <Button
                        className='connect-wallet-modal-option'
                        variant='outline-secondary'
                        disabled={!availableProviders.walletConnect}
                        onClick={connectWalletConnect}
                    >
                        <WalletConnectLogo />
                    </Button>
                </div>
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
    wallet: PropTypes.shape({
        account: PropTypes.string,
        provider: PropTypes.string,
    }).isRequired,
    connectMetaMask: PropTypes.func,
    connectWalletConnect: PropTypes.func,
    disconnectWallet: PropTypes.func,
    availableProviders: PropTypes.objectOf(PropTypes.bool),
};

export default ConnectWalletModal;
