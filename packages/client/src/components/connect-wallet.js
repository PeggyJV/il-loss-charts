import { Button } from 'react-bootstrap';

function ConnectWalletButton() {
    return (
        <>
            <Button variant='secondary' size='sm' disabled>
                Connect Wallet
            </Button>
            <div style={{ fontSize: '0.8rem' }}>☝️ Coming soon!</div>
        </>
    );
}

export default ConnectWalletButton;
