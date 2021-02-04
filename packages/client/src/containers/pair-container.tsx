import { useEffect, useState, useRef, useMemo } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import { useMediaQuery } from 'react-responsive';
import useWebSocket from 'react-use-websocket';
import PropTypes from 'prop-types';

import config from 'config';

import {
    UniswapPair,
    UniswapSwap,
    UniswapMintOrBurn,
    UniswapDailyData,
    UniswapHourlyData,
    LPStats,
} from '@sommelier/shared-types';

import { AllPairsState, LPInfoState, IError, StatsWindow } from 'types/states';
import { Pair } from 'constants/prop-types';
import initialData from 'constants/initialData.json';
import { UniswapApiFetcher as Uniswap } from 'services/api';
import { calculateLPStats } from 'services/calculate-stats';
import mixpanel from 'util/mixpanel';

import PairSelector from 'components/pair-selector';
import LPInput from 'components/lp-input';
import LPStatsWidget from 'components/lp-stats-widget';
// import LPStatsChart from 'components/lp-stats-chart';
import LPStatsChart from 'components/lp-stats-highchart';
import LatestTradesSidebar from 'components/latest-trades-sidebar';
import TotalPoolStats from 'components/total-pool-stats';
import TelegramCTA from 'components/telegram-cta';

function PairContainer({ allPairs }: { allPairs: AllPairsState }): JSX.Element {
    const isDesktop = useMediaQuery({ query: '(min-width: 1200px)' });
    const isLargestBreakpoint = useMediaQuery({ query: '(min-width: 1500px)' });

    // ------------------ Loading State - handles interstitial UI ------------------

    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [currentError, setError] = useState<IError | null>(null);

    // ------------------ Shared State ------------------

    const [pairId, setPairId] = useState<string | null>(null);
    const [timeWindow, setWindow] = useState<StatsWindow>('total');

    // Keep track of previous pair ID so we can unsubscribe
    const prevPairIdRef = useRef<string | null>();
    useEffect(() => {
        prevPairIdRef.current = pairId;
    });
    const prevPairId = prevPairIdRef.current;

    const location = useLocation();
    useEffect(() => {
        const query = new URLSearchParams(location.search);

        // Check window (either 24h or 7d)
        const timeWindow = query.get('timeWindow');
        if (timeWindow && ['day', 'week', 'total'].includes(timeWindow)) {
            setWindow(timeWindow as StatsWindow);
        }

        const pairId = query.get('id');
        if (pairId) {
            mixpanel.track('pair:clickthrough', {
                pairId,
            });

            return setPairId(pairId);
        }

        // We can't query if no pairs
        if (!allPairs.pairs) return;

        // lookup by symbol
        const symbol = query.get('symbol');
        const pairForSymbol = allPairs.pairs.find((pair) => {
            const pairSymbol = `${pair.token0.symbol || ''}/${
                pair.token1.symbol || ''
            }`;
            return symbol === pairSymbol;
        });

        if (pairForSymbol) {
            mixpanel.track('pair:clickthrough', {
                pairId: pairForSymbol.id,
                token0: pairForSymbol.token0.symbol,
                token1: pairForSymbol.token1.symbol,
            });

            return setPairId(pairForSymbol.id);
        }

        // There is no pair in the query, so set to default
        if (!pairId) return setPairId(initialData.pairId);
    }, [location]);

    useEffect(() => {
        mixpanel.track('pageview:il_calculator', {});
    }, []);

    // ------------------ LP State - handles lp-specific info ------------------

    const [lpInfo, setLPInfo] = useState<LPInfoState | null>(null);
    const [lpDate, setLPDate] = useState(new Date(initialData.lpDate));
    const [lpShare, setLPShare] = useState(initialData.lpShare);

    // Keep track of previous lp stats to prevent entire loading UI from coming up on change
    const lpStats: LPStats | null = useMemo(
        () => {
            if (isInitialLoad || currentError) return null;

            let lpStats: LPStats | null = null;
            if (timeWindow === 'total') {
                // If less than 7 data points, default to hourly anyway
                if (
                    lpInfo?.historicalDailyData?.length &&
                    lpInfo.historicalDailyData.length > 7
                ) {
                    lpStats = calculateLPStats({
                        dailyData: lpInfo?.historicalDailyData,
                        startDate: lpDate,
                        lpShare,
                    });
                } else {
                    lpStats = calculateLPStats({
                        hourlyData: lpInfo?.historicalHourlyData,
                        startDate: lpDate,
                        lpShare,
                    });
                }
            } else if (timeWindow === 'week') {
                lpStats = calculateLPStats({
                    dailyData: lpInfo?.historicalDailyData,
                    startDate: lpDate,
                    lpShare,
                });
            } else if (timeWindow === 'day') {
                lpStats = calculateLPStats({
                    hourlyData: lpInfo?.historicalHourlyData,
                    startDate: lpDate,
                    lpShare,
                });
            }

            return lpStats;
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [lpInfo, lpDate, lpShare, isInitialLoad, timeWindow]
    );

    useEffect(() => {
        const fetchPairData = async () => {
            if (!isLoading) setIsLoading(true);
            if (currentError || !pairId) return;

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

            if (newPair) {
                const createdAt = parseInt(newPair.createdAtTimestamp, 10);
                const pairCreatedAt = new Date(createdAt * 1000);
                const oneWeekAgo = new Date(
                    Date.now() - 60 * 60 * 24 * 7 * 1000
                );

                // Get historical data for pair from start date until now
                // Also fetch last 7 days hourly
                // and get last 24h from last 7 days
                const [
                    { data: historicalDailyData, error: dailyDataError },
                    { data: historicalHourlyData, error: hourlyDataError },
                ] = await Promise.all([
                    Uniswap.getHistoricalDailyData(pairId, pairCreatedAt),
                    Uniswap.getHistoricalHourlyData(pairId, oneWeekAgo),
                ]);

                (window as any).hourlyData = historicalHourlyData;

                const historicalErrors = dailyDataError ?? hourlyDataError;
                if (historicalErrors) {
                    // we could not get data for this new pair
                    console.warn(
                        `Could not fetch historical data for ${pairId}: ${historicalErrors.message}`
                    );
                    setError(historicalErrors);
                    return;
                }

                setLPInfo(
                    (prevLpInfo) =>
                        ({
                            ...prevLpInfo,
                            pairData: newPair,
                            historicalDailyData,
                            historicalHourlyData,
                        } as LPInfoState)
                );

                mixpanel.track('pair:query', {
                    pairId,
                    token0: newPair.token0.symbol,
                    token1: newPair.token1.symbol,
                });

                setIsLoading(false);
                if (isInitialLoad) setIsInitialLoad(false);
            }
        };

        void fetchPairData();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pairId]);

    const dataAtLPDate = useMemo(():
        | UniswapDailyData
        | UniswapHourlyData
        | null => {
        if (currentError) return null;
        if (!lpInfo) return null;

        if (
            !lpInfo.historicalDailyData ||
            lpInfo.historicalDailyData.length === 0
        )
            return null;

        if (timeWindow === 'total') {
            // Find daily data that matches LP date
            for (const dailyData of lpInfo.historicalDailyData) {
                const currentDate = new Date(dailyData.date * 1000);
                if (currentDate.getTime() === lpDate.getTime()) {
                    return dailyData;
                }
            }

            if (lpInfo.historicalDailyData.length === 0) return null;
            const firstDay = new Date(
                lpInfo.historicalDailyData[0].date * 1000
            );
            console.warn(
                `Could not find LP date in historical data: ${lpDate.toISOString()}. Setting to first day, which is ${firstDay.toISOString()}.`
            );
            setLPDate(firstDay);
            return lpInfo.historicalDailyData[0];
        } else if (timeWindow === 'week') {
            for (const hourlyData of lpInfo.historicalHourlyData) {
                const currentDate = new Date(hourlyData.hourStartUnix * 1000);
                if (currentDate.getTime() === lpDate.getTime()) {
                    return hourlyData;
                }
            }
            if (lpInfo.historicalHourlyData.length === 0) return null;
            const firstHour = new Date(
                lpInfo.historicalHourlyData[0].hourStartUnix * 1000
            );
            console.warn(
                `Could not find LP date in historical data: ${lpDate.toISOString()}. Setting to first day, which is ${firstHour.toISOString()}.`
            );
            setLPDate(firstHour);
            return lpInfo.historicalHourlyData[0];
        } else {
            // If LP Date before one day ago, then set LPDate to one day ago
            const historicalDataOneDay = lpInfo.historicalHourlyData.slice(-24);
            for (const hourlyData of historicalDataOneDay) {
                const currentDate = new Date(hourlyData.hourStartUnix * 1000);
                if (currentDate.getTime() === lpDate.getTime()) {
                    return hourlyData;
                }
            }
            if (historicalDataOneDay.length === 0) return null;
            const firstHour = new Date(
                historicalDataOneDay[0].hourStartUnix * 1000
            );
            console.warn(
                `Could not find LP date in historical data: ${lpDate.toISOString()}. Setting to first day, which is ${firstHour.toISOString()}.`
            );
            setLPDate(firstHour);
            return historicalDataOneDay[0];
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lpInfo, lpDate, timeWindow]);

    // ------------------ Websocket State - handles subscriptions ------------------

    // TODO: Re-enable websockets
    const [latestBlock, setLatestBlock] = useState<number | null>(null);
    // const { sendJsonMessage, lastJsonMessage } = useWebSocket(config.wsApi);

    // Handle websocket message
    // // Ignore if we have an error
    // useEffect(() => {
    //     if (!lastJsonMessage || currentError) return;

    //     const { topic } = lastJsonMessage;

    //     let blockNumber;
    //     if (topic.startsWith('uniswap:getPairOverview') && !isLoading) {
    //         const { data: pairMsg }: { data: UniswapPair } = lastJsonMessage;

    //         if (pairMsg.id === pairId) {
    //             setLPInfo({ ...lpInfo, pairData: pairMsg } as LPInfoState);
    //         } else {
    //             console.warn(
    //                 `Received pair update over websocket for non-active pair: ${
    //                     pairMsg.token0.symbol || ''
    //                 }/${pairMsg.token1.symbol || ''}`
    //             );
    //         }
    //     } else if (topic === 'infura:newHeads') {
    //         const {
    //             data: { number: blockNumberHex },
    //         }: { data: { number: string } } = lastJsonMessage;
    //         blockNumber = parseInt(blockNumberHex.slice(2), 16);
    //         setLatestBlock(blockNumber);
    //     } else if (topic === 'infura:newBlockHeaders') {
    //         const {
    //             data: { number: blockNumberStr },
    //         } = lastJsonMessage;
    //         blockNumber = parseInt(blockNumberStr, 10);
    //         setLatestBlock(blockNumber);
    //     }

    //     // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, [lastJsonMessage]);

    // Subscribe to new blocks on first render
    // Using both b/c infura API is inconsistent
    // useEffect(() => {
    //     sendJsonMessage({ op: 'subscribe', topics: ['infura:newHeads'] });
    //     sendJsonMessage({
    //         op: 'subscribe',
    //         topics: ['infura:newBlockHeaders'],
    //     });
    //     // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, []);

    // Subscribe to updates on pair overview when pair changes
    // useEffect(() => {
    //     if (currentError || !pairId) return;

    //     if (prevPairId) {
    //         sendJsonMessage({
    //             op: 'unsubscribe',
    //             topics: [`uniswap:getPairOverview:${prevPairId}`],
    //         });
    //     }

    //     sendJsonMessage({
    //         op: 'subscribe',
    //         topics: [`uniswap:getPairOverview:${pairId}`],
    //         interval: 'newBlocks',
    //     });
    //     // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, [pairId]);

    // ------------------ Market Data State - fetches non-LP specific market data ------------------

    const [latestSwaps, setLatestSwaps] = useState<{
        swaps: UniswapSwap[] | null;
        mintsAndBurns: {
            mints: UniswapMintOrBurn[];
            burns: UniswapMintOrBurn[];
            combined: UniswapMintOrBurn[];
        } | null;
    }>({
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
                    `Could not fetch trades data for ${pairId}: ${error.message}`
                );
                setError(error);
                return;
            }

            if (latestSwaps && mintsAndBurns) {
                setLatestSwaps({ swaps: latestSwaps, mintsAndBurns });
            }
        };

        const refreshPairData = async () => {
            if (!pairId) return;

            const { data: newPairData } = await Uniswap.getPairOverview(pairId);

            setLPInfo(
                (prevLpInfo) =>
                    ({
                        ...prevLpInfo,
                        pairData: newPairData,
                    } as LPInfoState)
            );
        };

        void getLatestSwaps();
        void refreshPairData();

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
    if (
        !allPairs.pairs ||
        !pairId ||
        !lpInfo ||
        !lpStats ||
        !dataAtLPDate ||
        Object.keys(lpStats).length === 0
    ) {
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
                <Col lg={isLargestBreakpoint ? 10 : 12}>
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
                                defaultWindow={timeWindow}
                                setWindow={setWindow}
                            />
                        </Col>
                    </Row>
                    <Row noGutters>
                        {isDesktop ? (
                            <>
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
                            </>
                        ) : (
                            <>
                                <Col lg={9}>
                                    {/* <FadeOnChange><LPStatsChart lpStats={lpStats} /></FadeOnChange> */}
                                    <LPStatsChart lpStats={lpStats} />
                                </Col>
                                <Col lg={3} className='trades-sidebar'>
                                    <LatestTradesSidebar
                                        latestBlock={latestBlock}
                                        latestSwaps={latestSwaps}
                                    />
                                </Col>
                            </>
                        )}
                    </Row>
                </Col>
                {isLargestBreakpoint && (
                    <>
                        <Col lg={2}>
                            <LPInput
                                {...lpInfo}
                                lpDate={lpDate}
                                lpShare={lpShare}
                                setLPDate={setLPDate}
                                setLPShare={setLPShare}
                                dataAtLPDate={dataAtLPDate}
                            />
                            <LPStatsWidget lpStats={lpStats} />
                        </Col>
                    </>
                )}
            </Row>
            {!isLargestBreakpoint && (
                <Row>
                    <Col lg={8}>
                        <LPInput
                            {...lpInfo}
                            lpDate={lpDate}
                            lpShare={lpShare}
                            setLPDate={setLPDate}
                            setLPShare={setLPShare}
                            dataAtLPDate={dataAtLPDate}
                        />
                    </Col>
                    <Col lg={4}>
                        <LPStatsWidget lpStats={lpStats} />
                    </Col>
                </Row>
            )}
            {/* <Row>
                <RealtimeStatusBar latestBlock={latestBlock} />
            </Row> */}
        </Container>
    );
}

PairContainer.propTypes = {
    allPairs: PropTypes.shape({ pairs: PropTypes.arrayOf(Pair) }),
};

export default PairContainer;
