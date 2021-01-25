import { useEffect, useState, useRef, useMemo } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import useWebSocket from 'react-use-websocket';
import PropTypes from 'prop-types';
import { Pair } from 'constants/prop-types';
import Mixpanel from 'util/mixpanel';

import PairSelector from 'components/pair-selector';
import LPInput from 'components/lp-input';
import LPStatsWidget from 'components/lp-stats-widget';
import LPStatsChart from 'components/lp-stats-chart';
import LatestTradesSidebar from 'components/latest-trades-sidebar';
import TotalPoolStats from 'components/total-pool-stats';
import TelegramCTA from 'components/telegram-cta';

import initialData from 'constants/initialData.json';
import { UniswapApiFetcher as Uniswap } from 'services/api';
import { calculateLPStats } from 'services/calculate-stats';

import config from 'config';

const mixpanel = new Mixpanel();

function PairContainer({ allPairs }) {
    // ------------------ Loading State - handles interstitial UI ------------------

    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [currentError, setError] = useState(null);

    // ------------------ Shared State ------------------

    const [pairId, setPairId] = useState(initialData.pairId);

    // Keep track of previous pair ID so we can unsubscribe
    const prevPairIdRef = useRef();
    useEffect(() => {
        prevPairIdRef.current = pairId;
    });
    const prevPairId = prevPairIdRef.current;

    const location = useLocation();
    useEffect(() => {
        const query = new URLSearchParams(location.search);
        const pairId = query.get('id');
        if (pairId) return setPairId(pairId);

        // lookup by symbol
        const symbol = query.get('symbol');
        const pairForSymbol = allPairs.pairs.find((pair) => {
            const pairSymbol = `${pair.token0.symbol}/${pair.token1.symbol}`;
            return symbol === pairSymbol;
        });

        if (pairForSymbol) setPairId(pairForSymbol.id);
    }, [location]);

    // ------------------ LP State - handles lp-specific info ------------------

    const [lpInfo, setLPInfo] = useState({});
    const [lpDate, setLPDate] = useState(new Date(initialData.lpDate));
    const [lpShare, setLPShare] = useState(initialData.lpShare);

    // Keep track of previous lp stats to prevent entire loading UI from coming up on change
    const lpStats = useMemo(
        () =>
            !isInitialLoad &&
            !currentError &&
            calculateLPStats({ ...lpInfo, lpDate, lpShare }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [lpInfo, lpDate, lpShare, isInitialLoad]
    );

    useEffect(() => {
        const fetchPairData = async () => {
            if (!isLoading) setIsLoading(true);
            if (currentError) return;

            // Fetch pair overview when pair ID changes
            // Default to createdAt date if LP date not set
            const { data: newPair, error } = await Uniswap.getPairOverview(
                pairId
            );

            if (error) {
                // we could not get data for this new pair
                console.warn(
                    `Could not fetch pair data for ${pairId}: ${error.message}`
                );
                setError(error);
                return;
            }

            const pairCreatedAt = new Date(newPair.createdAtTimestamp * 1000);

            // Get historical data for pair from start date until now
            const {
                data: historicalDailyData,
                error: historicalErrors,
            } = await Uniswap.getHistoricalDailyData(pairId, pairCreatedAt);

            if (historicalErrors) {
                // we could not get data for this new pair
                console.warn(
                    `Could not fetch historical data for ${pairId}: ${historicalErrors.message}`
                );
                setError(error);
                return;
            }

            setLPInfo((prevLpInfo) => ({
                ...prevLpInfo,
                pairData: newPair,
                historicalData: historicalDailyData,
            }));

            mixpanel.track('pair_query', {
                pairId,
                token0: newPair.token0.symbol,
                token1: newPair.token1.symbol,
            });

            setIsLoading(false);
            if (isInitialLoad) setIsInitialLoad(false);
        };

        fetchPairData();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pairId]);

    const dailyDataAtLPDate = useMemo(() => {
        if (currentError) return;

        if (!lpInfo.historicalData || lpInfo.historicalData.length === 0)
            return {};

        // Find daily data that matches LP date
        for (const dailyData of lpInfo.historicalData) {
            const currentDate = new Date(dailyData.date * 1000);
            if (currentDate.getTime() === lpDate.getTime()) {
                return dailyData;
            }
        }

        if (lpInfo.historicalData.length === 0) return;
        const firstDay = new Date(lpInfo.historicalData[0].date * 1000);
        console.warn(
            `Could not find LP date in historical data: ${lpDate}. Setting to first day, which is ${firstDay}.`
        );
        setLPDate(firstDay);
        return lpInfo.historicalData[0];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lpInfo, lpDate]);

    // ------------------ Websocket State - handles subscriptions ------------------

    const [latestBlock, setLatestBlock] = useState(null);
    const { sendJsonMessage, lastJsonMessage } = useWebSocket(config.wsApi);

    // Handle websocket message
    // Ignore if we have an error
    useEffect(() => {
        if (!lastJsonMessage || currentError) return;

        const { topic } = lastJsonMessage;

        let blockNumber;
        if (topic.startsWith('uniswap:getPairOverview') && !isLoading) {
            const { data: pairMsg } = lastJsonMessage;

            if (pairMsg.id === pairId) {
                setLPInfo({ ...lpInfo, pairData: pairMsg });
            } else {
                console.warn(
                    `Received pair update over websocket for non-active pair: ${pairMsg.token0.symbol}/${pairMsg.token1.symbol}`
                );
            }
        } else if (topic === 'infura:newHeads') {
            const {
                data: { number: blockNumberHex },
            } = lastJsonMessage;
            blockNumber = parseInt(blockNumberHex.slice(2), 16);
            setLatestBlock(blockNumber);
        } else if (topic === 'infura:newBlockHeaders') {
            const {
                data: { number: blockNumberStr },
            } = lastJsonMessage;
            blockNumber = parseInt(blockNumberStr, 10);
            setLatestBlock(blockNumber);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lastJsonMessage]);

    // Subscribe to new blocks on first render
    // Using both b/c infura API is inconsistent
    useEffect(() => {
        sendJsonMessage({ op: 'subscribe', topics: ['infura:newHeads'] });
        sendJsonMessage({
            op: 'subscribe',
            topics: ['infura:newBlockHeaders'],
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Subscribe to updates on pair overview when pair changes
    useEffect(() => {
        if (currentError) return;

        sendJsonMessage({
            op: 'unsubscribe',
            topics: [`uniswap:getPairOverview:${prevPairId}`],
        });
        sendJsonMessage({
            op: 'subscribe',
            topics: [`uniswap:getPairOverview:${pairId}`],
            interval: 'newBlocks',
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pairId]);

    // ------------------ Market Data State - fetches non-LP specific market data ------------------

    const [latestSwaps, setLatestSwaps] = useState({
        swaps: null,
        mintsAndBurns: null,
    });

    useEffect(() => {
        if (!pairId || currentError) return;

        const getLatestSwaps = async () => {
            // Fetch latest block when pair ID changes
            // Default to createdAt date if LP date not set
            const [
                { data: latestSwaps, error: swapsErrors },
                { data: mintsAndBurns, error: mintBurnErrors },
            ] = await Promise.all([
                Uniswap.getLatestSwaps(pairId),
                Uniswap.getMintsAndBurns(pairId),
            ]);

            const error = swapsErrors ?? mintBurnErrors;

            if (error) {
                // we could not get data for this new pair
                console.warn(
                    `Could not fetch trades data for ${pairId}: ${error.messages}`
                );
                setError(error);
                return;
            }

            setLatestSwaps({ swaps: latestSwaps, mintsAndBurns });
        };

        const refreshPairData = async () => {
            const { data: newPairData } = await Uniswap.getPairOverview(pairId);

            setLPInfo((prevLpInfo) => ({
                ...prevLpInfo,
                pairData: newPairData,
            }));
        };

        getLatestSwaps();
        refreshPairData();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pairId, latestBlock]);

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

    // If no lp stats, we haven't completed our first data fetch yet
    if (!lpStats || Object.keys(lpStats).length === 0) {
        return (
            <Container className='loading-container'>
                <div className='wine-bounce'>🍷</div>
            </Container>
        );
    }

    return (
        <Container fluid>
            <h4>Impermanent Loss Calculator</h4>
            <TelegramCTA />
            <Row>
                <Col lg={10}>
                    <Row className='top-stats-row'>
                        <Col className='stats-row-col' lg={4}>
                            <PairSelector
                                pairs={allPairs.pairs}
                                currentPairId={pairId}
                                setPair={setPairId}
                                isLoading={isLoading}
                            />
                        </Col>
                        <Col className='stats-row-col' lg={8}>
                            <TotalPoolStats
                                allPairs={allPairs}
                                lpInfo={lpInfo}
                                lpStats={lpStats}
                            />
                        </Col>
                    </Row>
                    <Row noGutters>
                        <Col lg={3} className='trades-sidebar'>
                            <LatestTradesSidebar
                                latestBlock={latestBlock}
                                latestSwaps={latestSwaps}
                            />
                        </Col>
                        <Col lg={9}>
                            {/* <FadeOnChange><LPStatsChart lpStats={lpStats} /></FadeOnChange> */}
                            <LPStatsChart lpStats={lpStats} />
                        </Col>
                    </Row>
                </Col>
                <Col lg={2}>
                    <LPInput
                        {...lpInfo}
                        lpDate={lpDate}
                        lpShare={lpShare}
                        setLPDate={setLPDate}
                        setLPShare={setLPShare}
                        dailyDataAtLPDate={dailyDataAtLPDate}
                    />
                    <LPStatsWidget
                        lpStats={lpStats}
                        pairData={lpInfo.pairData}
                    />
                </Col>
            </Row>
            {/* <Row>
                <RealtimeStatusBar latestBlock={latestBlock} />
            </Row> */}
        </Container>
    );
}

PairContainer.propTypes = {
    allPairs: PropTypes.shape({ pairs: PropTypes.arrayOf(Pair) })
};

export default PairContainer;
