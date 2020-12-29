import { useEffect, useState, useRef } from 'react';
import { Container, Row, Col, Spinner } from 'react-bootstrap';
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
    const [allPairs, setAllPairs] = useState(initialData.allPairs);
    const [pairId, setPairId] = useState(initialData.pairId);
    const [pairData, setPairData] = useState(initialData.pairData);
    const [lpDate, setLPDate] = useState(new Date(initialData.lpDate));
    const [lpShare, setLPShare] = useState(initialData.lpShare);
    const [historicalData, setHistoricalData] = useState(initialData.historicalData)
    const [lpStats, setLPStats] = useState(initialData.lpStats);
    const [dailyDataAtLPDate, setDailyDataAtLPDate] = useState(initialData.dailyDataAtLPDate);
    const [latestBlock, setLatestBlock] = useState(null);
    const [latestSwaps, setLatestSwaps] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const [socketUrl] = useState(config.wsApi);

    const prevPairIdRef = useRef();
    useEffect(() => {
        prevPairIdRef.current = pairId;
    });
    const prevPairId = prevPairIdRef.current;

    const {
        sendJsonMessage,
        lastJsonMessage,
    } = useWebSocket(socketUrl);

    useEffect(() => {
        sendJsonMessage({ op: 'subscribe', topics: ['infura:newBlockHeaders'] })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        sendJsonMessage({ op: 'unsubscribe', topics: [`uniswap:getPairOverview:${prevPairId}`] });
        sendJsonMessage({ op: 'subscribe', topics: [`uniswap:getPairOverview:${pairId}`], interval: 'newBlocks' });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pairId]);

    useEffect(() => {
        if (!lastJsonMessage) return;

        const { topic } = lastJsonMessage;

        if (topic.startsWith('uniswap:getPairOverview')) {
            setPairData(lastJsonMessage.data);
        } else if (topic === 'infura:newBlockHeaders') {
            const { data: { number: blockNumber } } = lastJsonMessage;
            setLatestBlock(blockNumber);
        }
    }, [lastJsonMessage]);

    useEffect(() => {
        const fetchPairData = async () => {
            // Fetch pair overview when pair ID changes
            // Default to createdAt date if LP date not set
            const newPair = await Uniswap.getPairOverview(pairId);
            setPairData(newPair);
            const pairCreatedAt = new Date(newPair.createdAtTimestamp * 1000)
            if (!lpDate || lpDate < pairCreatedAt) setLPDate(pairCreatedAt);
        }
        fetchPairData();
    }, [pairId, lpDate]);


    useEffect(() => {
        const getLatestSwaps = async () => {
            // Fetch pair overview when pair ID changes
            // Default to createdAt date if LP date not set
            const latestSwaps = await Uniswap.getLatestSwaps(pairId);
            setLatestSwaps(latestSwaps);
        }
        getLatestSwaps();
    }, [pairId, latestBlock]);

    useEffect(() => {
        const fetchAllPairs = async () => {
            // Fetch all pairs
            const allPairs = await Uniswap.getTopPairs();
            setAllPairs(allPairs);
        }
        fetchAllPairs();
    }, []);

    useEffect(() => {
        const getDailyPairData = async () => {
            if (!lpDate) return;
            // Get historical data for pair from lp date until now
            const historicalDailyData = await Uniswap.getHistoricalDailyData(pairId, lpDate);
            setHistoricalData(historicalDailyData);
            setDailyDataAtLPDate(historicalDailyData[0]);
        }
        getDailyPairData();
        setIsLoading(true);
    }, [lpDate, pairId])

    useEffect(() => {
        if (!pairData) return;

        const newLpStats = calculateLPStats(pairData, historicalData, lpShare);
        setLPStats(newLpStats);
    }, [pairData, lpShare, lpDate, historicalData]);

    useEffect(() => {
        if (isLoading) {
            setTimeout(() => setIsLoading(false), 2000);
        }
    }, [isLoading]);

    if (!lpDate) return null;
    if (allPairs.length === 0) return null;
    if (!pairData) return null;

    if (isLoading) {
        return (
            <Container className="my-auto loading-container">
                <Spinner animation="border" />
            </Container>
        );
    }

    return (
        <>
            {isLoading &&
                <Container className="my-auto loading-container">
                    <Spinner animation="border" />
                </Container>
            }
            <Row noGutters>
                <Col lg={3}>
                    <PairSelector pairs={allPairs} currentPairId={pairId} setPair={setPairId} />
                </Col>
                <Col lg={3}>
                    <USDValueWidget title="USD Volume" value={pairData.volumeUSD} />
                </Col>
                <Col lg={3}>
                    <USDValueWidget title="Total Liquidity" value={pairData.reserveUSD} />
                </Col>
                <Col lg={3}>
                    <USDValueWidget title="Total Fees" value={pairData.feesUSD} />
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
                        pairData={pairData}
                        lpDate={lpDate}
                        setLPDate={setLPDate}
                        lpShare={lpShare}
                        setLPShare={setLPShare}
                        dailyDataAtLPDate={dailyDataAtLPDate}
                    />
                    <LPStatsWidget lpStats={lpStats} pairData={pairData} />
                </Col>
            </Row>
        </>
    );
}

export default ChartsContainer;