import { NetworkIds } from '@sommelier/shared-types';
import { useEffect, useState, createContext, useContext } from 'react';
import Cookies from 'universal-cookie';

// import WalletConnectProvider from '@walletconnect/web3-provider';
import { Wallet } from 'types/states';
import mixpanel from 'util/mixpanel';

const cookies = new Cookies();

// const wcProvider = new WalletConnectProvider({
//     infuraId: process.env.REACT_APP_INFURA_PROJECT_ID,
// });

// debug.wcProvider = wcProvider;

type WalletContextType = {
    ethereum?: any;
    wallet: Wallet;
    connectMetaMask: () => Promise<void>;
    // connectWalletConnect: () => Promise<void>;
    disconnectWallet: () => void;
    error: Error | null;
    // availableProviders: { [providerName in Provider]: boolean };
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
    initialWallet
);

export const WalletProvider = ({
    children,
}: {
    children: JSX.Element;
}): JSX.Element => {
    const ethereum = (window as any).ethereum;
    // const availableProviders = {
    //     metamask: ethereum?.isMetaMask,
    //     walletconnect: true,
    // };
    // Try to read wallet from cookies
    const walletFromCookie: Partial<Wallet> = cookies.get('current_wallet');

    let initialWalletState: Wallet = {
        account: null,
        provider: null,
        providerName: null,
        network: null,
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
            initialWalletState.network = ethereum.networkVersion;
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
            network: null,
        };
    }

    const [wallet, setWallet] = useState<Wallet>(initialWalletState);
    const [error, setError] = useState<Error | null>(null);

    // Subscribe to updates (do this before calling connection in case we load from cookies)
    useEffect(() => {
        if (ethereum) {
            const handleNetworkChange = (networkId: NetworkIds) => {
                console.log('NETWORK CHANGE', networkId);
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
                        network: ethereum.networkVersion,
                    };

                    setWallet(walletObj);

                    try {
                        const mixpanelData = {
                            distinct_id: account,
                            account,
                            providerName: 'metamask',
                        };

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
            network: (window as any).ethereum.networkVersion,
        };

        setWallet(walletObj);

        try {
            const mixpanelData = {
                distinct_id: account,
                account,
                providerName: 'metamask',
            };

            mixpanel.track('wallet', mixpanelData);
        } catch (e) {
            console.error(`Metrics error on wallet.`);
        }
    };

    const disconnectWallet = () => {
        mixpanel.track('wallet:disconnect', {
            providerName: wallet.providerName,
        });
        setWallet({
            account: null,
            providerName: null,
            provider: null,
            network: null,
        });
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

    return (
        <WalletContext.Provider
            value={{
                ethereum,
                wallet,
                connectMetaMask,
                disconnectWallet,
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
// return {
//         ethereum,
//         wallet,
//         connectMetaMask,
//         connectWalletConnect,
//         disconnectWallet,
//         error,
//         availableProviders,
//     };
