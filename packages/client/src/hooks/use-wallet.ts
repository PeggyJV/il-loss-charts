import { useEffect, useState } from 'react';
import Cookies from 'universal-cookie';

import { Provider, Wallet } from 'types/states';
import mixpanel from 'util/mixpanel';

const cookies = new Cookies();

export default function useWallet(): {
    ethereum?: any;
    wallet: Wallet;
    connectMetaMask: () => Promise<void>;
    disconnectWallet: () => void;
    availableProviders: { [providerName in Provider]: boolean };
} {
    const ethereum = (window as any).ethereum;
    const availableProviders = {
        metamask: ethereum?.isMetaMask,
    };

    // Try to read wallet from cookies
    const walletFromCookie = cookies.get('current_wallet');

    let initialWalletState;
    if (
        walletFromCookie &&
        walletFromCookie.account &&
        walletFromCookie.provider
    ) {
        initialWalletState = walletFromCookie;
    } else {
        if (walletFromCookie) {
            console.warn(
                `Tried to load wallet from cookie, but it was not correctly formed.`
            );
        }

        initialWalletState = { account: null, provider: null };
    }

    const [wallet, setWallet] = useState(initialWalletState);

    if (ethereum) {
        ethereum.on('accountsChanged', (accounts: string[]) => {
            const [account] = accounts;
            if (account) {
                const walletObj = { account, provider: 'metamask' };
                mixpanel.track('wallet', walletObj);
                setWallet(walletObj);
            } else {
                disconnectWallet();
            }
        });
    }

    const connectMetaMask = async () => {
        if (!ethereum) return;

        const accounts = await ethereum.request({
            method: 'eth_requestAccounts',
        });
        const [account] = accounts;
        const walletObj = { account, provider: 'metamask' };
        mixpanel.track('wallet', walletObj);
        setWallet(walletObj);
    };

    const disconnectWallet = () => {
        setWallet({ account: null, provider: null });
        cookies.remove('current_wallet');
    };

    // re-set cookie when wallet state changes
    useEffect(() => {
        if (wallet && wallet.account) {
            cookies.set('current_wallet', wallet, {
                expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
            });
        } else {
            // wallet was un-set, remove cookie
            cookies.remove('current_wallet');
        }
    }, [wallet]);

    return {
        ethereum,
        wallet,
        connectMetaMask,
        disconnectWallet,
        availableProviders,
    };
}
