import { useEffect, useState, useMemo } from 'react';
import { Container } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
// import useWebSocket from 'react-use-websocket';
import PropTypes from 'prop-types';

// import config from 'config';

import {
    UniswapDailyData,
    LPStats,
} from '@sommelier/shared-types';

import {
    AllPairsState,
    PrefetchedPairState,
    PairDataState,
    StatsWindow,
} from 'types/states';
import { Pair } from 'constants/prop-types';
import initialData from 'constants/initialData.json';

import usePairData from 'hooks/use-pair-data';
import { calculateLPStats } from 'services/calculate-stats';
import mixpanel from 'util/mixpanel';

import PairSearch from 'components/pair-search';
import PairSelector from 'components/pair-selector';
import LPInput from 'components/lp-input';
import LPStatsWidget from 'components/lp-stats-widget';
// import LPStatsChart from 'components/lp-stats-chart';
import LPStatsChart from 'components/lp-stats-highchart';
// import LatestTradesSidebar from 'components/latest-trades-sidebar';
import TotalPoolStats from 'components/total-pool-stats';
// import TelegramCTA from 'components/telegram-cta';
import { PageError } from 'components/page-error';

function PairContainer({
    allPairs,
    prefetchedPairs,
    handleAddLiquidity,
}: {
    allPairs: AllPairsState;
    prefetchedPairs: PrefetchedPairState | null;
    handleAddLiquidity: (pairId: string) => void;
}): JSX.Element {

    // ------------------ Shared State ------------------

    const [pairId, setPairId] = useState<string | null>(null);
    const [timeWindow, setWindow] = useState<StatsWindow>('total');

    let prefetchedPair: PairDataState | null = null;
    if (pairId && prefetchedPairs) {
        prefetchedPair = prefetchedPairs[pairId];
    }

    const { isLoading, currentError, lpInfo } = usePairData(
        pairId,
        prefetchedPair
    );

    // TODO: Re-enable when we have a better websocket
    // Keep track of previous pair ID so we can unsubscribe
    // const prevPairIdRef = useRef<string | null>();
    // useEffect(() => {
    //     prevPairIdRef.current = pairId;
    // });
    // const prevPairId = prevPairIdRef.current;

    if (pairId) {
        // add new pair id to the URL
        window.history.replaceState(
            null,
            'Sommelier.finance',
            `/pair?id=${pairId}&timeWindow=${timeWindow}`
        );
    }

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
            const pairSymbol = pair.pairReadable
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
        if (!pairId) return setPairId(initialData.defaultPairId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location]);

    useEffect(() => {
        mixpanel.track('pageview:il_calculator', {});
    }, []);

    // ------------------ LP State - handles lp-specific info ------------------

    const [lpDate, setLPDate] = useState(new Date(initialData.lpDate));
    const [lpShare, setLPShare] = useState(initialData.lpShare);

    // Keep track of previous lp stats to prevent entire loading UI from coming up on change
    const lpStats: LPStats | null = useMemo(
        () => {
            if (!lpInfo || currentError) return null;

            let lpStats: LPStats | null = null;
            lpStats = calculateLPStats({
                dailyData: lpInfo?.historicalDailyData,
                startDate: lpDate,
                lpShare,
            });

            // TODO: Figure out if we should re-enable this
            // if (timeWindow === 'total') {
            //     // If less than 7 data points, default to hourly anyway
            //     if (
            //         lpInfo?.historicalDailyData?.length &&
            //         lpInfo.historicalDailyData.length > 7
            //     ) {
            //         lpStats = calculateLPStats({
            //             dailyData: lpInfo?.historicalDailyData,
            //             startDate: lpDate,
            //             lpShare,
            //         });
            //     } else {
            //         lpStats = calculateLPStats({
            //             hourlyData: lpInfo?.historicalHourlyData,
            //             startDate: lpDate,
            //             lpShare,
            //         });
            //     }
            // } else if (timeWindow === 'week') {
            //     lpStats = calculateLPStats({
            //         dailyData: lpInfo?.historicalDailyData,
            //         startDate: lpDate,
            //         lpShare,
            //     });
            // } else if (timeWindow === 'day') {
            //     lpStats = calculateLPStats({
            //         hourlyData: lpInfo?.historicalHourlyData,
            //         startDate: lpDate,
            //         lpShare,
            //     });
            // }

            return lpStats;
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [lpInfo, lpDate, lpShare]
    );

    const dataAtLPDate = useMemo((): UniswapDailyData | null => {
        if (currentError) return null;
        if (!lpInfo) return null;

        if (
            !lpInfo.historicalDailyData ||
            lpInfo.historicalDailyData.length === 0
        )
            return null;

        // if (timeWindow === 'total') {
        // TODO: figure out if we should re - enable this
        // eslint-disable-next-line
        if (true) {
            // Find daily data that matches LP date
            for (const dailyData of lpInfo.historicalDailyData) {
                const currentDate = new Date(dailyData.date * 1000);
                const oneDayMs = 24 * 60 * 60 * 1000;
                // If we are within a day, this is good data
                if (
                    Math.abs(currentDate.getTime() - lpDate.getTime()) <=
                    oneDayMs
                ) {
                    // eslint-disable-next-line
                    return dailyData as UniswapDailyData;
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
            // eslint-disable-next-line
            return lpInfo.historicalDailyData[0] as UniswapDailyData;
        }
        // } else if (timeWindow === 'week') {
        //     for (const hourlyData of lpInfo.historicalHourlyData) {
        //         const currentDate = new Date(hourlyData.hourStartUnix * 1000);
        //         if (currentDate.getTime() === lpDate.getTime()) {
        //             return hourlyData;
        //         }
        //     }
        //     if (lpInfo.historicalHourlyData.length === 0) return null;
        //     const firstHour = new Date(
        //         lpInfo.historicalHourlyData[0].hourStartUnix * 1000
        //     );
        //     console.warn(
        //         `Could not find LP date in historical data: ${lpDate.toISOString()}. Setting to first day, which is ${firstHour.toISOString()}.`
        //     );
        //     setLPDate(firstHour);
        //     return lpInfo.historicalHourlyData[0];
        // } else {
        //     // If LP Date before one day ago, then set LPDate to one day ago
        //     const historicalDataOneDay = lpInfo.historicalHourlyData.slice(-24);
        //     for (const hourlyData of historicalDataOneDay) {
        //         const currentDate = new Date(hourlyData.hourStartUnix * 1000);
        //         if (currentDate.getTime() === lpDate.getTime()) {
        //             return hourlyData;
        //         }
        //     }
        //     if (historicalDataOneDay.length === 0) return null;
        //     const firstHour = new Date(
        //         historicalDataOneDay[0].hourStartUnix * 1000
        //     );
        //     console.warn(
        //         `Could not find LP date in historical data: ${lpDate.toISOString()}. Setting to first day, which is ${firstHour.toISOString()}.`
        //     );
        //     setLPDate(firstHour);
        //     return historicalDataOneDay[0];
        // }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lpInfo, lpDate]);

    // ------------------ Websocket State - handles subscriptions ------------------

    // TODO: Re-enable websockets
    // const [latestBlock, setLatestBlock] = useState<number | null>(null);
    // const { sendJsonMessage, lastJsonMessage } = useWebSocket(config.wsApi);

    // Handle websocket message
    // // Ignore if we have an error
    // useEffect(() => {
    //     if (!lastJsonMessage || currentError) return;

    //     const { topic } = lastJsonMessage;

    //     let blockNumber;
    //     if (topic.startsWith('uniswap:getPairOverview') && !isLoading) {
    //         const { data: pairMsg }: { data: IUniswapPair } = lastJsonMessage;

    //         if (pairMsg.id === pairId) {
    //             setLPInfo({ ...lpInfo, pairData: pairMsg } as PairPricesState);
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

    // ------------------ Render code ------------------

    // If error, display an error page
    if (currentError) {
        return <PageError errorMsg={currentError} />;
    }

    // If no lp stats, we haven't completed our first data fetch yet
    // TODO: lots of nulls here are for typescript, have a better loading scheme
    if (!allPairs.pairs || !pairId || !dataAtLPDate || !lpInfo || !lpStats) {
        return (
            <Container className='loading-container'>
                <div className='wine-pulse'>🍷</div>
            </Container>
        );
    }

    const shouldShowAddl = lpInfo.pairData?.token0.symbol === 'WETH' || lpInfo.pairData?.token1?.symbol === 'WETH';

    return (
        <div>
            <h4 className='heading-main'>Impermanent Loss Calculator</h4>
            <div className='alert-well'>
                <p>
                    This is not financial advice. This is an alpha project.
                    Trade at your own risk. All calculated returns include
                    Impermanent Loss.
                </p>
            </div>
            
            <PairSearch pairs={allPairs.pairs} setPair={setPairId} />
            <div className='pair-controls'>
                <div className='pair-and-pool-stats'>
                    <PairSelector
                        pairs={allPairs.pairs}
                        currentPairId={pairId}
                        setPair={setPairId}
                        isLoading={isLoading}
                    />
                    <div className='pool-stats-addl'>
                        <TotalPoolStats
                            lpInfo={lpInfo}
                            defaultWindow={timeWindow}
                            setWindow={setWindow}
                        />
                        {shouldShowAddl &&
                            <button
                                className='btn-addl'
                                onClick={() => handleAddLiquidity(pairId)}
                            >
                                MANAGE LIQUIDITY
                            </button>
                        }
                    </div>
                </div>
                <div className='lp-input-with-stats'>
                    <LPInput
                        {...lpInfo}
                        lpDate={lpDate}
                        lpShare={lpShare}
                        setLPDate={setLPDate}
                        setLPShare={setLPShare}
                        dataAtLPDate={dataAtLPDate}
                    />
                    <LPStatsWidget lpStats={lpStats} />
                </div>
            </div>
            <LPStatsChart lpStats={lpStats} />

            {/* <Col lg={3} className='trades-sidebar'>
                                    {latestSwaps && (
                                        <LatestTradesSidebar
                                            latestBlock={latestBlock}
                                            latestSwaps={latestSwaps}
                                        />
                                    )}
                                </Col> */}

            {/* <FadeOnChange><LPStatsChart lpStats={lpStats} /></FadeOnChange> */}
            {/* <LPStatsChart lpStats={lpStats} /> */}
            {/* <FadeOnChange><LPStatsChart lpStats={lpStats} /></FadeOnChange> */}
            {/* <LPStatsChart lpStats={lpStats} /> */}

            {/* <Col lg={3} className='trades-sidebar'>
                                    {latestSwaps && (
                                        <LatestTradesSidebar
                                            latestBlock={latestBlock}
                                            latestSwaps={latestSwaps}
                                        />
                                    )}
                                </Col> */}

            {/* <LPInput
                {...lpInfo}
                lpDate={lpDate}
                lpShare={lpShare}
                setLPDate={setLPDate}
                setLPShare={setLPShare}
                dataAtLPDate={dataAtLPDate}
            />
            <LPStatsWidget lpStats={lpStats} /> */}

            {/* <Row>
                <RealtimeStatusBar latestBlock={latestBlock} />
            </Row> */}
        </div>
    );
}

PairContainer.propTypes = {
    allPairs: PropTypes.shape({ pairs: PropTypes.arrayOf(Pair) }),
};

export default PairContainer;
