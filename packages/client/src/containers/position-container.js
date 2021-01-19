import { useEffect, useState, useRef } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { PositionData, DailyData, HourlyData, LPStats } from 'constants/prop-types';
import Mixpanel from 'util/mixpanel';

import Header from 'components/header';
import PositionSelector from 'components/position-selector';
import LPInput from 'components/lp-input';
import LPStatsWidget from 'components/lp-stats-widget';
import LPStatsChart from 'components/lp-stats-rechart';
import LatestTradesSidebar from 'components/latest-trades-sidebar';
import TotalPoolStats from 'components/total-pool-stats';
import TelegramCTA from 'components/telegram-cta';

import { UniswapApiFetcher as Uniswap } from 'services/api';

const mixpanel = new Mixpanel();

function PositionContainer({ wallet, setWallet }) {
    // ------------------ Loading State - handles interstitial UI ------------------

    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [currentError, setError] = useState(null);
    const [positionData, setPositionData] = useState({ positions: null, stats: null });

    // ------------------ Shared State ------------------

    // Initialize pair to be first position in wallet
    // TODO sort position by volume
    const [pairId, setPairId] = useState(positionData?.positions ? Object.keys(positionData.positions)[0] : null);

    // Keep track of previous pair ID so we can unsubscribe
    const prevPairIdRef = useRef();
    useEffect(() => {
        prevPairIdRef.current = pairId;
    });
    const prevPairId = prevPairIdRef.current;

    // const currentPosition = positions[pairId];
    window.positionData = positionData;
    const currentStats = pairId ? positionData.stats?.[pairId].aggregatedStats : null;
    const fullPairs = positionData.positions ? Object.values(positionData.positions).map((positionSnapshots) => positionSnapshots[0].pair) : [];

    // ------------------ Position State - fetches LP-specific position data ------------------

    useEffect(() => {
        if (!pairId && positionData?.positions) {
            // get from position
            setPairId(Object.keys(positionData.positions)[0]);
        }

    }, [positionData, pairId])

    useEffect(() => {
        const fetchPositionsForWallet = async () => {
            if (!isLoading) setIsLoading(true);
            if (currentError) return;

            const { data: positionData, error } = await Uniswap.getPositionStats(wallet.account);

            if (error) {
                // we could not list pairs
                console.warn(`Could not get position stats: ${error.message}`);
                setError(error);
                return;
            }

            setPositionData(positionData);

            setIsLoading(false);
            if (isInitialLoad) setIsInitialLoad(false);

            mixpanel.track('positions_query', {
                address: wallet.account
            });
        }

        if (wallet.account) {
            fetchPositionsForWallet();
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wallet.account]);

    // ------------------ Render code ------------------

    // If error, display an error page
    if (currentError) {
        return (
            <Container>
                <h2>Oops, the grapes went bad.</h2>
                <p>Error: {currentError.message}</p>

                <h6>Refresh the page to try again.</h6>
            </Container>
        );
    }

    if (!wallet?.account) {
        return (
            <Container>
                <h2>Connect your wallet to continue.</h2>
            </Container>
        );
    }

    if (!currentStats) {
        return (
            <Container className='loading-container'>
                <div className='wine-bounce'>🍷</div>
            </Container>
        );
    }

    return (
        <Container fluid>
            <Header />
            <TelegramCTA />
            <Row noGutters>
                <Col lg={10}>
                    <Row className='top-stats-row'>
                        <Col lg={4}>
                            {/* <PositionSelector
                                pairs={fullPairs}
                                currentPairId={pairId}
                                setPair={setPairId}
                                isLoading={isLoading}
                            /> */}
                        </Col>
                        <Col lg={8}>
                            {/* <TotalPositionStats
                                allPairs={allPairs}
                                lpInfo={lpInfo}
                                lpStats={lpStats}
                            /> */}
                        </Col>
                    </Row>
                    <Row noGutters>
                        <Col lg={9}>
                            {/* <FadeOnChange><LPStatsChart lpStats={lpStats} /></FadeOnChange> */}
                            <LPStatsChart lpStats={currentStats} />
                        </Col>
                    </Row>
                </Col>
                <Col lg={2}>
                    {/* <LPSnapshotsTable /> */}
                    <LPStatsWidget
                        lpStats={currentStats}
                    />
                </Col>
            </Row>
        </Container>
    );
}

PositionContainer.propTypes = {
    wallet: PropTypes.shape({
        account: PropTypes.string,
        provider: PropTypes.string,
    }).isRequired,
    setWallet: PropTypes.func,
};

export default PositionContainer;
