import { useEffect, useState, useRef } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import PropTypes from 'prop-types';
import Mixpanel from 'util/mixpanel';

import PositionSelector from 'components/position-selector';
import LPStatsChart from 'components/lp-stats-rechart';
import USDValueWidget from 'components/usd-value-widget';
import TelegramCTA from 'components/telegram-cta';

import { UniswapApiFetcher as Uniswap } from 'services/api';

const mixpanel = new Mixpanel();

function PositionContainer({ wallet }) {
    // ------------------ Loading State - handles interstitial UI ------------------

    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [currentError, setError] = useState(null);
    const [positionData, setPositionData] = useState({ positions: null, stats: null });

    // ------------------ Shared State ------------------

    // Initialize pair to be first position in wallet
    // TODO sort position by volume
    const [pairId, setPairId] = useState(positionData?.positions ? Object.keys(positionData.positions)[0] : null);

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
            <h4>LP Positions on Uniswap</h4>
            <TelegramCTA />
            <Row className='top-stats-row'>
                <Col lg={3}>
                    <PositionSelector
                        positionData={positionData}
                        pairs={fullPairs}
                        currentPairId={pairId}
                        setPair={setPairId}
                        isLoading={isLoading}
                    />
                </Col>
                <Col lg={8}>
                    <div className='pool-stats-container'>
                        <USDValueWidget
                            title={'Fees Earned'}
                            value={positionData.stats[pairId].aggregatedStats.totalFees}
                        />
                        <USDValueWidget
                            title={'Impermanent Loss'}
                            value={positionData.stats[pairId].aggregatedStats.impermanentLoss}
                        />
                        <USDValueWidget
                            title={'Total Return'}
                            value={positionData.stats[pairId].aggregatedStats.totalReturn}
                        />
                    </div>
                </Col>
            </Row>
            <Row noGutters>
                <Col>
                    {/* <FadeOnChange><LPStatsChart lpStats={lpStats} /></FadeOnChange> */}
                    <LPStatsChart lpStats={currentStats} />
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
