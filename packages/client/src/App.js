import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-widgets/dist/css/react-widgets.css';
import 'styles/app.scss';

import { useState, useEffect } from 'react';

import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { Container } from 'react-bootstrap';

import Cookies from 'universal-cookie';

import OverviewContainer from 'containers/overview-container';
import PairContainer from 'containers/pair-container';
import PositionContainer from 'containers/position-container';
import SideMenu from 'components/side-menu';
import ConnectWalletModal from 'components/connect-wallet-modal';

import { UniswapApiFetcher as Uniswap } from 'services/api';
import { calculatePairRankings } from 'services/calculate-stats';

import initialData from 'constants/initialData.json';

const cookies = new Cookies();

function App() {
    // ------------------ Initial Mount - API calls for first render ------------------

    // Try to read wallet from cookies
    const walletFromCookie = cookies.get('current_wallet');

    let initialWalletState;
    if (walletFromCookie && walletFromCookie.account && walletFromCookie.provider) {
        initialWalletState = walletFromCookie;
    } else {
        if (walletFromCookie) {
            console.warn(`Tried to load wallet from cookie, but it was not correctly formed.`);
        }

        initialWalletState = { account: null, provider: null };
    }

    const [allPairs, setAllPairs] = useState({
        isLoading: true,
        pairs: initialData.allPairs,
    });
    const [currentError, setError] = useState(null);
    const [showConnectWallet, setShowConnectWallet] = useState(false);
    const [wallet, setWallet] = useState(initialWalletState);

    useEffect(() => {
        const fetchAllPairs = async () => {
            // Fetch all pairs
            const { data: pairsRaw, error } = await Uniswap.getTopPairs();

            if (error) {
                // we could not list pairs
                console.warn(`Could not fetch top pairs: ${error.message}`);
                window.error = error;
                setError(error);
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
            <div className='app' id='app-wrap'>
                <div className='side-menu-wrapper'>
                    <SideMenu
                        setShowConnectWallet={setShowConnectWallet}
                        wallet={wallet}
                    />
                </div>
                <div className='app-body' id='app-body'>
                    <ConnectWalletModal
                        show={showConnectWallet}
                        setShow={setShowConnectWallet}
                        wallet={wallet}
                        setWallet={setWallet}
                    />
                    <Switch>
                        <Route path='/positions'>
                            <PositionContainer wallet={wallet} />
                        </Route>
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
