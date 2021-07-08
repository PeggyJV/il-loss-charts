import { NetworkIds } from '@sommelier/shared-types';
import {
    useEffect,
    useState,
    useCallback,
    createContext,
    useContext,
} from 'react';
import Cookies from 'universal-cookie';

import WalletConnectProvider from '@walletconnect/web3-provider';
import { Provider, Wallet } from 'types/states';
import mixpanel from 'util/mixpanel';
import { debug } from 'util/debug';

const cookies = new Cookies();

const wcProvider = new WalletConnectProvider({
    infuraId: process.env.REACT_APP_INFURA_PROJECT_ID,
    qrcodeModalOptions: {
        mobileLinks: ['trust', 'argent', 'ledger'],
    },
});

debug.wcProvider = wcProvider;

type WalletContextType = {
    ethereum?: any;
    wallet: Wallet;
    connectMetaMask: () => Promise<void>;
    connectWalletConnect: () => Promise<void>;
    disconnectWallet: () => void;
    error: Error | null;
    availableProviders: { [providerName in Provider]: boolean };
};

const initialWallet = {
    ethereum: null,
    wallet: {
        account: null,
        provider: null,
        providerName: null,
        network: null,
    },
    error: null,
};
export const WalletContext = createContext<Partial<WalletContextType>>(
    initialWallet,
);

export const WalletProvider = ({
    children,
}: {
    children: JSX.Element;
}): JSX.Element => {
    const ethereum = (window as any).ethereum;
    const availableProviders = {
        metamask: ethereum?.isMetaMask,
        walletconnect: true,
    };
    // Try to read wallet from cookies
    const initialWalletState: Wallet = {
        account: null,
        provider: null,
        providerName: null,
        network: null,
    };
    const [wallet, setWallet] = useState<Wallet>(initialWalletState);
    debug.wallet = wallet;
    useEffect(() => {
        const walletFromCookie: Partial<Wallet> = cookies.get('current_wallet');
        if (
            walletFromCookie &&
            walletFromCookie.account &&
            walletFromCookie.providerName
        ) {
            // only recover metamask from cookie to avoid edge cases / sync issues with walletconnect bridge
            if (walletFromCookie.providerName === 'metamask') {
                const provider = (window as any).ethereum;
                const network = ethereum.networkVersion || '1';
                setWallet({ ...walletFromCookie, network, provider } as Wallet);
            }
        }
    }, [ethereum?.networkVersion]);

    const [error, setError] = useState<Error | null>(null);

    const disconnectWallet = useCallback(() => {
        const mixpanelData = {
            distinct_id: wallet.account,
            account: wallet.account,
            providerName: wallet.providerName,
        };
        mixpanel.track('wallet:disconnected', mixpanelData);

        setWallet({
            account: null,
            providerName: null,
            provider: null,
            network: null,
        });
        cookies.remove('current_wallet');
    }, [wallet.account, wallet.providerName]);

    // Subscribe to updates (do this before calling connection in case we load from cookies)
    useEffect(() => {
        if (ethereum) {
            const handleNetworkChange = (networkId: NetworkIds) => {
                if (wallet?.providerName !== 'metamask') return;

                setWallet({ ...wallet, network: networkId });
            };

            const handleAccountChange = (accounts: string[]) => {
                // If we are not currently connected with metamask, then no-op
                if (wallet.providerName !== 'metamask') return;

                const [account] = accounts;
                if (account) {
                    const walletObj: Wallet = {
                        account,
                        providerName: 'metamask',
                        provider: (window as any).ethereum,
                        network: ethereum.networkVersion || '1',
                    };

                    setWallet(walletObj);

                    try {
                        const mixpanelData = {
                            distinct_id: account,
                            account,
                            providerName: 'metamask',
                        };

                        if (walletObj?.account) {
                            mixpanel.identify(walletObj.account);
                        }

                        mixpanel.track('wallet', mixpanelData);
                    } catch (e) {
                        console.error(`Metrics error on wallet.`);
                    }
                } else {
                    disconnectWallet();
                }
            };
            ethereum.on('accountsChanged', handleAccountChange);

            ethereum.on('networkChanged', handleNetworkChange);

            return () => {
                ethereum.removeListener('accountsChanged', handleAccountChange);
                ethereum.removeListener('networkChanged', handleNetworkChange);
            };
        }
    }, [disconnectWallet, ethereum, wallet]);

    useEffect(() => {
        // const handleConnect = (...params: any[]) => {
        //     console.log('wallet connect : onConnect', params);
        // };

        // wcProvider.on('connect', handleConnect);

        // const handleSessionUpdate = (error: any, payload: any) => {
        //     console.log('wallet connect : onSessionUpdate', payload);
        // };
        // wcProvider.on('session_update', handleSessionUpdate);

        const handleAccountChange = (accounts: string[]) => {
            const [account] = accounts;

            if (account) {
                const walletObj: Wallet = {
                    account,
                    providerName: 'walletconnect',
                    provider: wcProvider,
                    network:
                        ((wcProvider?.networkId as unknown) as NetworkIds) ||
                        '1',
                };

                setWallet(walletObj);

                try {
                    const mixpanelData = {
                        distinct_id: account,
                        account,
                        providerName: 'walletconnect',
                    };

                    mixpanel.track('wallet', mixpanelData);
                } catch (e) {
                    console.error(`Metrics error on wallet.`);
                }
            }
        };

        // TODO this doesn't work with wallet connect
        const handleNetworkChange = (
            newNetwork: string,
            oldNetwork?: string,
        ) => {
            // When a Provider makes its initial connection, it emits a "network"
            // event with a null oldNetwork along with the newNetwork. So, if the
            // oldNetwork exists, it represents a changing network
            if (oldNetwork) {
                window.location.reload();
                setWallet({
                    account: null,
                    provider: null,
                    providerName: null,
                    network: null,
                });
            }
        };

        const handleDisconnect = () => {
            setWallet({
                account: null,
                provider: null,
                providerName: null,
                network: null,
            });
            cookies.remove('current_wallet');
        };

        wcProvider.on('network', handleNetworkChange);
        wcProvider.on('accountsChanged', handleAccountChange);
        wcProvider.on('disconnect', handleDisconnect);

        return () => {
            wcProvider.removeListener('accountsChanged', handleAccountChange);
            wcProvider.removeListener('networkChanged', handleNetworkChange);
            wcProvider.removeListener('disconnect', handleDisconnect);
            // wcProvider.removeListener('connect', handleConnect);
            // wcProvider.removeListener('session_update', handleSessionUpdate);
        };
    }, []);

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
            network: (window as any).ethereum.networkVersion || '1',
        };
        setWallet(walletObj);

        try {
            const mixpanelData = {
                distinct_id: account,
                account,
                providerName: 'metamask',
            };

            if (walletObj?.account) {
                mixpanel.identify(walletObj.account);
            }

            mixpanel.track('wallet:connected', mixpanelData);
        } catch (e) {
            console.error(`Metrics error on wallet.`);
        }
    };

    const connectWalletConnect = async () => {
        await wcProvider.enable();
        const walletObj: Wallet = {
            account: wcProvider?.accounts[0],
            providerName: 'walletconnect',
            provider: wcProvider,
            network: ((wcProvider?.networkId as unknown) as NetworkIds) || '1',
        };

        // If provider is different, set to the WC wallet
        // if (wallet.provider !== 'walletconnect') {
        setWallet(walletObj);

        try {
            const mixpanelData = {
                distinct_id: wcProvider.accounts[0],
                account: wcProvider.accounts[0],
                providerName: 'walletconnect',
            };
            if (walletObj?.account) {
                mixpanel.identify(walletObj.account);
            }
            mixpanel.people?.set(wcProvider.accounts[0], {
                wallet: wcProvider.accounts[0],
            });

            mixpanel.track('wallet:connected', mixpanelData);
        } catch (e) {
            console.error(`Metrics error on wallet.`);
        }
        // }
    };

    //re-set cookie when wallet state changes
    useEffect(() => {
        try {
            if (wallet && wallet?.account) {
                cookies.set(
                    'current_wallet',
                    {
                        account: wallet.account,
                        providerName: wallet.providerName,
                    },
                    {
                        expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
                    },
                );
            } else {
                // wallet was un-set, remove cookie
                cookies.remove('current_wallet');
            }
        } catch (e) {
            setError(e);
        }
    }, [wallet]);

    return (
        <WalletContext.Provider
            value={{
                ethereum,
                wallet,
                connectMetaMask,
                connectWalletConnect,
                disconnectWallet,
                availableProviders,
                error,
            }}
        >
            {children}
        </WalletContext.Provider>
    );
};

export const useWallet = (): WalletContextType => {
    return useContext(WalletContext) as WalletContextType;
};
