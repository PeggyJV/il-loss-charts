import { useEffect, useState } from 'react';
import Cookies from 'universal-cookie';

import WalletConnect from '@walletconnect/client';
import QRCodeModal from '@walletconnect/qrcode-modal';

import { Provider, Wallet } from 'types/states';
import mixpanel from 'util/mixpanel';

const cookies = new Cookies();

export default function useWallet(): {
    ethereum?: any;
    wallet: Wallet;
    connectMetaMask: () => Promise<void>;
    connectWalletConnect: () => Promise<void>;
    disconnectWallet: () => void;
    availableProviders: { [providerName in Provider]: boolean };
} {
    const ethereum = (window as any).ethereum;
    const availableProviders = {
        metamask: ethereum?.isMetaMask,
        walletConnect: true,
    };

    const wcConnector = new WalletConnect({
        bridge: 'https://bridge.walletconnect.org', // Required
        qrcodeModal: QRCodeModal,
    });

    (window as any).wcConnector = wcConnector;

    // Try to read wallet from cookies
    const walletFromCookie = cookies.get('current_wallet');

    let initialWalletState;
    if (
        walletFromCookie &&
        walletFromCookie.account &&
        walletFromCookie.provider
    ) {
        initialWalletState = walletFromCookie;

        // Create walletconnect session if wallet connect
        if (
            initialWalletState.provider === 'walletconnect' &&
            !wcConnector.connected
        ) {
            void wcConnector.createSession();
        }
    } else {
        if (walletFromCookie) {
            console.warn(
                `Tried to load wallet from cookie, but it was not correctly formed.`
            );
        }

        initialWalletState = { account: null, provider: null };
    }

    const [wallet, setWallet] = useState(initialWalletState);

    // Subscribe to updates (do this before calling connection in case we load from cookies)
    if (ethereum) {
        ethereum.on('accountsChanged', (accounts: string[]) => {
            // If we are not currently connected with metamask, then no-op
            if (wallet.provider !== 'metamask') return;

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

    wcConnector.on('session_update', (error, payload) => {
        if (error) {
            throw error;
        }

        // Get updated accounts and chainId
        const { accounts } = payload.params[0];
        const [account] = accounts;
        if (account) {
            const walletObj = { account, provider: 'walletconnect' };
            mixpanel.track('wallet', walletObj);
            setWallet(walletObj);
        }
    });

    wcConnector.on('disconnect', (error, payload) => {
        if (error) {
            throw error;
        }

        setWallet({ account: null, provider: null });
        cookies.remove('current_wallet');
    });

    // Subscribe to connection events
    wcConnector.on('connect', (error, payload) => {
        if (error) {
            throw error;
        }

        // Get provided accounts and chainId
        const { accounts } = payload.params[0];
        const [account] = accounts;
        if (account) {
            const walletObj = { account, provider: 'walletconnect' };
            mixpanel.track('wallet', walletObj);
            setWallet(walletObj);
        }
    });

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

    const connectWalletConnect = async () => {
        if (!wcConnector.connected) {
            await wcConnector.createSession();
        } else {
            console.warn('Already connected');
        }

        // If provider is different, set to the WC wallet
        if (wallet.provider !== 'walletconnect') {
            setWallet({
                account: wcConnector.accounts[0],
                provider: 'walletconnect',
            });
        }
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
        connectWalletConnect,
        disconnectWallet,
        availableProviders,
    };
}
