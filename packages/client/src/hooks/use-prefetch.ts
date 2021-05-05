import { useState, useEffect } from 'react';
import pLimit from 'p-limit';
import BigNumber from 'bignumber.js';

import { UniswapPair, IUniswapPair } from '@sommelier/shared-types';
import { PrefetchedPairState } from 'types/states';

import { UniswapApiFetcher as Uniswap } from 'services/api';

import initialData from 'constants/initialData.json';

// Pre-fetch up to 5 pairs in parallel
const CONCURRENCY = 5;
const limit = pLimit(CONCURRENCY);

export default function usePrefetch(
    pairs: IUniswapPair[] | null
): [PrefetchedPairState | null, (pairs: IUniswapPair[]) => void] {
    const [pairsToFetch, setPairsToFetch] = useState<IUniswapPair[] | null>(
        pairs
    );

    const [
        prefetchedPairs,
        setPrefetchedPairs,
    ] = useState<PrefetchedPairState | null>(null);

    useEffect(() => {
        if (!pairsToFetch) return;
        // For all coins, fetch the following:
        // - Pair overview
        // - Historical daily data
        // - Historical hourly data (prev week)
        // - Swaps
        // - Add/remove
        const fetches = pairsToFetch.map(
            (pair) => {
                const prefetchPair = async () => {
                    const { id: pairId } = pair;

                    const {
                        data: newPair,
                        error,
                    } = await Uniswap.getPairOverview('1', pairId);

                    if (error) {
                        console.error(
                            `Could not prefetch pair overview for pair ${pair.id}: ${error}`
                        );
                        return null;
                    } else if (newPair) {
                        const createdAt = parseInt(
                            newPair.createdAtTimestamp,
                            10
                        );
                        const pairCreatedAt = new Date(createdAt * 1000);
                        const oneWeekAgo = new Date(
                            Date.now() - 60 * 60 * 24 * 7 * 1000
                        );

                        const [
                            {
                                data: historicalDailyData,
                                error: dailyDataError,
                            },
                            {
                                data: historicalHourlyData,
                                error: hourlyDataError,
                            },
                            { data: latestSwaps, error: swapsErrors },
                            { data: mintsAndBurns, error: mintBurnErrors },
                            { data: lpStats, error: lpStatsError },
                        ] = await Promise.all([
                            Uniswap.getHistoricalDailyData(
                                '1', 
                                pairId,
                                pairCreatedAt
                            ),
                            Uniswap.getHistoricalHourlyData('1', pairId, oneWeekAgo),
                            Uniswap.getLatestSwaps('1', pairId),
                            Uniswap.getMintsAndBurns(pairId),
                            Uniswap.getPairStats(
                                pairId,
                                new Date(initialData.lpDate),
                                new Date(),
                                initialData.lpShare
                            )
                        ]);

                        const error =
                            dailyDataError ??
                            hourlyDataError ??
                            swapsErrors ??
                            mintBurnErrors ??
                            lpStatsError;

                        if (error) {
                            console.error(
                                `Could not prefetch trading data for pair ${pair.id}: ${error}`
                            );
                            return null;
                        }

                        if (
                            historicalDailyData &&
                            historicalHourlyData &&
                            latestSwaps &&
                            mintsAndBurns &&
                            lpStats
                        ) {
                            // Find first data points with non-zero volume and liquidity
                            const firstActiveDaily = historicalDailyData.findIndex(
                                (dailyData) =>
                                    new BigNumber(dailyData.reserveUSD).gt(0) &&
                                    new BigNumber(dailyData.dailyVolumeUSD).gt(
                                        0
                                    )
                            );

                            const activeDaily = historicalDailyData.slice(
                                firstActiveDaily
                            );

                            const firstActiveHourly = historicalHourlyData.findIndex(
                                (dailyData) =>
                                    new BigNumber(dailyData.reserveUSD).gt(0) &&
                                    new BigNumber(dailyData.hourlyVolumeUSD).gt(
                                        0
                                    )
                            );

                            const activeHourly = historicalHourlyData.slice(
                                firstActiveHourly
                            );

                            return {
                                isLoading: false,
                                lpInfo: {
                                    pairData: new UniswapPair(newPair),
                                    historicalDailyData: activeDaily,
                                    historicalHourlyData: activeHourly,
                                },
                                latestSwaps: {
                                    swaps: latestSwaps,
                                    mintsAndBurns,
                                },
                                lpStats
                            };
                        } else {
                            throw new Error(
                                `Did not get data or error for trading fetch prefetch of pair ${pair.id}`
                            );
                        }
                    } else {
                        throw new Error(
                            `Did not get data or error for prefetch of pair ${pair.id}`
                        );
                    }
                };

                return limit(prefetchPair);
            },
            [pairsToFetch]
        );

        void Promise.all(fetches).then((allFetches) => {
            const finishedPrefetchedPairs = allFetches
                .filter((pairData) => pairData != null)
                .reduce((acc: PrefetchedPairState, pairState) => {
                    if (pairState == null) return acc;

                    const pairId = pairState.lpInfo.pairData.id;

                    if (pairId) {
                        acc[pairId] = pairState;
                    }

                    return acc;
                }, {});

            setPrefetchedPairs(finishedPrefetchedPairs);
        });
    }, [pairsToFetch]);

    return [prefetchedPairs, setPairsToFetch];
}
