import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-widgets/dist/css/react-widgets.css';
import 'styles/app.scss';

import { useState, useEffect, ReactElement } from 'react';

import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { Container } from 'react-bootstrap';

import LandingContainer from 'containers/landing-container';
import MarketContainer from 'containers/market-container';
import PairContainer from 'containers/pair-container';
// import PositionContainer from 'containers/position-container';
import SideMenu from 'components/side-menu';
import ConnectWalletModal from 'components/connect-wallet-modal';

import useWallet from 'hooks/use-wallet';
import usePrefetch from 'hooks/use-prefetch';

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
    const [topPairs, setTopPairs] = useState<TopPairsState | null>(null);
    const [currentError, setError] = useState<string | null>(null);
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
            ] = await Promise.all([
                Uniswap.getWeeklyTopPerformingPairs(),
                Uniswap.getDailyTopPerformingPairs(),
            ]);

            const error = topWeeklyPairsError ?? topDailyPairsError;

            if (error) {
                // we could not get our market data
                console.warn(`Could not fetch market data: ${error}`);
                setError(error);
                return;
            }

            // if (marketData) {
            //     setMarketData(marketData);
            // }

            if (topWeeklyPairs && topDailyPairs) {
                setTopPairs({ daily: topDailyPairs, weekly: topWeeklyPairs });

                // Prefetch first ten daily and weekly pairs
                const { list: pairsToFetch } = [
                    ...topDailyPairs.slice(0, 10),
                    ...topWeeklyPairs.slice(0, 10),
                ].reduce(
                    (
                        acc: {
                            list: MarketStats[];
                            lookup: { [pairId: string]: boolean };
                        },
                        pair
                    ) => {
                        if (!acc.lookup[pair.id]) {
                            acc.list.push(pair);
                        }
                        return acc;
                    },
                    { list: [], lookup: {} }
                );

                setPairsToFetch(pairsToFetch);
            }
        };

        void fetchAllPairs();
        void fetchTopPairs();
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
                {currentError ? (
                    <Container>
                        <h2>Oops, the grapes went bad.</h2>
                        <p>Error: {currentError}</p>

                        <h6>Refresh the page to try again.</h6>
                    </Container>
                ) : (
                    <div className='app-body' id='app-body'>
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
                                <MarketContainer />
                            </Route>
                            <Route path='/pair'>
                                <PairContainer
                                    allPairs={allPairs}
                                    prefetchedPairs={prefetchedPairs}
                                />
                            </Route>
                            <Route path='/'>
                                <LandingContainer topPairs={topPairs} />
                            </Route>
                        </Switch>
                    </div>
                )}
            </div>
        </Router>
    );
}

export default App;
