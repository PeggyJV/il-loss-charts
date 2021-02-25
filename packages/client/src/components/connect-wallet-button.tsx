import { Button } from 'react-bootstrap';
import PropTypes from 'prop-types';

import { Wallet } from 'types/states';

function ConnectWalletButton({
    onClick,
    wallet,
}: {
    onClick: () => void;
    wallet: Wallet;
}): JSX.Element {
    const account = wallet?.account;
    const buttonText = account ? `Connected: ${account}` : 'CONNECT WALLET';

    const buttonStyle = {
        fontWeight: 800,
        border: 'none',
        borderRadius: 0,
        padding: '0.5rem 2rem',
        width: 'fit-content',
    };
    const walletStyle = {
        ...buttonStyle,
        background: 'var(--bgAccent)',
    };
    const accountStyle = {
        ...buttonStyle,
        background: 'var(--bgMoon)',
    };

    return (
        <>
            <Button
                size='sm'
                className='connect-wallet-button'
                style={account ? accountStyle : walletStyle}
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
        providerName: PropTypes.string,
        provider: PropTypes.object,
    }).isRequired,
};

export default ConnectWalletButton;
