import { useEffect, useState } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';

import USDValueWidget from 'components/usd-value-widget';
import PairSelector from 'components/pair-selector';
import LPInput from 'components/lp-input';
import LPStatsWidget from 'components/lp-stats-widget';
import LPStatsChart from 'components/lp-stats-chart';

import initialData from 'constants/initialData.json';
import Uniswap from 'services/uniswap';
import calculateLPStats from 'services/calculate-lp-stats';

function ChartsContainer() {
    const [allPairs, setAllPairs] = useState(initialData.allPairs);
    const [pairId, setPairId] = useState(initialData.pairId);
    const [pairData, setPairData] = useState(initialData.pairData);
    const [lpDate, setLPDate] = useState(new Date(initialData.lpDate));
    const [lpShare, setLPShare] = useState(initialData.lpShare);
    const [historicalData, setHistoricalData] = useState(initialData.historicalData)
    const [lpStats, setLPStats] = useState(initialData.lpStats);
    const [dailyDataAtLPDate, setDailyDataAtLPDate] = useState(initialData.dailyDataAtLPDate);

    useEffect(() => {
        const fetchPairData = async () => {
            // Fetch pair overview when pair ID changes
            // Default to createdAt date if LP date not set
            const newPair = await Uniswap.getPairOverview(pairId);
            setPairData(newPair);
            if (!lpDate) setLPDate(new Date(newPair.createdAtTimestamp * 1000));
        }
        fetchPairData();
    }, [pairId, lpDate]);

    useEffect(() => {
        const fetchAllPairs = async () => {
            // Fetch all pairs
            const allPairs = await Uniswap.getTopPairs();
            setAllPairs(allPairs);
        }
        fetchAllPairs();
    });

    useEffect(() => {
        const getDailyPairData = async () => {
            if (!lpDate) return;
            // Get historical data for pair from lp date until now
            const historicalDailyData = await Uniswap.getHistoricalDailyData(pairId, lpDate);
            setHistoricalData(historicalDailyData);
            setDailyDataAtLPDate(historicalDailyData[0]);
        }
        getDailyPairData();
    }, [lpDate, pairId])

    useEffect(() => {
        if (!pairData) return;

        const newLpStats = calculateLPStats(pairData, historicalData, lpShare);
        setLPStats(newLpStats);
    }, [pairData, lpShare, historicalData]);

    window.data = {
        allPairs,
        pairId,
        pairData,
        historicalData,
        lpStats
    };

    if (!lpDate) return null;
    if (allPairs.length === 0) return null;
    if (!pairData) return null;

    return (
        <Container>
            <Row>
                <Col xs={3}>
                    <Card className="top-row-card">
                        <PairSelector pairs={allPairs} currentPairId={pairId} setPair={setPairId} />
                    </Card>
                </Col>
                <Col xs={3}>
                    <Card className="top-row-card">
                        <USDValueWidget title="USD Volume" value={pairData.volumeUSD} />
                    </Card>
                </Col>
                <Col xs={3}>
                    <Card className="top-row-card">
                        <USDValueWidget title="Total Liquidity" value={pairData.reserveUSD} />
                    </Card>
                </Col>
                <Col xs={3}>
                    <Card className="top-row-card">
                        <USDValueWidget title="Total Fees" value={pairData.feesUSD} />
                    </Card>
                </Col>
            </Row>
            <Row>
                <Col xs={9}>
                    <Card body>
                        <LPStatsChart lpStats={lpStats} />
                    </Card>
                </Col>
                <Col xs={3}>
                    <Container fluid>
                        <Row>
                            <Card className="lp-input-card">
                                <LPInput
                                    pairData={pairData}
                                    lpDate={lpDate}
                                    setLPDate={setLPDate}
                                    lpShare={lpShare}
                                    setLPShare={setLPShare}
                                    dailyDataAtLPDate={dailyDataAtLPDate}
                                />
                            </Card>
                        </Row>
                        <Row>
                            <Card>
                                <LPStatsWidget lpStats={lpStats} pairData={pairData} />
                            </Card>
                        </Row>
                    </Container>
                </Col>
            </Row>
        </Container>
    );
}

export default ChartsContainer;