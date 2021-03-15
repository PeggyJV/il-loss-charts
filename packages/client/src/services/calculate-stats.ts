import BigNumber from 'bignumber.js';
import { format } from 'date-fns';

import {
    IUniswapPair,
    UniswapDailyData,
    UniswapHourlyData,
    ILiquidityData,
    PoolStats,
    StatsOverTime,
    TimeWindowStats,
} from '@sommelier/shared-types';

import { StatsWindow, PairPricesState } from 'types/states';

const FEE_RATIO = 0.003;

type HistoricalData = UniswapDailyData | UniswapHourlyData;
const isDailyData = (data: HistoricalData): data is UniswapDailyData =>
    Object.prototype.hasOwnProperty.call(data, 'dailyVolumeUSD');

export function calculatePoolStats({
    dailyData,
    hourlyData,
    startDate,
}: {
    dailyData?: UniswapDailyData[];
    hourlyData?: UniswapHourlyData[];
    startDate: Date;
}): PoolStats {
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
    const fullDates: Date[] = [];
    const ticks: string[] = [];

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

        let vol: BigNumber;

        if (isDailyData(dataPoint)) {
            vol = new BigNumber(dataPoint.dailyVolumeUSD);
        } else {
            vol = new BigNumber(dataPoint.hourlyVolumeUSD);
        }

        const liquidity = new BigNumber(dataPoint.reserveUSD);
        const dailyPoolFees = vol.times(FEE_RATIO);

        dailyLiquidity.push(liquidity);
        dailyVolume.push(vol);
        runningVolume.push(getPrevRunningValue(runningVolume).plus(vol));
        runningPoolFees.push(
            getPrevRunningValue(runningPoolFees).plus(dailyPoolFees)
        );

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

    return {
        timeWindow: isDailyData(historicalData[0]) ? 'daily' : 'hourly',
        dailyLiquidity,
        dailyVolume,
        runningVolume,
        runningPoolFees,
        ticks,
        fullDates,
    };
}

export function calculateTimeWindowStats(
    lpInfo: PairPricesState,
    period: StatsWindow = 'total'
): TimeWindowStats {
    let runningVolume: BigNumber[];
    let runningPoolFees: BigNumber[];
    let dailyLiquidity: BigNumber[];
    let fullDates: Date[];

    if (period === 'day' || period === 'week') {
        const lpStats = calculatePoolStats({
            hourlyData: lpInfo?.historicalHourlyData,
            startDate: new Date(
                lpInfo?.historicalHourlyData[0].hourStartUnix * 1000
            ),
        });

        runningVolume = lpStats.runningVolume;
        runningPoolFees = lpStats.runningPoolFees;
        dailyLiquidity = lpStats.dailyLiquidity;
        fullDates = lpStats.fullDates as Date[];
    } else {
        const lpStats = calculatePoolStats({
            dailyData: lpInfo?.historicalDailyData,
            startDate: new Date(lpInfo?.historicalDailyData[0].date * 1000),
        });

        runningVolume = lpStats.runningVolume;
        runningPoolFees = lpStats.runningPoolFees;
        dailyLiquidity = lpStats.dailyLiquidity;
        fullDates = lpStats.fullDates as Date[];
    }

    const totalStats: StatsOverTime = {
        volumeUSD: new BigNumber(lpInfo.pairData.volumeUSD),
        liquidityUSD: new BigNumber(lpInfo.pairData.reserveUSD),
        feesUSD: new BigNumber(lpInfo.pairData.feesUSD as string),
    };

    if (period === 'total') {
        return { totalStats };
    } else {
        const numPoints = runningVolume.length;
        const lastIndex = numPoints - 1;

        let periodStartIndex: number;
        let prevPeriodStartIndex: number;

        if (period === 'day') {
            const oneDayMs = 60 * 60 * 24 * 1000;
            const oneDayAgo = Date.now() - oneDayMs;
            const twoDaysAgo = Date.now() - oneDayMs * 2;

            periodStartIndex = fullDates.findIndex(
                (d) => Math.abs(d.getTime() - oneDayAgo) <= 1000 * 60 * 60
            );
            prevPeriodStartIndex = fullDates.findIndex(
                (d) => Math.abs(d.getTime() - twoDaysAgo) <= 1000 * 60 * 60
            );
        } else {
            const oneWeekMs = 60 * 60 * 24 * 1000 * 7;
            const oneWeekAgo = Date.now() - oneWeekMs;
            const twoWeeksAgo = Date.now() - oneWeekMs * 2;

            periodStartIndex = fullDates.findIndex(
                (d) => Math.abs(d.getTime() - oneWeekAgo) <= 1000 * 60 * 60
            );
            prevPeriodStartIndex = fullDates.findIndex(
                (d) => Math.abs(d.getTime() - twoWeeksAgo) <= 1000 * 60 * 60
            );
        }

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
    pairs: IUniswapPair[]
): {
    byVolume: IUniswapPair[];
    byLiquidity: IUniswapPair[];
    pairs: IUniswapPair[];
    pairLookups: {
        [pairId: string]: IUniswapPair & {
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
        [pairId: string]: IUniswapPair;
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
