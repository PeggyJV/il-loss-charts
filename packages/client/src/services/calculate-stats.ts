import BigNumber from 'bignumber.js';
import { format } from 'date-fns';

import {
    UniswapPair,
    UniswapDailyData,
    UniswapHourlyData,
    LiquidityData,
    LPStats,
    StatsOverTime,
} from '@sommelier/shared-types';

const FEE_RATIO = 0.003;

type HistoricalData = UniswapDailyData | UniswapHourlyData;
const isDailyData = (data: HistoricalData): data is UniswapDailyData =>
    Object.prototype.hasOwnProperty.call(data, 'dailyVolumeUSD');

export function calculateLPStats({
    pairData,
    dailyData,
    hourlyData,
    lpShare: lpLiquidityUSD,
    lpDate,
}: {
    pairData?: UniswapPair;
    dailyData?: UniswapDailyData[];
    hourlyData?: UniswapHourlyData[];
    lpShare: number;
    lpDate: Date;
}): LPStats {
    if (dailyData && hourlyData) {
        throw new Error('Should only receive one of daily or hourly data');
    }

    const historicalData: HistoricalData[] | undefined =
        dailyData ?? hourlyData;

    if (!historicalData) {
        throw new Error('Did not receive daily or hourly data');
    }

    const dailyLiquidity: BigNumber[] = [];
    const runningVolume: BigNumber[] = [];
    const runningPoolFees: BigNumber[] = [];
    const runningFees: BigNumber[] = [];
    const runningImpermanentLoss: BigNumber[] = [];
    const runningReturn: BigNumber[] = [];
    const fullDates: Date[] = [];
    const days: string[] = [];

    const calculateImpermanentLoss = (
        startDailyData: LiquidityData,
        endDailyData: LiquidityData,
        lpLiquidity: number
    ): BigNumber => {
        const initialExchangeRate = new BigNumber(startDailyData.reserve0).div(
            new BigNumber(startDailyData.reserve1)
        );
        const currentExchangeRate = new BigNumber(endDailyData.reserve0).div(
            new BigNumber(endDailyData.reserve1)
        );
        const priceRatio = currentExchangeRate.div(initialExchangeRate);
        const impermanentLossPct = new BigNumber(2)
            .times(priceRatio.sqrt())
            .div(priceRatio.plus(1))
            .minus(1);
        const impermanentLoss = impermanentLossPct.times(
            new BigNumber(lpLiquidity)
        );

        return impermanentLoss;
    };

    const getPrevRunningValue = (list: BigNumber[]): BigNumber =>
        list.length ? list[list.length - 1] : new BigNumber(0);
    let firstDaily: HistoricalData | null = null;

    historicalData.forEach((dataPoint) => {
        let currentDate: Date;

        if (isDailyData(dataPoint)) {
            currentDate = new Date(dataPoint.date * 1000);
        } else {
            currentDate = new Date(dataPoint.hourStartUnix * 1000);
        }

        // Ignore if below lp date
        if (currentDate.getTime() < lpDate.getTime()) return;
        if (!firstDaily) firstDaily = dataPoint;

        const poolShare = new BigNumber(lpLiquidityUSD).div(
            dataPoint.reserveUSD
        );

        let vol: BigNumber;

        if (isDailyData(dataPoint)) {
            vol = new BigNumber(dataPoint.dailyVolumeUSD);
        } else {
            vol = new BigNumber(dataPoint.hourlyVolumeUSD);
        }

        const liquidity = new BigNumber(dataPoint.reserveUSD);
        const dailyPoolFees = vol.times(FEE_RATIO);
        const dailyFees = dailyPoolFees.times(poolShare);
        const newRunningFees = getPrevRunningValue(runningFees).plus(dailyFees);
        const dailyImpermanentLoss = calculateImpermanentLoss(
            firstDaily,
            dataPoint,
            lpLiquidityUSD
        );
        const dailyReturn = newRunningFees.plus(dailyImpermanentLoss);

        dailyLiquidity.push(liquidity);
        runningVolume.push(getPrevRunningValue(runningVolume).plus(vol));
        runningPoolFees.push(
            getPrevRunningValue(runningPoolFees).plus(dailyPoolFees)
        );
        runningFees.push(newRunningFees);
        runningImpermanentLoss.push(dailyImpermanentLoss);
        runningReturn.push(dailyReturn);

        fullDates.push(currentDate);
        days.push(format(currentDate, 'MMM d'));
    });

    if (!firstDaily) {
        throw new Error('No provided histortical data after LP date');
    }

    const totalFees = runningFees[runningFees.length - 1];
    const impermanentLoss = calculateImpermanentLoss(
        firstDaily,
        historicalData[historicalData.length - 1],
        lpLiquidityUSD
    );
    const totalReturn = totalFees.plus(impermanentLoss);

    if (!pairData) {
        // If no pair data, just return LP stats
        return {
            dailyLiquidity,
            totalFees,
            runningVolume,
            runningFees,
            runningImpermanentLoss,
            runningReturn,
            impermanentLoss,
            totalReturn,
            days,
            fullDates,
        };
    }

    // Calculate 24h and 7d stats for the pair itself
    const lastDailyIndex = runningVolume.length - 1;
    const dailyStartIndex = runningVolume.length - 2;
    const prevDayStartIndex = runningVolume.length - 3;
    const weeklyStartIndex = runningVolume.length - 8;
    const prevWeekStartIndex = runningVolume.length - 15;

    const totalStats: StatsOverTime = {
        volumeUSD: new BigNumber(pairData.volumeUSD),
        liquidityUSD: new BigNumber(pairData.reserveUSD),
        feesUSD: new BigNumber(pairData.feesUSD as string),
    };

    let lastDayStats: StatsOverTime | undefined = undefined;
    let prevDayStats: StatsOverTime | undefined = undefined;
    let lastWeekStats: StatsOverTime | undefined = undefined;
    let prevWeekStats: StatsOverTime | undefined = undefined;

    if (runningVolume.length > 1) {
        lastDayStats = {
            volumeUSD: runningVolume[lastDailyIndex].minus(
                runningVolume[dailyStartIndex]
            ),
            liquidityUSD: dailyLiquidity[lastDailyIndex],
            feesUSD: runningPoolFees[lastDailyIndex].minus(
                runningPoolFees[dailyStartIndex]
            ),
        };

        if (runningVolume.length > 2) {
            prevDayStats = {
                volumeUSD: runningVolume[dailyStartIndex].minus(
                    runningVolume[prevDayStartIndex]
                ),
                liquidityUSD: dailyLiquidity[dailyStartIndex],
                feesUSD: runningPoolFees[dailyStartIndex].minus(
                    runningPoolFees[prevDayStartIndex]
                ),
            };

            lastDayStats.volumeUSDChange = lastDayStats.volumeUSD
                .minus(prevDayStats.volumeUSD)
                .div(prevDayStats.volumeUSD);
            lastDayStats.liquidityUSDChange = lastDayStats.liquidityUSD
                .minus(prevDayStats.liquidityUSD)
                .div(prevDayStats.liquidityUSD);
            lastDayStats.feesUSDChange = lastDayStats.feesUSD
                .minus(prevDayStats.feesUSD)
                .div(prevDayStats.feesUSD);

            if (runningVolume.length > 7) {
                lastWeekStats = {
                    volumeUSD: runningVolume[lastDailyIndex].minus(
                        runningVolume[weeklyStartIndex]
                    ),
                    liquidityUSD: dailyLiquidity[lastDailyIndex],
                    feesUSD: runningPoolFees[lastDailyIndex].minus(
                        runningPoolFees[weeklyStartIndex]
                    ),
                };

                if (runningVolume.length > 14) {
                    prevWeekStats = {
                        volumeUSD: runningVolume[weeklyStartIndex].minus(
                            runningVolume[prevWeekStartIndex]
                        ),
                        liquidityUSD: dailyLiquidity[weeklyStartIndex],
                        feesUSD: runningPoolFees[weeklyStartIndex].minus(
                            runningPoolFees[prevWeekStartIndex]
                        ),
                    };

                    lastWeekStats.volumeUSDChange = lastWeekStats.volumeUSD
                        .minus(prevWeekStats.volumeUSD)
                        .div(prevWeekStats.volumeUSD);
                    lastWeekStats.liquidityUSDChange = lastWeekStats.liquidityUSD
                        .minus(prevWeekStats.liquidityUSD)
                        .div(prevWeekStats.liquidityUSD);
                    lastWeekStats.feesUSDChange = lastWeekStats.feesUSD
                        .minus(prevWeekStats.feesUSD)
                        .div(prevWeekStats.feesUSD);
                }
            }
        }
    }

    return {
        totalStats,
        lastDayStats,
        prevDayStats,
        lastWeekStats,
        prevWeekStats,
        dailyLiquidity,
        totalFees,
        runningVolume,
        runningFees,
        runningImpermanentLoss,
        runningReturn,
        impermanentLoss,
        totalReturn,
        days,
        fullDates,
    };
}

export function calculatePairRankings(pairs: UniswapPair[]): {
    byVolume: UniswapPair[],
    byLiquidity: UniswapPair[],
    pairs: UniswapPair[],
    pairLookups: {
        [pairId: string]:
        UniswapPair & { volumeRanking: number, liquidityRanking: number }
    }
} {
    const byVolume = [...pairs].sort((a, b) =>
        new BigNumber(a.volumeUSD).minus(new BigNumber(b.volumeUSD)).toNumber()
    );
    const byLiquidity = [...pairs].sort((a, b) =>
        new BigNumber(b.reserveUSD)
            .minus(new BigNumber(a.reserveUSD))
            .toNumber()
    );
    const liquidityLookup: { [pairId: string]: UniswapPair } = byLiquidity.reduce(
        (acc, pair, index) => ({ ...acc, [pair.id]: index + 1 }),
        {}
    );

    const pairLookups = pairs.reduce(
        (acc, pair, index) => ({
            ...acc,
            [pair.id]: {
                ...pair,
                volumeRanking: index + 1,
                liquidityRanking: liquidityLookup[pair.id],
            },
        }),
        {}
    );

    return {
        byVolume,
        byLiquidity,
        pairs,
        pairLookups,
    };
}