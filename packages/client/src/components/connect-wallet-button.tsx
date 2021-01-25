import { Button } from 'react-bootstrap';
import PropTypes from 'prop-types';

import { Wallet } from 'types/states';

function ConnectWalletButton({
    onClick,
    wallet
}: {
    onClick: () => void,
    wallet: Wallet
}) {
    const account = wallet?.account;
    const buttonText = account ? `Connected: ${account}` : 'Connect Wallet';
    const buttonVariant = account ? 'success' : 'primary';

    return (
        <>
            <Button
                variant={buttonVariant}
                size='sm'
                className='connect-wallet-button'
                onClick={onClick}
            >
                {buttonText}
            </Button>
        </>
    );
}

ConnectWalletButton.propTypes = {
    onClick: PropTypes.func,
    wallet: PropTypes.shape({
        account: PropTypes.string,
        provider: PropTypes.string,
    }).isRequired,
};

export default ConnectWalletButton;
