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

    useEffect(() => {
        const fetchAllPairs = async () => {
            // Fetch all pairs
            const pairsRaw = await Uniswap.getTopPairs();
            const calculated = calculatePairRankings(pairsRaw);
            window.calculated = calculated;

            setAllPairs({
                isLoading: false,
                pairs: calculated.pairs,
                lookups: calculated.pairLookups,
                byLiquidity: calculated.byLiquidity,
            });
        };
        fetchAllPairs();
    }, []);

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
