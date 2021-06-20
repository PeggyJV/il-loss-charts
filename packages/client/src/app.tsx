import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-widgets/dist/css/react-widgets.css';
import 'styles/app.scss';
import classNames from 'classnames';
import { ErrorBoundary } from 'react-error-boundary';
import { useEffect, ReactElement } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { useEthGasPrices } from 'hooks';
import { PendingTxProvider } from 'hooks/use-pending-tx';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LandingContainer from 'containers/landing-container';
import { PageError } from 'components/page-error';

import { WalletProvider } from 'hooks/use-wallet';

function App(): ReactElement {
    const gasPrices = useEthGasPrices();
    // subscribe to the hook, will propogate to the nearest boundary

    const queryClient = new QueryClient();
    // useErrorHandler(error);
    useEffect(() => {
        document.body.classList.add('dark');
    }, []);

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
                                            fallbackRender={({ error }) => (
                                                <PageError errorMsg={error} />
                                            )}
                                        >
                                            <Switch>
                                                <Route path='/pools'>
                                                    <LandingContainer
                                                        gasPrices={gasPrices}
                                                    />
                                                </Route>
                                                <Route path='/'>
                                                    <LandingContainer
                                                        gasPrices={gasPrices}
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
