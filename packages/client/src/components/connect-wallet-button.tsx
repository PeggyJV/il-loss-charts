import config from 'config';
import { Wallet } from 'types/states';

function ConnectWalletButton({
    onClick,
    wallet,
}: {
    onClick: () => void;
    wallet: Wallet;
}): JSX.Element {
    const account = wallet?.account;
    const network = wallet?.network ? config.networks[wallet?.network].name : 'Connected'
    
    // figure out a fix for template literal strings with TS
    const buttonText = account ? network.toUpperCase() + ' : ' + account : 'CONNECT WALLET';
    
    return (
        <>
            <button
                className='connect-wallet-button'
                onClick={onClick}
            >
                {buttonText}
            </button>
        </>
    );
}

export default ConnectWalletButton;
