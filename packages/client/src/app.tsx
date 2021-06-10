import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-widgets/dist/css/react-widgets.css';
import 'styles/app.scss';
import classNames from 'classnames';
import { ErrorBoundary } from 'react-error-boundary';
import { useState, useEffect, ReactElement } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { useEthGasPrices } from 'hooks';
import { PendingTxProvider } from 'hooks/use-pending-tx';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LandingContainer from 'containers/landing-container';
import ConnectWalletModal from 'components/connect-wallet-modal';
import { PageError, ModalError } from 'components/page-error';

import { WalletProvider } from 'hooks/use-wallet';

function App(): ReactElement {
    // ------------------ Initial Mount - API calls for first render ------------------

    // const [allPairs, setAllPairs] = useState<AllPairsState>({
    //     isLoading: true,
    //     pairs: null,
    //     lookups: null,
    //     byLiquidity: null,
    // });

    const gasPrices = useEthGasPrices();
    const [showConnectWallet, setShowConnectWallet] = useState(false);
    // subscribe to the hook, will propogate to the nearest boundary

    const queryClient = new QueryClient();
    // useErrorHandler(error);
    useEffect(() => {
        document.body.classList.add('dark');
    }, []);
    // useEffect(() => {
    //     const fetchAllPairs = async () => {
    //         // Fetch all pairs
    //         const { data: pairsRaw, error } = await Uniswap.getTopPairs();

    //         if (error) {
    //             // we could not list pairs
    //             console.warn(`Could not fetch top pairs: ${error}`);
    //             debug.error = error;
    //             setError(error);
    //             return;
    //         }

    //         if (pairsRaw) {
    //             const calculated = calculatePairRankings(pairsRaw);

    //             setAllPairs({
    //                 isLoading: false,
    //                 pairs: calculated.pairs.map((p) => new UniswapPair(p)),
    //                 lookups: calculated.pairLookups,
    //                 byLiquidity: calculated.byLiquidity,
    //             });
    //         }
    //     };

    //     void fetchAllPairs();
    //     // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, []);

    return (
        <ErrorBoundary
            fallbackRender={({ error }) => <PageError errorMsg={error} />}
        >
            <WalletProvider>
                <QueryClientProvider client={queryClient}>
                    <ToastContainer
                        position='top-center'
                        autoClose={5000}
                        hideProgressBar={false}
                        newestOnTop
                        closeOnClick
                        rtl={false}
                        pauseOnFocusLoss
                        draggable
                        pauseOnHover
                    />
                    <Router>
                        <div
                            className={classNames('app', 'dark')}
                            id='app-wrap'
                        >
                            <PendingTxProvider>
                                <div className='app-body' id='app-body'>
                                    <>
                                        <ErrorBoundary
                                            FallbackComponent={ModalError}
                                        >
                                            <ConnectWalletModal
                                                show={showConnectWallet}
                                                setShow={setShowConnectWallet}
                                            />
                                        </ErrorBoundary>
                                        <ErrorBoundary
                                            fallbackRender={({ error }) => (
                                                <PageError errorMsg={error} />
                                            )}
                                        >
                                            <Switch>
                                                <Route path='/pools'>
                                                    <LandingContainer
                                                        gasPrices={gasPrices}
                                                        setShowConnectWallet={
                                                            setShowConnectWallet
                                                        }
                                                    />
                                                </Route>
                                                <Route path='/'>
                                                    <LandingContainer
                                                        gasPrices={gasPrices}
                                                        setShowConnectWallet={
                                                            setShowConnectWallet
                                                        }
                                                    />
                                                </Route>
                                            </Switch>
                                        </ErrorBoundary>
                                    </>
                                </div>
                            </PendingTxProvider>
                        </div>
                    </Router>
                </QueryClientProvider>
            </WalletProvider>
        </ErrorBoundary>
    );
}

export default App;
