import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-widgets/dist/css/react-widgets.css';
import 'styles/app.scss';

import { useState, useEffect, ReactElement } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import useWebSocket from 'react-use-websocket';

import config from 'config';
import { EthGasPrices } from '@sommelier/shared-types';

import LandingContainer from 'containers/landing-container';
import MarketContainer from 'containers/market-container';
import PairContainer from 'containers/pair-container';
import SearchContainer from 'containers/search-container';
// import PositionContainer from 'containers/position-container';
import SideMenu from 'components/side-menu';
import ConnectWalletModal from 'components/connect-wallet-modal';
import PageError from 'components/page-error';

import useWallet from 'hooks/use-wallet';
import usePrefetch from 'hooks/use-prefetch';

import initialData from 'constants/initialData.json';
import { UniswapApiFetcher as Uniswap } from 'services/api';
import { calculatePairRankings } from 'services/calculate-stats';

import { MarketStats } from '@sommelier/shared-types';
import { AllPairsState, TopPairsState } from 'types/states';

function App(): ReactElement {
    // ------------------ Initial Mount - API calls for first render ------------------

    const [allPairs, setAllPairs] = useState<AllPairsState>({
        isLoading: true,
        pairs: null,
        lookups: null,
        byLiquidity: null,
    });
    const [marketData, setMarketData] = useState<MarketStats[] | null>(null);
    const [topPairs, setTopPairs] = useState<TopPairsState | null>(null);
    const [currentError, setError] = useState<string | null>(null);
    const [gasPrices, setGasPrices] = useState<EthGasPrices | null>(null);
    const [showConnectWallet, setShowConnectWallet] = useState(false);
    const useWalletProps = useWallet();
    const [prefetchedPairs, setPairsToFetch] = usePrefetch(null);

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
                    pairs: calculated.pairs,
                    lookups: calculated.pairLookups,
                    byLiquidity: calculated.byLiquidity,
                });
            }
        };

        const fetchTopPairs = async () => {
            // Fetch all pairs
            const [
                { data: topWeeklyPairs, error: topWeeklyPairsError },
                { data: topDailyPairs, error: topDailyPairsError },
                { data: wethDaiPair, error: wethDaiPairError },
            ] = await Promise.all([
                Uniswap.getWeeklyTopPerformingPairs(),
                Uniswap.getDailyTopPerformingPairs(),
                Uniswap.getPairOverview(initialData.pairId),
            ]);

            const error =
                topWeeklyPairsError ?? topDailyPairsError ?? wethDaiPairError;

            if (error) {
                // we could not get our market data
                console.warn(`Could not fetch market data: ${error}`);
                setError(error);
                return;
            }

            // if (marketData) {
            //     setMarketData(marketData);
            // }

            if (topWeeklyPairs && topDailyPairs && wethDaiPair) {
                setTopPairs({ daily: topDailyPairs, weekly: topWeeklyPairs });

                // Prefetch first ten daily and weekly pairs
                const { list: pairsToFetch } = [
                    ...topDailyPairs.slice(0, 10),
                    ...topWeeklyPairs.slice(0, 10),
                    wethDaiPair,
                ].reduce(
                    (
                        acc: {
                            list: MarketStats[];
                            lookup: { [pairId: string]: boolean };
                        },
                        pair
                    ) => {
                        if (!acc.lookup[pair.id]) {
                            // TODO: Fix this typing. We don't need a UniswapPair, or MarketStats
                            // All we need is an objefct with an ID
                            acc.list.push((pair as any) as MarketStats);
                        }
                        return acc;
                    },
                    { list: [], lookup: {} }
                );

                setPairsToFetch(pairsToFetch);
            }
        };

        const fetchMarketData = async () => {
            // Fetch all pairs
            const [
                { data: marketData, error: marketDataError },
                // { data: topPairs, error: topPairsError }
            ] = await Promise.all([
                Uniswap.getMarketData(),
                // Uniswap.getDailyTopPerformingPairs()
            ]);

            const error = marketDataError;
            // const error = marketDataError ?? topPairsError;

            if (error) {
                // we could not get our market data
                console.warn(`Could not fetch market data: ${error}`);
                setError(error);
                return;
            }

            if (marketData) {
                setMarketData(marketData);
            }

            if (topPairs) {
                setTopPairs(topPairs);
            }
        };

        void fetchAllPairs();
        void fetchTopPairs();
        void fetchMarketData();
    }, []);

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
        <Router>
            <div className='app' id='app-wrap'>
                <div className='side-menu-wrapper'>
                    <SideMenu
                        setShowConnectWallet={setShowConnectWallet}
                        wallet={useWalletProps.wallet}
                    />
                </div>
                <div className='app-body' id='app-body'>
                    {currentError ? (
                        <PageError errorMsg={currentError} />
                    ) : (
                        <>
                            <ConnectWalletModal
                                show={showConnectWallet}
                                setShow={setShowConnectWallet}
                                {...useWalletProps}
                            />
                            <Switch>
                                {/* <Route path='/positions'>
                                    <PositionContainer wallet={wallet} />
                                </Route> */}
                                <Route path='/market'>
                                    <MarketContainer marketData={marketData} />
                                </Route>
                                <Route path='/pair'>
                                    <PairContainer
                                        allPairs={allPairs}
                                        prefetchedPairs={prefetchedPairs}
                                    />
                                </Route>
                                <Route path='/search'>
                                    <SearchContainer allPairs={allPairs} />
                                </Route>
                                <Route path='/'>
                                    <LandingContainer 
                                        topPairs={topPairs} 
                                        wallet={useWalletProps.wallet} 
                                        gasPrices={gasPrices}
                                        setShowConnectWallet={setShowConnectWallet}
                                    />
                                </Route>
                            </Switch>
                        </>
                    )}
                </div>
            </div>
        </Router>
    );
}

export default App;
