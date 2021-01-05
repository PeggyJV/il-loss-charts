import { useContext, useEffect, useState, useRef, useMemo } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useLocation, useHistory } from 'react-router-dom';
import useWebSocket from 'react-use-websocket';
import Mixpanel from 'util/mixpanel';
import AppContext from 'util/app-context';

import Header from 'components/header';
import PairSelector from 'components/pair-selector';
import LPInput from 'components/lp-input';
import LPStatsWidget from 'components/lp-stats-widget';
import LPStatsChart from 'components/lp-stats-rechart';
import LatestTradesSidebar from 'components/latest-trades-sidebar';
import TotalPoolStats from 'components/total-pool-stats';
import TelegramCTA from 'components/telegram-cta';

import FadeOnChange from 'components/fade-on-change';

import initialData from 'constants/initialData.json';
import { UniswapApiFetcher as Uniswap } from 'services/api';
import { calculateLPStats, calculatePairRankings } from 'services/calculate-stats';

import config from 'config';

const mixpanel = new Mixpanel();

function PairContainer({ allPairs }) {
    // ------------------ Loading State - handles interstitial UI ------------------

    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // ------------------ Shared State ------------------

    const [pairId, setPairId] = useState(initialData.pairId);

    // Keep track of previous pair ID so we can unsubscribe
    const prevPairIdRef = useRef();
    useEffect(() => { prevPairIdRef.current = pairId; });
    const prevPairId = prevPairIdRef.current;

    const location = useLocation();
    useEffect(() => {
        const query = new URLSearchParams(location.search);
        const pairId = query.get('id');
        if (pairId) setPairId(pairId);
    }, [location]);

    // ------------------ LP State - handles lp-specific info ------------------

    const [lpInfo, setLPInfo] = useState({});
    const [lpDate, setLPDate] = useState(new Date(initialData.lpDate));
    const [lpShare, setLPShare] = useState(initialData.lpShare);

    // Keep track of previous lp stats to prevent entire loading UI from coming up on change
    const lpStats = useMemo(() => !isInitialLoad && calculateLPStats({ ...lpInfo, lpDate, lpShare }), [lpInfo, lpDate, lpShare]);

    useEffect(() => {
        const fetchPairData = async () => {
            if (!isLoading) setIsLoading(true);

            // Fetch pair overview when pair ID changes
            // Default to createdAt date if LP date not set
            const newPair = await Uniswap.getPairOverview(pairId);
            const pairCreatedAt = new Date(newPair.createdAtTimestamp * 1000);

            // Get historical data for pair from start date until now
            const historicalDailyData = await Uniswap.getHistoricalDailyData(pairId, pairCreatedAt);

            setLPInfo(prevLpInfo => ({
                ...prevLpInfo,
                pairData: newPair,
                historicalData: historicalDailyData,
            }));

            mixpanel.track('pair_query', { pairId, token0: newPair.token0.symbol, token1: newPair.token1.symbol });

            setIsLoading(false);
            if (isInitialLoad) setIsInitialLoad(false);
        }

        fetchPairData();
    }, [pairId]);

    const dailyDataAtLPDate = useMemo(() => {
        if (!lpInfo.historicalData || lpInfo.historicalData.length === 0) return {};

        // Find daily data that matches LP date
        for (let dailyData of lpInfo.historicalData) {
            const currentDate = new Date(dailyData.date * 1000);
            if (currentDate.getTime() === lpDate.getTime()) {
                return dailyData;
            }
        }

        console.warn(`Could not find LP date in historical data: ${lpDate}. Setting to first day.`);
        if (lpInfo.historicalData.length === 0) return;
        const firstDay = new Date(lpInfo.historicalData[0].date * 1000);
        setLPDate(firstDay);
        return lpInfo.historicalData[0];
    }, [lpInfo, lpDate]);

    // ------------------ Websocket State - handles subscriptions ------------------

    const [latestBlock, setLatestBlock] = useState(null);
    const {
        sendJsonMessage,
        lastJsonMessage,
    } = useWebSocket(config.wsApi);

    // Handle websocket message
    useEffect(() => {
        if (!lastJsonMessage) return;

        const { topic } = lastJsonMessage;

        let blockNumber;
        if (topic.startsWith('uniswap:getPairOverview') && !isLoading) {
            setLPInfo({ ...lpInfo, pairData: lastJsonMessage.data });
        } else if (topic === 'infura:newHeads') {
            const { data: { number: blockNumberHex } } = lastJsonMessage;
            blockNumber = parseInt(blockNumberHex.slice(2), 16);
            setLatestBlock(blockNumber);
        } else if (topic === 'infura:newBlockHeaders') {
            const { data: { number: blockNumberStr } } = lastJsonMessage;
            blockNumber = parseInt(blockNumberStr, 10);
            setLatestBlock(blockNumber);
        }

    }, [lastJsonMessage]);

    // Subscribe to new blocks on first render
    // Using both b/c infura API is inconsistent
    useEffect(() => {
        sendJsonMessage({ op: 'subscribe', topics: ['infura:newHeads'] })
        sendJsonMessage({ op: 'subscribe', topics: ['infura:newBlockHeaders'] })
    }, []);

    // Subscribe to updates on pair overview when pair changes
    useEffect(() => {
        sendJsonMessage({ op: 'unsubscribe', topics: [`uniswap:getPairOverview:${prevPairId}`] });
        sendJsonMessage({ op: 'subscribe', topics: [`uniswap:getPairOverview:${pairId}`], interval: 'newBlocks' });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pairId]);

    // ------------------ Market Data State - fetches non-LP specific market data ------------------

    const [latestSwaps, setLatestSwaps] = useState({ swaps: null, mintsAndBurns: null });

    useEffect(() => {
        const getLatestSwaps = async () => {
            // Fetch latest block when pair ID changes
            // Default to createdAt date if LP date not set
            const [latestSwaps, mintsAndBurns] = await Promise.all([
                Uniswap.getLatestSwaps(pairId),
                Uniswap.getMintsAndBurns(pairId)
            ]);
            setLatestSwaps({ swaps: latestSwaps, mintsAndBurns });
        }

        const refreshPairData = async () => {
            const newPairData = await Uniswap.getPairOverview(pairId);

            setLPInfo(prevLpInfo => ({
                ...prevLpInfo,
                pairData: newPairData,
            }));
        }

        getLatestSwaps();
        refreshPairData();
    }, [pairId, latestBlock]);

    // ------------------ Render code ------------------

    // If no lp stats, we haven't completed our first data fetch yet
    if (!lpStats || Object.keys(lpStats).length === 0) {
        return (
            <Container className="loading-container" >
                <div className='wine-bounce' >🍷</div >
            </Container >
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
                            <PairSelector pairs={allPairs.pairs} currentPairId={pairId} setPair={setPairId} isLoading={isLoading} />
                        </Col>
                        <Col lg={8}>
                            <TotalPoolStats allPairs={allPairs} lpInfo={lpInfo} lpStats={lpStats} />
                        </Col>
                    </Row>
                    <Row noGutters>
                        <Col lg={3} className='trades-sidebar'>
                            <LatestTradesSidebar latestBlock={latestBlock} latestSwaps={latestSwaps} />
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
                    <LPStatsWidget lpStats={lpStats} pairData={lpInfo.pairData} />
                </Col>
            </Row>
            {/* <Row>
                <RealtimeStatusBar latestBlock={latestBlock} />
            </Row> */}
        </Container>
    );
}

export default PairContainer;