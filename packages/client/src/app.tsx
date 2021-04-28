import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-widgets/dist/css/react-widgets.css';
import 'styles/app.scss';
import classNames from 'classnames';
import { ErrorBoundary, useErrorHandler } from 'react-error-boundary';
import {
    useState,
    useEffect,
    ReactElement,
    createContext,
    Dispatch,
    SetStateAction,
} from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import useWebSocket from 'react-use-websocket';
import ManageLiquidityModal from 'components/manage-liquidity-modal';
import config from 'config';
import {
    UniswapPair,
    EthGasPrices,
    MarketStats,
} from '@sommelier/shared-types';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LandingContainer from 'containers/landing-container';
import MarketContainer from 'containers/market-container';
import PairContainer from 'containers/pair-container';
import PositionContainer from 'containers/position-container';
import ConnectWalletModal from 'components/connect-wallet-modal';
import { PageError, ModalError } from 'components/page-error';

import useWallet from 'hooks/use-wallet';
import usePrefetch from 'hooks/use-prefetch';

import initialData from 'constants/initialData.json';
import { UniswapApiFetcher as Uniswap } from 'services/api';
import { calculatePairRankings } from 'services/calculate-stats';

import { AllPairsState, TopPairsState } from 'types/states';
export type PendingTx = {
    approval: Array<string>;
    confirm: Array<string>;
};
type PendingTxContext = {
    pendingTx: PendingTx;
    setPendingTx: Dispatch<SetStateAction<PendingTx>>;
};

const defaultPendingContext = {
    pendingTx: {
        approval: [],
        confirm: [],
    },
};
export const PendingTxContext = createContext<Partial<PendingTxContext>>(
    defaultPendingContext
);

function App(): ReactElement {
    // ------------------ Initial Mount - API calls for first render ------------------

    const [allPairs, setAllPairs] = useState<AllPairsState>({
        isLoading: true,
        pairs: null,
        lookups: null,
        byLiquidity: null,
    });
    const [currentError, setError] = useState<string | null>(null);
    const [gasPrices, setGasPrices] = useState<EthGasPrices | null>(null);
    const [showConnectWallet, setShowConnectWallet] = useState(false);
    const { wallet, error, ...restWalletProps } = useWallet();
    const [currentPairId, setCurrentPairId] = useState<string | null>(null);

    // subscribe to the hook, will propogate to the nearest boundary
    const [pendingTx, setPendingTx] = useState<PendingTx>({
        approval: [],
        confirm: [],
    });
    const queryClient = new QueryClient();
    useErrorHandler(error);
    useEffect(() => {
        document.body.classList.add('dark');
    }, []);
    useEffect(() => {
        const fetchAllPairs = async () => {
            // Fetch all pairs
            const { data: pairsRaw, error } = await Uniswap.getTopPairs();

            if (error) {
                // we could not list pairs
                console.warn(`Could not fetch top pairs: ${error}`);
                (window as any).error = error;
                setError(error);
                return;
            }

            if (pairsRaw) {
                const calculated = calculatePairRankings(pairsRaw);

                setAllPairs({
                    isLoading: false,
                    pairs: calculated.pairs.map((p) => new UniswapPair(p)),
                    lookups: calculated.pairLookups,
                    byLiquidity: calculated.byLiquidity,
                });
            }
        };

        void fetchAllPairs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // TODO: are we using this??
    const { sendJsonMessage, lastJsonMessage } = useWebSocket(config.wsApi);

    // Handle websocket message
    // Ignore if we have an error
    useEffect(() => {
        if (!lastJsonMessage) return;

        const { topic } = lastJsonMessage;

        if (!topic) return;

        if (topic.startsWith('ethGas:getGasPrices')) {
            const { data: gasPrices }: { data: EthGasPrices } = lastJsonMessage;
            setGasPrices(gasPrices);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lastJsonMessage]);

    //    Subscribe to gas prices on first render
    useEffect(() => {
        sendJsonMessage({ op: 'subscribe', topics: ['ethGas:getGasPrices'] });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <ErrorBoundary
            fallbackRender={({ error }) => <PageError errorMsg={error} />}
        >
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
                    <div className={classNames('app', 'dark')} id='app-wrap'>
                        <PendingTxContext.Provider
                            value={{ pendingTx, setPendingTx }}
                        >
                            <div className='app-body' id='app-body'>
                                {currentError ? (
                                    <PageError errorMsg={currentError} />
                                ) : (
                                    <>
                                        <ErrorBoundary
                                            FallbackComponent={ModalError}
                                        >
                                            <ConnectWalletModal
                                                show={showConnectWallet}
                                                setShow={setShowConnectWallet}
                                                wallet={wallet}
                                                error={error}
                                                {...restWalletProps}
                                            />
                                        </ErrorBoundary>
                                        <ErrorBoundary
                                            fallbackRender={({ error }) => (
                                                <PageError errorMsg={error} />
                                            )}
                                        >
                                            <Switch>
                                                <Route path='/'>
                                                    <LandingContainer
                                                        allPairs={allPairs}
                                                        gasPrices={gasPrices}
                                                        wallet={wallet}
                                                        setShowConnectWallet={
                                                            setShowConnectWallet
                                                        }
                                                        currentPairId={
                                                            currentPairId
                                                        }
                                                    />
                                                </Route>
                                            </Switch>
                                        </ErrorBoundary>
                                    </>
                                )}
                            </div>
                        </PendingTxContext.Provider>
                    </div>
                </Router>
            </QueryClientProvider>
        </ErrorBoundary>
    );
}

export default App;
