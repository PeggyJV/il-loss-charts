import PropTypes from 'prop-types';
import { Button, Modal } from 'react-bootstrap';

import useWallet from 'hooks/use-wallet';
import {useErrorHandler} from 'react-error-boundary';
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
    const handleError = useErrorHandler();

    const titleText = wallet?.account
        ? `Connected: ${wallet.account}`
        : 'Connect Wallet';

    const handleConnectMetaMask = async () => {
        try{
            await connectMetaMask();
        } catch(e){
            handleError(e);
        }

        // Close modlal after half-second
        setTimeout(handleClose, 500);
    };

    const handleConnectWalletConnect = async () => {
        try{
            await connectWalletConnect();
        } catch(e){
            handleError(e);
        }

        // Close modlal after half-second
        setTimeout(handleClose, 500);
    };

    return (
        <Modal show={show} onHide={handleClose} dialogClassName='dark'>
            <Modal.Header className='connect-wallet-modal-header' closeButton>
                <Modal.Title className='connect-wallet-modal-title'>
                    {titleText}
                </Modal.Title>
            </Modal.Header>
            {!wallet?.account && (
                <Modal.Body className='connect-wallet-modal'>
                    <p className='centered'>
                        Choose a wallet provider to connect with.
                    </p>
                    <div className='connect-wallet-modal-options-container'>
                        <button
                            className='connect-wallet-modal-option'
                            disabled={!availableProviders.metamask}
                            onClick={handleConnectMetaMask}
                        >
                            <MetamaskLogo />
                        </button>
                        <button
                            className='connect-wallet-modal-option'
                            disabled={!availableProviders.walletconnect}
                            onClick={handleConnectWalletConnect}
                        >
                            <WalletConnectLogo />
                        </button>
                    </div>
                </Modal.Body>
            )}
            {wallet?.account && (
                <Modal.Footer className='manage-liquidity-modal-footer'>
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
        providerName: PropTypes.string,
        provider: PropTypes.object,
    }).isRequired,
    connectMetaMask: PropTypes.func,
    connectWalletConnect: PropTypes.func,
    disconnectWallet: PropTypes.func,
    availableProviders: PropTypes.objectOf(PropTypes.bool),
};

export default ConnectWalletModal;
