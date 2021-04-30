import config from 'config';
import {useWallet} from 'hooks/use-wallet';

function ConnectWalletButton({
    onClick,
}: {
    onClick: () => void;
}): JSX.Element {
    const {wallet} = useWallet();
    console.log(wallet);
    const account = wallet?.account;
    const network = wallet?.network ? config.networks[wallet?.network].name : 'Connected'
    
    // figure out a fix for template literal strings with TS
    const buttonText = account ? network.toUpperCase() + ' : ' + account.toString() : 'CONNECT WALLET';
    
    return (
        <button
            className='connect-wallet-button'
            onClick={onClick}
        >
            {buttonText}
        </button>
    );
}

export default ConnectWalletButton;
