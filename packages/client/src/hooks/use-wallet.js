import { useEffect, useState } from 'react';
import Cookies from 'universal-cookie';

const cookies = new Cookies();

export default function useWallet() {
    const ethereum = window.ethereum;
    const availableProviders = {
        metamask: ethereum?.isMetaMask
    };

    // Try to read wallet from cookies
    const walletFromCookie = cookies.get('current_wallet');

    let initialWalletState;
    if (walletFromCookie && walletFromCookie.account && walletFromCookie.provider) {
        initialWalletState = walletFromCookie;
    } else {
        if (walletFromCookie) {
            console.warn(`Tried to load wallet from cookie, but it was not correctly formed.`);
        }

        initialWalletState = { account: null, provider: null };
    }

    const [wallet, setWallet] = useState(initialWalletState);

    ethereum.on('accountsChanged', (accounts) => {
        const [account] = accounts;
        if (account) {
            setWallet({ account, provider: 'metamask' });
        } else {
            disconnectWallet();
        }
    });

    const connectMetaMask = async () => {
        const accounts = await ethereum.request({
            method: 'eth_requestAccounts',
        });
        const [account] = accounts;
        setWallet({ account, provider: 'metamask' });
    };

    const disconnectWallet = () => {
        setWallet({ account: null, provider: null });
        cookies.remove('current_wallet');
    };

    // re-set cookie when wallet state changes
    useEffect(() => {
        if (wallet && wallet.account) {
            cookies.set('current_wallet', wallet, { expires: new Date(Date.now() + 1000 * 60 * 60 * 24) });
        } else {
            // wallet was un-set, remove cookie
            cookies.remove('current_wallet');
        }
    }, [wallet]);

    return { wallet, connectMetaMask, disconnectWallet, availableProviders };
}