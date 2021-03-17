import { useErrorHandler } from 'react-error-boundary';
import { useEffect, useState } from 'react';
import Cookies from 'universal-cookie';

import WalletConnectProvider from '@walletconnect/web3-provider';
import { providers } from 'ethers';
import { Provider, Wallet } from 'types/states';
import mixpanel from 'util/mixpanel';

const cookies = new Cookies();

const wcProvider = new WalletConnectProvider({
    infuraId: process.env.REACT_APP_INFURA_PROJECT_ID,
});

(window as any).wcProvider = wcProvider;

export default function useWallet(): {
    ethereum?: any;
    wallet: Wallet;
    connectMetaMask: () => Promise<void>;
    connectWalletConnect: () => Promise<void>;
    disconnectWallet: () => void;
    error: Error | null;
    availableProviders: { [providerName in Provider]: boolean };
} {
    const ethereum = (window as any).ethereum;
    const availableProviders = {
        metamask: ethereum?.isMetaMask,
        walletconnect: true,
    };
    // Try to read wallet from cookies
    const walletFromCookie: Partial<Wallet> = cookies.get('current_wallet');

    let initialWalletState: Wallet = {
        account: null,
        provider: null,
        providerName: null,
    };
    if (
        walletFromCookie &&
        walletFromCookie.account &&
        walletFromCookie.providerName
    ) {
        if (walletFromCookie.providerName === 'metamask') {
            initialWalletState.account = walletFromCookie.account;
            initialWalletState.providerName = walletFromCookie.providerName;
            initialWalletState.provider = (window as any).ethereum;
        }
        // } else if (
        //     // Create walletconnect session if wallet connect
        //     walletFromCookie.providerName === 'walletconnect' &&
        //     !wcConnector.connected
        // ) {
        //     // TODO inject provider
        //     void wcConnector.createSession();
        // }
    } else {
        if (walletFromCookie) {
            console.warn(
                `Tried to load wallet from cookie, but it was not correctly formed.`
            );
        }

        initialWalletState = {
            account: null,
            providerName: null,
            provider: null,
        };
    }

    const [wallet, setWallet] = useState<Wallet>(initialWalletState);
    const [error, setError] = useState<Error | null>(null);

    // Subscribe to updates (do this before calling connection in case we load from cookies)
    if (ethereum) {
        ethereum.on('accountsChanged', (accounts: string[]) => {
            // If we are not currently connected with metamask, then no-op
            if (wallet.providerName !== 'metamask') return;

            const [account] = accounts;
            if (account) {
                const walletObj: Wallet = {
                    account,
                    providerName: 'metamask',
                    provider: (window as any).ethereum,
                };

                setWallet(walletObj);

                try {
                  const mixpanelData = {
                    distinct_id: account,
                    account,
                    providerName: 'metamask'
                  }

                  mixpanel.track('wallet', mixpanelData);
                } catch (e) {
                    console.error(`Metrics error on wallet.`);
                }
            } else {
                disconnectWallet();
            }
        });
    }

    wcProvider.on('accountsChanged', (accounts: string[]) => {
        const [account] = accounts;
        if (account) {
            const walletObj: Wallet = {
                account,
                providerName: 'walletconnect',
                provider: wcProvider,
            };

            setWallet(walletObj);

            try {
              const mixpanelData = {
                distinct_id: account,
                account,
                providerName: 'walletconnect'
              }

              mixpanel.track('wallet', mixpanelData);
            } catch (e) {
                console.error(`Metrics error on wallet.`);
            }
        }
    });

    wcProvider.on('disconnect', () => {
        setWallet({ account: null, provider: null, providerName: null });
        cookies.remove('current_wallet');
    });

    wcProvider.on('network', (newNetwork: string, oldNetwork?: string) => {
        // When a Provider makes its initial connection, it emits a "network"
        // event with a null oldNetwork along with the newNetwork. So, if the
        // oldNetwork exists, it represents a changing network
        if (oldNetwork) {
            window.location.reload();
        }
    });

    const connectMetaMask = async () => {
        if (!ethereum) return;

        const accounts = await ethereum.request({
            method: 'eth_requestAccounts',
        });
        const [account] = accounts;
        const walletObj: Wallet = {
            account,
            providerName: 'metamask',
            provider: (window as any).ethereum,
        };

        setWallet(walletObj);

        try {
          const mixpanelData = {
            distinct_id: account,
            account,
            providerName: 'metamask'
          }

          mixpanel.track('wallet', mixpanelData);
        } catch (e) {
            console.error(`Metrics error on wallet.`);
        }
    };

    const connectWalletConnect = async () => {
        await wcProvider.enable();
        const walletObj: Wallet = {
            account: wcProvider.accounts[0],
            providerName: 'walletconnect',
            provider: wcProvider,
        };

        // If provider is different, sest to the WC wallet
        if (wallet.provider !== 'walletconnect') {
            setWallet(walletObj);

            try {
              const mixpanelData = {
                distinct_id: wcProvider.accounts[0],
                account: wcProvider.accounts[0],
                providerName: 'walletconnect'
              }

              mixpanel.track('wallet:connect', mixpanelData);
            } catch (e) {
                console.error(`Metrics error on wallet.`);
            }
        }
    };

    const disconnectWallet = () => {
        mixpanel.track('wallet:disconnect', { provider: wcProvider });
        setWallet({ account: null, providerName: null, provider: null });
        cookies.remove('current_wallet');
    };

    // re-set cookie when wallet state changes
    useEffect(() => {
        try {
            if (wallet && wallet.account) {
                cookies.set(
                    'current_wallet',
                    {
                        account: wallet.account,
                        providerName: wallet.providerName,
                    },
                    {
                        expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
                    }
                );
            } else {
                // wallet was un-set, remove cookie
                cookies.remove('current_wallet');
            }
        } catch (e) {
            setError(e);
        }
    }, [wallet]);

    return {
        ethereum,
        wallet,
        connectMetaMask,
        connectWalletConnect,
        disconnectWallet,
        error,
        availableProviders,
    };
}
