import { useEffect, useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import PropTypes from 'prop-types';
import Mixpanel from 'util/mixpanel';

import { LPPositionData } from '@sommelier/shared-types';
import { Wallet, IError } from 'types/states';

// import PositionSelector from 'components/position-selector';
import LPStatsChart from 'components/lp-stats-chart';
import USDValueWidget from 'components/usd-value-widget';
import PositionsTable from 'components/positions-table';
import { resolveLogo } from 'components/token-with-logo';

import { UniswapApiFetcher as Uniswap } from 'services/api';

const mixpanel = new Mixpanel();

function PositionContainer({ wallet }: { wallet: Wallet }) {
    // ------------------ Loading State - handles interstitial UI ------------------

    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [currentError, setError] = useState<IError | null>(null);
    const [positionData, setPositionData] = useState<LPPositionData | null>(null);

    // ------------------ Shared State ------------------

    // Initialize pair to be first position in wallet
    const [pairId, setPairId] = useState(positionData?.positions ? Object.keys(positionData.positions)[0] : null);

    // const currentPosition = positions[pairId];
    (window as any).positionData = positionData;
    (window as any).pairId = pairId;
    const currentStats = pairId ? positionData?.stats?.[pairId]?.aggregatedStats : null;
    // const fullPairs = positionData.positions ? Object.values(positionData.positions).map((positionSnapshots) => positionSnapshots[0].pair) : [];
    const pair = positionData?.positions && pairId ? positionData?.positions[pairId]?.[0].pair : null;

    // ------------------ Position State - fetches LP-specific position data ------------------

    useEffect(() => {
        if (positionData?.positions && (!pairId || !positionData.positions[pairId])) {
            // get from position
            setPairId(Object.keys(positionData.positions)[0]);
        }

    }, [positionData, pairId])

    useEffect(() => {
        const fetchPositionsForWallet = async () => {
            if (!isLoading) setIsLoading(true);
            if (currentError) return;

            const { data: positionData, error } = await Uniswap.getPositionStats(wallet.account);

            console.log('Got new position data');

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
            <hr />
            <PositionsTable positionData={positionData} pairId={pairId} setPairId={setPairId} />
            <hr />
            <Row className='top-stats-row'>
                <Col lg={4} className='pair-text-large'>
                    <span>
                        {resolveLogo(pair.token0.id)}{' '}
                        {pair.token0.symbol}/{pair.token1.symbol}
                        {' '}{resolveLogo(pair.token1.id)}
                    </span>
                </Col>
                <Col lg={8}>
                    <div className='pool-stats-container'>
                        <USDValueWidget
                            title={'Fees Earned'}
                            value={positionData?.stats[pairId]?.aggregatedStats.totalFees}
                        />
                        <USDValueWidget
                            title={'Impermanent Loss'}
                            value={positionData?.stats[pairId]?.aggregatedStats.impermanentLoss}
                        />
                        <USDValueWidget
                            title={'Total Return'}
                            value={positionData?.stats[pairId]?.aggregatedStats.totalReturn}
                        />
                    </div>
                </Col>
            </Row>
            <Row noGutters>
                <Col lg={12}>
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
    }).isRequired
};

export default PositionContainer;
