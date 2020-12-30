import { useEffect, useState, useRef, useMemo } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import useWebSocket from 'react-use-websocket';

import USDValueWidget from 'components/usd-value-widget';
import PairSelector from 'components/pair-selector';
import LPInput from 'components/lp-input';
import LPStatsWidget from 'components/lp-stats-widget';
import LPStatsChart from 'components/lp-stats-rechart';
import LatestTradesSidebar from 'components/latest-trades-sidebar';
// import RealtimeStatusBar from 'components/realtime-status-bar';

import initialData from 'constants/initialData.json';
import { UniswapApiFetcher as Uniswap } from 'services/api';
import calculateLPStats from 'services/calculate-lp-stats';

import config from 'config';

function ChartsContainer() {
    console.log('RE-RENDER!');

    // ------------------ Loading State - handles interstitial UI ------------------

    const [isLoading, setIsLoading] = useState(false);

    // ------------------ Initial Mount - API calls for first render ------------------

    const [allPairs, setAllPairs] = useState({ isLoading: true, pairs: initialData.allPairs });

    useEffect(() => {
        const fetchAllPairs = async () => {
            // Fetch all pairs
            const pairs = await Uniswap.getTopPairs();
            setAllPairs({ isLoading: false, pairs });
        }
        fetchAllPairs();
    }, []);

    // ------------------ Shared State ------------------

    const [pairId, setPairId] = useState(initialData.pairId);

    // Keep track of previous pair ID so we can unsubscribe
    const prevPairIdRef = useRef();
    useEffect(() => { prevPairIdRef.current = pairId; });
    const prevPairId = prevPairIdRef.current;

    // ------------------ LP State - handles lp-specific info ------------------

    const initialLPInfo = {
        pairData: initialData.pairData,
        lpDate: new Date(initialData.lpDate),
        lpShare: initialData.lpShare,
        historicalData: initialData.historicalData,
        dailyDataAtLPDate: initialData.dailyDataAtLPDate
    }

    const [lpInfo, setLPInfo] = useState(initialLPInfo);
    const setInfoVal = (key) => (val) => setLPInfo({ ...lpInfo, [key]: val });

    useEffect(() => {
        const fetchPairData = async () => {
            setIsLoading(true);

            let { lpDate } = lpInfo;

            // Fetch pair overview when pair ID changes
            // Default to createdAt date if LP date not set
            const newPair = await Uniswap.getPairOverview(pairId);
            const pairCreatedAt = new Date(newPair.createdAtTimestamp * 1000)
            if (!lpDate || lpDate < pairCreatedAt) lpDate = pairCreatedAt;

            // Get historical data for pair from lp date until now
            const historicalDailyData = await Uniswap.getHistoricalDailyData(pairId, lpDate);

            setLPInfo({
                ...lpInfo,
                lpDate,
                pairData: newPair,
                historicalData: historicalDailyData,
                dailyDataAtLPDate: historicalDailyData[0]
            });

            setIsLoading(false);
        }

        fetchPairData();
    }, [pairId]);

    const lpStats = useMemo(() => {
        const { pairData, historicalData, lpShare } = lpInfo;
        return calculateLPStats(pairData, historicalData, lpShare);
    }, [lpInfo]);

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

        if (topic.startsWith('uniswap:getPairOverview')) {
            setLPInfo({ ...lpInfo, pairData: lastJsonMessage.data });
        } else if (topic === 'infura:newBlockHeaders') {
            const { data: { number: blockNumber } } = lastJsonMessage;
            setLatestBlock(blockNumber);
        }
    }, [lastJsonMessage]);

    // Subscribe to new blocks on first render
    useEffect(() => {
        sendJsonMessage({ op: 'subscribe', topics: ['infura:newBlockHeaders'] })
    }, []);

    // Subscribe to updates on pair overview when pair changes
    useEffect(() => {
        sendJsonMessage({ op: 'unsubscribe', topics: [`uniswap:getPairOverview:${prevPairId}`] });
        sendJsonMessage({ op: 'subscribe', topics: [`uniswap:getPairOverview:${pairId}`], interval: 'newBlocks' });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pairId]);

    // ------------------ Market Data State - fetches non-LP specific market data ------------------

    const [latestSwaps, setLatestSwaps] = useState(null);

    useEffect(() => {
        const getLatestSwaps = async () => {
            // Fetch latest block when pair ID changes
            // Default to createdAt date if LP date not set
            const latestSwaps = await Uniswap.getLatestSwaps(pairId);
            setLatestSwaps(latestSwaps);
        }
        getLatestSwaps();
    }, [pairId, latestBlock]);

    // ------------------ Render code ------------------

    if (allPairs.isLoading) {
        return (
            <Container className="loading-container">
                <div className='wine-bounce'>🍷</div>
            </Container>
        );
    }

    return (
        <Container fluid>
            <Row>
                <Col><h2 className="page-title">Uniswap Impermanent Loss Calculator</h2></Col>
            </Row>
            <Row noGutters>
                <Col lg={3}>
                    <PairSelector pairs={allPairs.pairs} currentPairId={pairId} setPair={setPairId} isLoading={isLoading} />
                </Col>
                <Col lg={3}>
                    <USDValueWidget title="USD Volume" value={lpInfo.pairData.volumeUSD} />
                </Col>
                <Col lg={3}>
                    <USDValueWidget title="Total Liquidity" value={lpInfo.pairData.reserveUSD} />
                </Col>
                <Col lg={3}>
                    <USDValueWidget title="Total Fees" value={lpInfo.pairData.feesUSD} />
                </Col>
            </Row>
            {/* <Row>
                <RealtimeStatusBar latestBlock={latestBlock} />
            </Row> */}
            <Row noGutters>
                <Col lg={2} className='trades-sidebar'>
                    <LatestTradesSidebar latestBlock={latestBlock} latestSwaps={latestSwaps} />
                </Col>
                <Col lg={8}>
                    <LPStatsChart lpStats={lpStats} />
                </Col>
                <Col lg={2}>
                    <LPInput
                        {...lpInfo}
                        setLPDate={setInfoVal('lpDate')}
                        setLPShare={setInfoVal('lpShare')}
                    />
                    <LPStatsWidget lpStats={lpStats} pairData={lpInfo.pairData} />
                </Col>
            </Row>
        </Container>
    );
}

export default ChartsContainer;