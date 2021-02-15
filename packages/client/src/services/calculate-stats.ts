import BigNumber from 'bignumber.js';
import { format } from 'date-fns';

import {
    UniswapPair,
    UniswapDailyData,
    UniswapHourlyData,
    LiquidityData,
    LPStats,
    StatsOverTime,
    TimeWindowStats,
} from '@sommelier/shared-types';

import { StatsWindow, PairPricesState } from 'types/states';

const FEE_RATIO = 0.003;

type HistoricalData = UniswapDailyData | UniswapHourlyData;
const isDailyData = (data: HistoricalData): data is UniswapDailyData =>
    Object.prototype.hasOwnProperty.call(data, 'dailyVolumeUSD');

export function calculateLPStats({
    dailyData,
    hourlyData,
    lpShare: lpLiquidityUSD,
    startDate,
}: {
    dailyData?: UniswapDailyData[];
    hourlyData?: UniswapHourlyData[];
    lpShare: number;
    startDate: Date;
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
    const dailyVolume: BigNumber[] = [];
    const runningVolume: BigNumber[] = [];
    const runningPoolFees: BigNumber[] = [];
    const runningFees: BigNumber[] = [];
    const runningImpermanentLoss: BigNumber[] = [];
    const runningReturn: BigNumber[] = [];
    const fullDates: Date[] = [];
    const ticks: string[] = [];

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
        if (currentDate.getTime() < startDate.getTime()) return;
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
        dailyVolume.push(vol);
        runningVolume.push(getPrevRunningValue(runningVolume).plus(vol));
        runningPoolFees.push(
            getPrevRunningValue(runningPoolFees).plus(dailyPoolFees)
        );
        runningFees.push(newRunningFees);
        runningImpermanentLoss.push(dailyImpermanentLoss);
        runningReturn.push(dailyReturn);

        fullDates.push(currentDate);

        // If we're at a full day or the day has turned over
        const dayTurnedOver =
            currentDate.getUTCDay() -
                (fullDates[fullDates.length - 2]?.getUTCDay() ||
                    currentDate.getUTCDay()) >
            0;
        if (currentDate.getHours() === 0 || dayTurnedOver) {
            // Push a full day format - i.e. Feb 02
            ticks.push(format(currentDate, 'MMM d'));
        } else {
            // Push the time
            ticks.push(format(currentDate, 'HH:mm'));
        }
    });

    if (!firstDaily) {
        throw new Error('No provided historical data after LP date');
    }

    const totalFees = runningFees[runningFees.length - 1];
    const impermanentLoss = calculateImpermanentLoss(
        firstDaily,
        historicalData[historicalData.length - 1],
        lpLiquidityUSD
    );
    const totalReturn = totalFees.plus(impermanentLoss);

    return {
        timeWindow: isDailyData(historicalData[0]) ? 'daily' : 'hourly',
        dailyLiquidity,
        dailyVolume,
        totalFees,
        runningVolume,
        runningFees,
        runningPoolFees,
        runningImpermanentLoss,
        runningReturn,
        impermanentLoss,
        totalReturn,
        ticks,
        fullDates,
    };
}

export function calculateTimeWindowStats(
    lpInfo: PairPricesState,
    dataPeriod: 'hourly' | 'daily',
    period: StatsWindow = 'total'
): TimeWindowStats {
    let runningVolume: BigNumber[];
    let runningPoolFees: BigNumber[];
    let dailyLiquidity: BigNumber[];

    if (period === 'day' || period === 'week') {
        const lpStats = calculateLPStats({
            hourlyData: lpInfo?.historicalHourlyData,
            startDate: new Date(
                lpInfo?.historicalHourlyData[0].hourStartUnix * 1000
            ),
            lpShare: new BigNumber(lpInfo.pairData.reserveUSD).toNumber(),
        });

        runningVolume = lpStats.runningVolume;
        runningPoolFees = lpStats.runningPoolFees;
        dailyLiquidity = lpStats.dailyLiquidity;
    } else {
        const lpStats = calculateLPStats({
            dailyData: lpInfo?.historicalDailyData,
            startDate: new Date(lpInfo?.historicalDailyData[0].date * 1000),
            lpShare: new BigNumber(lpInfo.pairData.reserveUSD).toNumber(),
        });

        runningVolume = lpStats.runningVolume;
        runningPoolFees = lpStats.runningPoolFees;
        dailyLiquidity = lpStats.dailyLiquidity;
    }

    // Calculate 24h and 7d stats for the pair itself
    const dailyInterval = dataPeriod === 'daily' ? 1 : 24;
    const windowMultiplier = period === 'day' ? 1 : 7;
    const numPoints = runningVolume.length;

    const lastIndex = numPoints - 1;
    let periodStartIndex = numPoints - (dailyInterval * windowMultiplier + 1);
    const prevPeriodStartIndex =
        numPoints - (dailyInterval * windowMultiplier * 2 + 1);

    const totalStats: StatsOverTime = {
        volumeUSD: new BigNumber(lpInfo.pairData.volumeUSD),
        liquidityUSD: new BigNumber(lpInfo.pairData.reserveUSD),
        feesUSD: new BigNumber(lpInfo.pairData.feesUSD as string),
    };

    if (period === 'total') {
        return { totalStats };
    } else {
        if (periodStartIndex < 0 || prevPeriodStartIndex < 0) {
            console.warn(
                `Stats data of length ${numPoints} not long enough to calculate ${period} data`
            );

            if (periodStartIndex < 0) {
                periodStartIndex = 0;
            }
        }

        const lastPeriodStats: StatsOverTime = {
            volumeUSD: runningVolume[lastIndex].minus(
                runningVolume[periodStartIndex]
            ),
            liquidityUSD: dailyLiquidity[lastIndex],
            feesUSD: runningPoolFees[lastIndex].minus(
                runningPoolFees[periodStartIndex]
            ),
        };

        if (prevPeriodStartIndex < 0) {
            return {
                totalStats,
                lastPeriodStats,
            };
        }

        const prevPeriodStats: StatsOverTime = {
            volumeUSD: runningVolume[periodStartIndex].minus(
                runningVolume[prevPeriodStartIndex]
            ),
            liquidityUSD: dailyLiquidity[periodStartIndex],
            feesUSD: runningPoolFees[periodStartIndex].minus(
                runningPoolFees[prevPeriodStartIndex]
            ),
        };

        lastPeriodStats.volumeUSDChange = lastPeriodStats.volumeUSD
            .minus(prevPeriodStats.volumeUSD)
            .div(prevPeriodStats.volumeUSD);
        lastPeriodStats.liquidityUSDChange = lastPeriodStats.liquidityUSD
            .minus(prevPeriodStats.liquidityUSD)
            .div(prevPeriodStats.liquidityUSD);
        lastPeriodStats.feesUSDChange = lastPeriodStats.feesUSD
            .minus(prevPeriodStats.feesUSD)
            .div(prevPeriodStats.feesUSD);

        return {
            totalStats,
            lastPeriodStats,
            prevPeriodStats,
        };
    }
}

export function calculatePairRankings(
    pairs: UniswapPair[]
): {
    byVolume: UniswapPair[];
    byLiquidity: UniswapPair[];
    pairs: UniswapPair[];
    pairLookups: {
        [pairId: string]: UniswapPair & {
            volumeRanking: number;
            liquidityRanking: number;
        };
    };
} {
    const byVolume = [...pairs].sort((a, b) =>
        new BigNumber(a.volumeUSD).minus(new BigNumber(b.volumeUSD)).toNumber()
    );
    const byLiquidity = [...pairs].sort((a, b) =>
        new BigNumber(b.reserveUSD)
            .minus(new BigNumber(a.reserveUSD))
            .toNumber()
    );
    const liquidityLookup: {
        [pairId: string]: UniswapPair;
    } = byLiquidity.reduce(
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
