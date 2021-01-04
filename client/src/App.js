import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-widgets/dist/css/react-widgets.css';
import 'styles/app.scss';

import { useState, useEffect } from 'react';

import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { Container } from 'react-bootstrap';

import AppContext from 'util/app-context';
import PairContainer from 'containers/pair-container';

import { UniswapApiFetcher as Uniswap } from 'services/api';
import { calculatePairRankings } from 'services/calculate-lp-stats';

import initialData from 'constants/initialData.json';


function App() {
    // ------------------ Initial Mount - API calls for first render ------------------

    const [allPairs, setAllPairs] = useState({ isLoading: true, pairs: initialData.allPairs });

    useEffect(() => {
        const fetchAllPairs = async () => {
            // Fetch all pairs
            const pairsRaw = await Uniswap.getTopPairs();
            const calculated = calculatePairRankings(pairsRaw);
            setAllPairs({ isLoading: false, pairs: calculated.pairs, lookups: calculated.pairLookups });
        }
        fetchAllPairs();
    }, []);


    if (allPairs.isLoading) {
        return (
            <Container className="loading-container">
                <div className='wine-bounce'>🍷</div>
            </Container>
        );
    }

    return (
        <AppContext.Provider value={{ allPairs }}>
            <Router>
                <div className="app">
                    <Switch>
                        <Route path='/pair/:id'>
                            <PairContainer />
                        </Route>
                        <Route path='/'>
                            <div>Hello World</div>
                        </Route>
                    </Switch>
                </div >
            </Router>
        </AppContext.Provider >
    );
}

export default App;
