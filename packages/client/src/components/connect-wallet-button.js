import { Button } from 'react-bootstrap';
import PropTypes from 'prop-types';

function ConnectWalletButton({ onClick }) {
    return (
        <>
            <Button variant='primary' size='sm' onClick={onClick}>
                Connect Wallet
            </Button>
        </>
    );
}

ConnectWalletButton.propTypes = { onClick: PropTypes.func };

export default ConnectWalletButton;
