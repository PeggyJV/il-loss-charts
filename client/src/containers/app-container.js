import { useEffect, useState, useRef, useMemo } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import useWebSocket from 'react-use-websocket';
import Mixpanel from 'util/mixpanel';

import USDValueWidget from 'components/usd-value-widget';
import PairSelector from 'components/pair-selector';
import LPInput from 'components/lp-input';
import LPStatsWidget from 'components/lp-stats-widget';
import LPStatsChart from 'components/lp-stats-rechart';
import LatestTradesSidebar from 'components/latest-trades-sidebar';
// import RealtimeStatusBar from 'components/realtime-status-bar';

import FadeOnChange from 'components/fade-on-change';

import initialData from 'constants/initialData.json';
import { UniswapApiFetcher as Uniswap } from 'services/api';
import calculateLPStats from 'services/calculate-lp-stats';

import config from 'config';

const mixpanel = new Mixpanel();

function ChartsContainer() {

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
        historicalData: initialData.historicalData,
    };

    const [lpInfo, setLPInfo] = useState(initialLPInfo);
    const [lpDate, setLPDate] = useState(new Date(initialData.lpDate));
    const [lpShare, setLPShare] = useState(initialData.lpShare);

    useEffect(() => {
        const fetchPairData = async () => {
            setIsLoading(true);
            mixpanel.track('pair_query', { pairId });

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

            setIsLoading(false);
        }

        fetchPairData();
    }, [pairId]);

    const dailyDataAtLPDate = useMemo(() => {
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
    const lpStats = useMemo(() => calculateLPStats({ ...lpInfo, lpDate, lpShare }), [lpInfo, lpDate, lpShare]);

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
        if (topic.startsWith('uniswap:getPairOverview')) {
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

    const [latestSwaps, setLatestSwaps] = useState(null);

    useEffect(() => {
        const getLatestSwaps = async () => {
            // Fetch latest block when pair ID changes
            // Default to createdAt date if LP date not set
            const latestSwaps = await Uniswap.getLatestSwaps(pairId);
            setLatestSwaps(latestSwaps);
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

    if (allPairs.isLoading || !dailyDataAtLPDate) {
        return (
            <Container className="loading-container">
                <div className='wine-bounce'>🍷</div>
            </Container>
        );
    }

    return (
        <Container fluid>
            <Row>
                <Col>
                    <h6 className="social-cta">
                        <a href="https://t.me/getsomm">Join the Sommelier Community</a>
                    </h6>
                </Col>
            </Row>
            <Row>
                <Col>
                    <h2 className="page-title">
                        Uniswap Impermanent Loss Calculator
                    </h2>
                </Col>
            </Row>
            <Row noGutters>
                <Col lg={10}>
                    <Row className='top-stats-row'>
                        <Col lg={5}>
                            <PairSelector pairs={allPairs.pairs} currentPairId={pairId} setPair={setPairId} isLoading={isLoading} />
                        </Col>
                        <Col lg={2}>
                            <USDValueWidget title="USD Volume" value={lpInfo.pairData.volumeUSD} />
                        </Col>
                        <Col lg={2}>
                            <USDValueWidget title="Total Liquidity" value={lpInfo.pairData.reserveUSD} />
                        </Col>
                        <Col lg={2}>
                            <USDValueWidget title="Total Fees" value={lpInfo.pairData.feesUSD} />
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

export default ChartsContainer;