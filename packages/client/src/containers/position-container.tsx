import { useEffect, useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import PropTypes from 'prop-types';
import mixpanel from 'util/mixpanel';
import PositionsTable from 'components/positions-table';
import { ErrorBoundary, useErrorHandler } from 'react-error-boundary';
import { LPPositionData, IToken } from '@sommelier/shared-types';
import { Wallet } from 'types/states';
import { debug } from 'util/debug';

// import PositionSelector from 'components/position-selector';
import LPStatsChart from 'components/lp-stats-highchart';
import USDValueWidget from 'components/usd-value-widget';
import { resolveLogo } from 'components/token-with-logo';
import { PageError, ComponentError } from 'components/page-error';

import { UniswapApiFetcher as Uniswap } from 'services/api';

function PositionContainer({ wallet }: { wallet: Wallet }): JSX.Element {
    // ------------------ Loading State - handles interstitial UI ------------------

    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [currentError, setError] = useState<string | null>(null);
    useErrorHandler(currentError);
    const [
        positionData,
        setPositionData,
    ] = useState<LPPositionData<string> | null>(null);

    // ------------------ Shared State ------------------

    // Initialize pair to be first position in wallet
    const [pairId, setPairId] = useState(
        positionData?.positions ? Object.keys(positionData.positions)[0] : null
    );

    // const currentPosition = positions[pairId];
    debug.positionData = positionData;
    debug.pairId = pairId;
    const currentStats = pairId
        ? positionData?.stats?.[pairId]?.aggregatedStats
        : null;
    // const fullPairs = positionData.positions ? Object.values(positionData.positions).map((positionSnapshots) => positionSnapshots[0].pair) : [];
    const pair =
        positionData?.positions && pairId
            ? positionData?.positions[pairId]?.[0].pair
            : null;

    // ------------------ Position State - fetches LP-specific position data ------------------

    useEffect(() => {
        mixpanel.track('pageview:position', {});
    }, []);

    useEffect(() => {
        if (
            positionData?.positions &&
            (!pairId || !positionData.positions[pairId])
        ) {
            // get from position
            setPairId(Object.keys(positionData.positions)[0]);
        }
    }, [positionData, pairId]);

    useEffect(() => {
        const fetchPositionsForWallet = async () => {
            if (!isLoading) setIsLoading(true);
            if (currentError || !wallet.account) return;

            const {
                data: positionData,
                error,
            } = await Uniswap.getPositionStats(wallet.account);

            if (error) {
                // we could not list pairs
                console.warn(`Could not get position stats: ${error}`);
                setError(error);
                return;
            }

            if (positionData) {
                setPositionData(positionData);
            }

            setIsLoading(false);
            if (isInitialLoad) setIsInitialLoad(false);

            try {
              mixpanel.track('positions:query', {
                  distinct_id: wallet.account,
                  address: wallet.account
              });
            } catch (e) {
                console.error(`Metrics error on positions:query.`);
            }
        };

        if (wallet.account) {
            void fetchPositionsForWallet();
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wallet.account]);

    // ------------------ Render code ------------------

    // If error, display an error page
    if (currentError) {
        return <PageError errorMsg={currentError} />;
    }

    if (!wallet?.account) {
        return (
            <Container className='error-container'>
                <h3>Connect your wallet to continue.</h3>
            </Container>
        );
    }

    if (!currentStats || !pairId || !pair || !positionData) {
        return (
            <Container className='loading-container'>
                <div className='wine-pulse'>🍷</div>
            </Container>
        );
    }

    const token0 = pair.token0 as IToken;
    const token1 = pair.token1 as IToken;

    return (
        <ErrorBoundary FallbackComponent={ComponentError}>
            <Container fluid>
                <h4>Your LP Positions on Uniswap</h4>
                <hr />
                <PositionsTable
                    positionData={positionData}
                    pairId={pairId}
                    setPairId={setPairId}
                    // eslint-disable-next-line @typescript-eslint/no-empty-function
                    handleAddLiquidity={() => {}}
                />
                <hr />
                <Row className='top-stats-row'>
                    <Col lg={4} className='pair-text-large'>
                        <span>
                            {resolveLogo(token0.id)}{' '}
                            {`${token0.symbol}/${token1.symbol}`}{' '}
                            {resolveLogo(token1.id)}
                        </span>
                    </Col>
                    <Col lg={8}>
                        <div className='pool-stats-container'>
                            <USDValueWidget
                                title={'Fees Earned'}
                                value={
                                    positionData?.stats[pairId]?.aggregatedStats
                                        .totalFees
                                }
                            />
                            <USDValueWidget
                                title={'Impermanent Loss'}
                                value={
                                    positionData?.stats[pairId]?.aggregatedStats
                                        .impermanentLoss
                                }
                            />
                            <USDValueWidget
                                title={'Total Return'}
                                value={
                                    positionData?.stats['123']?.aggregatedStats
                                        .totalReturn
                                }
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
        </ErrorBoundary>
    );
}

PositionContainer.propTypes = {
    wallet: PropTypes.shape({
        account: PropTypes.string,
        provider: PropTypes.string,
    }).isRequired,
};

export default PositionContainer;
