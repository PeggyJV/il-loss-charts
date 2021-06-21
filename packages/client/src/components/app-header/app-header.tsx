import { useEffect, useState } from 'react';
import { useWallet } from 'hooks/use-wallet';
import mixpanel from 'util/mixpanel';
import { Modal } from 'react-bootstrap';
import PendingTx from 'components/pending-tx';
import ConnectWalletButton from 'components/connect-wallet-button';
import { ErrorBoundary } from 'react-error-boundary';
import { ModalError } from 'components/page-error';
import ConnectWalletModal from 'components/connect-wallet-modal';
import { ReactComponent as SommelierLogo } from 'styles/sommelier-logo.svg';
export const AppHeader = (): JSX.Element => {
    const { wallet } = useWallet();
    const [networkUpdateModal, setNetworkUpdateModal] = useState<boolean>(
        false,
    );
    const [showConnectWallet, setShowConnectWallet] = useState(false);

    useEffect(() => {
        if (wallet?.account && wallet?.network !== '1') {
            setNetworkUpdateModal(true);
        }
    }, [wallet?.account, wallet?.network]);

    const showWalletModal = () => setShowConnectWallet(true);
    useEffect(() => {
        try {
            mixpanel.track('pageview:landing', {});
        } catch (e) {
            console.error(`Metrics error on add positions:landing.`);
        }
    }, []);

    return (
        <>
            <div className='main-header-container'>
                <div className='nav-button-container'>
                    <h5 className='logo-title'>
                        <SommelierLogo height='36' width='30' />
                        &nbsp;
                        <span>SOMMELIER</span>
                    </h5>
                </div>
                <div className='wallet-combo'>
                    {wallet?.account && <PendingTx />}
                    {<ConnectWalletButton onClick={showWalletModal} />}
                </div>
            </div>
            <ErrorBoundary FallbackComponent={ModalError}>
                <ConnectWalletModal
                    show={showConnectWallet}
                    setShow={setShowConnectWallet}
                />
            </ErrorBoundary>
            <Modal
                show={networkUpdateModal}
                onHide={() => setNetworkUpdateModal(false)}
                dialogClassName='dark'
            >
                <Modal.Header
                    className='connect-wallet-modal-header'
                    closeButton
                >
                    <Modal.Title className='connect-wallet-modal-title'>
                        {'Change Network'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className='connect-wallet-modal'>
                    {
                        'Pairings by Sommelier only supports Ethereum mainnet. Please change your network in your wallet provider. More networks coming soon!'
                    }
                </Modal.Body>
            </Modal>
        </>
    );
};
