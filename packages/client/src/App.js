import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-widgets/dist/css/react-widgets.css';
import 'styles/app.scss';

import { useState, useEffect } from 'react';

import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { Container } from 'react-bootstrap';

import OverviewContainer from 'containers/overview-container';
import PairContainer from 'containers/pair-container';
import SideMenu from 'components/side-menu';

import { UniswapApiFetcher as Uniswap } from 'services/api';
import { calculatePairRankings } from 'services/calculate-stats';

import initialData from 'constants/initialData.json';

function App() {
    // ------------------ Initial Mount - API calls for first render ------------------

    const [allPairs, setAllPairs] = useState({
        isLoading: true,
        pairs: initialData.allPairs,
    });
    const [currentError, setError] = useState(null);
    const [showConnectWallet, setShowConnectWallet] = useState(false);

    useEffect(() => {
        const fetchAllPairs = async () => {
            // Fetch all pairs
            const { data: pairsRaw, errors } = await Uniswap.getTopPairs();

            if (errors) {
                // we could not list pairs
                console.warn(`Could not fetch top pairs: ${errors}`);
                setError(errors[0]);
                return;
            }

            const calculated = calculatePairRankings(pairsRaw);

            setAllPairs({
                isLoading: false,
                pairs: calculated.pairs,
                lookups: calculated.pairLookups,
                byLiquidity: calculated.byLiquidity,
            });
        };
        fetchAllPairs();
    }, []);

    if (currentError) {
        return (
            <Container>
                <h2>Oops, the grapes went bad.</h2>
                <p>Error: {currentError.message}</p>

                <h6>Refresh the page to try again.</h6>
            </Container>
        );
    }

    if (allPairs.isLoading) {
        return (
            <Container className='loading-container'>
                <div className='wine-bounce'>🍷</div>
            </Container>
        );
    }

    return (
        <Router>
            <div className='app'>
                <div className='side-menu'>
                    <SideMenu />
                </div>
                <div className='app-body'>
                    <Switch>
                        <Route path='/pair'>
                            <PairContainer allPairs={allPairs} />
                        </Route>
                        <Route path='/'>
                            <OverviewContainer allPairs={allPairs} />
                        </Route>
                    </Switch>
                </div>
            </div>
        </Router>
    );
}

export default App;
