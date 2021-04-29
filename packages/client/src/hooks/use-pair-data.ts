import { useState, useEffect } from 'react';
import BigNumber from 'bignumber.js';

import { UniswapPair } from '@sommelier/shared-types';
import { PairPricesState, SwapsState, PairDataState } from 'types/states';

import { UniswapApiFetcher as Uniswap } from 'services/api';
import mixpanel from 'util/mixpanel';
import { debug } from 'util/debug';

export default function usePairData(
    pairId: string | null,
    prefetchedData: PairDataState | null
): PairDataState {
    // For all coins, fetch the following:
    // - Pair overview
    // - Historical daily data
    // - Historical hourly data (prev week)
    // - Swaps
    // - Add/remove

    const [lpInfo, setLPInfo] = useState<PairPricesState | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentError, setError] = useState<string | null>(null);
    const [latestSwaps, setLatestSwaps] = useState<SwapsState>({
        swaps: null,
        mintsAndBurns: null,
    });

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
                    `Could not fetch pair data for ${pairId}: ${error}`
                );
                setError(error);
                return;
            }

            if (newPair) {
                const createdAt = parseInt(newPair.createdAtTimestamp, 10);
                const pairCreatedAt = new Date(createdAt * 1000);
                const oneDayMs = 60 * 60 * 24 * 1000;
                const twoWeeksAgo = new Date(Date.now() - oneDayMs * 15);

                // Get historical data for pair from start date until now
                // Also fetch last 7 days hourly
                // and get last 24h from last 7 days
                const [
                    { data: historicalDailyData, error: dailyDataError },
                    { data: historicalHourlyData, error: hourlyDataError },
                ] = await Promise.all([
                    Uniswap.getHistoricalDailyData(pairId, pairCreatedAt),
                    Uniswap.getHistoricalHourlyData(pairId, twoWeeksAgo),
                ]);

                debug.hourlyData = historicalHourlyData;

                const historicalErrors = dailyDataError ?? hourlyDataError;
                if (historicalErrors) {
                    // we could not get data for this new pair
                    console.warn(
                        `Could not fetch historical data for ${pairId}: ${historicalErrors}`
                    );
                    setError(historicalErrors);
                    return;
                }

                if (historicalDailyData && historicalHourlyData) {
                    // Find first data points with non-zero volume and liquidity
                    const firstActiveDaily = historicalDailyData.findIndex(
                        (dailyData) =>
                            new BigNumber(dailyData.reserveUSD).gt(0) &&
                            new BigNumber(dailyData.dailyVolumeUSD).gt(0)
                    );

                    const activeDaily = historicalDailyData.slice(
                        firstActiveDaily
                    );

                    const firstActiveHourly = historicalHourlyData.findIndex(
                        (hourlyDatas) =>
                            new BigNumber(hourlyDatas.reserveUSD).gt(0) &&
                            new BigNumber(hourlyDatas.hourlyVolumeUSD).gt(0)
                    );

                    const activeHourly = historicalHourlyData.slice(
                        firstActiveHourly
                    );

                    setLPInfo(
                        (prevLpInfo): PairPricesState => ({
                            ...prevLpInfo,
                            pairData: new UniswapPair(newPair),
                            historicalDailyData: activeDaily,
                            historicalHourlyData: activeHourly,
                        })
                    );
                } else {
                    throw new Error(
                        `Error populating historical info - did not receive error or data`
                    );
                }

                try {
                  mixpanel.track('pair:query', {
                      distinct_id: pairId,
                      pairId,
                      token0: newPair.token0.symbol,
                      token1: newPair.token1.symbol,
                  });
                } catch (e) {
                    console.error(`Metrics error on pair:query.`);
                }

                setIsLoading(false);
            }
        };

        if (prefetchedData && prefetchedData.lpInfo) {
            setIsLoading(false);
            setLPInfo(prefetchedData.lpInfo);
        } else {
            void fetchPairData();
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pairId]);

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
                    `Could not fetch trades data for ${pairId}: ${error}`
                );
                setError(error);
                return;
            }

            if (latestSwaps && mintsAndBurns) {
                setLatestSwaps({ swaps: latestSwaps, mintsAndBurns });
            }
        };

        if (prefetchedData && prefetchedData.latestSwaps) {
            setLatestSwaps(prefetchedData.latestSwaps);
        } else {
            void getLatestSwaps();
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pairId]);

    if (!pairId || isLoading) {
        return { isLoading: true };
    } else if (!isLoading && currentError) {
        return { isLoading, currentError };
    } else if (!isLoading && lpInfo) {
        return {
            isLoading,
            lpInfo,
            latestSwaps,
        };
    } else {
        throw new Error(
            `Error in usePairData - not loading but no error or data present`
        );
    }
}
