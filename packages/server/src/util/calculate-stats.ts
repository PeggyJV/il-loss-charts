import BigNumber from 'bignumber.js';
import { format } from 'date-fns';
import fs from 'fs';

import UniswapFetcher from 'services/uniswap';
import {
    UniswapPair,
    UniswapDailyData,
    UniswapHourlyData,
    LiquidityData,
    LPStats,
    MarketStats,
    UniswapLiquidityPositionAtTime,
    StatsOverTime,
} from '@sommelier/shared-types';

const FEE_RATIO = 0.003;

type HistoricalData = UniswapDailyData | UniswapHourlyData;
type HistoricalDataList = Array<UniswapDailyData[] | UniswapHourlyData[]>;
type PositionMapping = { [pairId: string]: UniswapLiquidityPositionAtTime[] };
type StatsMapping = { [pairId: string]: StatsMappingValue };

const isDailyData = (data: HistoricalData): data is UniswapDailyData =>
    Object.prototype.hasOwnProperty.call(data, 'dailyVolumeUSD');
// const isHourlyData = (data: HistoricalData): data is UniswapDailyData => Object.prototype.hasOwnProperty.call(data, 'hourlyVolumeUSD');
const isDailyDataList = (data: HistoricalData[]): data is UniswapDailyData[] =>
    Object.prototype.hasOwnProperty.call(data[0], 'dailyVolumeUSD');
const isHourlyDataList = (
    data: HistoricalData[]
): data is UniswapHourlyData[] =>
    Object.prototype.hasOwnProperty.call(data[0], 'hourlyVolumeUSD');

interface StatsMappingValue {
    historicalData: HistoricalData[];
    aggregatedStats: LPStats;
    statsWindows: LPStats[];
}

export async function calculateMarketStats(
    pairs: UniswapPair[],
    historicalData: HistoricalDataList,
    period = 'daily'
): Promise<MarketStats[]> {
    // Historical data fetches
    const { ethPrice } = await UniswapFetcher.getEthPrice();

    const calculateImpermanentLoss = (
        startDailyData: LiquidityData,
        endDailyData: LiquidityData
    ) => {
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

        return impermanentLossPct;
    };

    const marketStats = pairs.reduce(
        (acc: MarketStats[], pair: UniswapPair, index: number) => {
            const historical = historicalData[index];
            const firstDaily = historical[0];
            const lastDaily = historical[historical.length - 1];

            const pairReadable = `${pair.token0?.symbol || ''}/${pair.token1?.symbol || 's'
                }`;

            // Skip pair if no data
            // TODO smarter error handling
            if (!firstDaily || !lastDaily) {
                console.warn(
                    `Could not calculate impermanent loss for ${pairReadable}`
                );
                return acc;
            }

            const impermanentLoss = calculateImpermanentLoss(
                firstDaily,
                lastDaily
            );
            let volume;
            if (period === 'hourly') {
                volume = (historical as UniswapHourlyData[]).reduce(
                    (acc: BigNumber, h: UniswapHourlyData) =>
                        acc.plus(h.hourlyVolumeUSD),
                    new BigNumber(0)
                );
            } else {
                volume = (historical as UniswapDailyData[]).reduce(
                    (acc: BigNumber, h: UniswapDailyData) =>
                        acc.plus(h.dailyVolumeUSD),
                    new BigNumber(0)
                );
            }
            const fees = volume.times(FEE_RATIO);
            const returns = fees.plus(impermanentLoss);
            const pctReturn = returns.div(pair.reserveUSD);
            const impermanentLossGross = impermanentLoss.times(returns);

            acc.push({
                ...pair,
                ilGross: impermanentLossGross.toNumber(),
                market: pairReadable,
                impermanentLoss: impermanentLoss.toNumber(),
                volume: volume.toNumber(),
                liquidity: new BigNumber(pair.reserveUSD).toNumber(),
                returnsUSD: returns.toNumber(),
                pctReturn: pctReturn.toNumber(),
                returnsETH: returns.div(ethPrice).toNumber(),
            });
            return acc;
        },
        []
    );

    return marketStats;
}

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

export async function calculateStatsForPositions(
    positions: PositionMapping
): Promise<StatsMapping> {
    const entries = Object.entries(positions);

    const calculateUSDLiquidity = (
        position: UniswapLiquidityPositionAtTime
    ): BigNumber => {
        const tokenBalance = new BigNumber(position.liquidityTokenBalance);
        const tokenTotalSupply = new BigNumber(
            position.liquidityTokenTotalSupply
        );
        const reserveUSD = new BigNumber(position.reserveUSD);

        const lpLiquidityUSD = tokenBalance
            .div(tokenTotalSupply)
            .times(reserveUSD);
        return lpLiquidityUSD;
    };

    const statsPromises = entries.map(async ([pairId, positionSnapshots]) => {
        // Get historical daily data across the length of the position
        const startDate = new Date(positionSnapshots[0].timestamp * 1000);
        const lastSnapshot = positionSnapshots[positionSnapshots.length - 1];
        let endDate: Date;

        // TODO: Figure out if we should also fetch current stats
        // let fetchCurrent = false;

        if (new BigNumber(lastSnapshot.liquidityTokenBalance).isZero()) {
            // position is closed, so calculate up until last day
            endDate = new Date(lastSnapshot.timestamp * 1000);
        } else {
            // Position is still open, so calculate up until now
            endDate = new Date();
            // fetchCurrent = true;
        }

        // get historical data
        const historicalDailyData = await UniswapFetcher.getHistoricalDailyData(
            pairId,
            startDate,
            endDate
        );

        const sliceHistoricalData = (
            startSlice: number,
            endSlice: number
        ): HistoricalData[] => {
            if (endSlice < startSlice) {
                throw new Error(
                    `Could not slice historical data - end date is before start date`
                );
            }

            const acc: HistoricalData[] = [];

            for (const dailyData of historicalDailyData) {
                if (dailyData.date < startSlice) continue;
                else if (dailyData.date > endSlice) break;

                // This day is within the window
                acc.push(dailyData);
            }

            return acc;
        };

        // for every window between two positions, take correct slice of historical data and calculate stats
        const statsArr: LPStats[] = [];
        for (const [index, snapshot] of positionSnapshots.entries()) {
            if (index === 0) continue;

            const prevSnapshot = positionSnapshots[index - 1];

            if (new BigNumber(prevSnapshot.liquidityTokenBalance).isZero()) {
                // nothing to calculate here, since we calculate the trailing
                // window, and LP had no LP tokens in the trailing window
                continue;
            }

            let historicalDataBetween = sliceHistoricalData(
                prevSnapshot.timestamp,
                snapshot.timestamp
            );



            if (historicalDataBetween.length === 0) {
                // If within the same hour, we can't do anything with graph data
                const hourlyStartDate = new Date(prevSnapshot.timestamp * 1000);
                const hourlyEndDate = new Date(snapshot.timestamp * 1000);
                historicalDataBetween = await UniswapFetcher.getHourlyData(
                    pairId,
                    hourlyStartDate,
                    hourlyEndDate
                );

                // We can't do anything here, it's within the same hour
                // TODO: Look into augmenting subgraph for 5m increments
                // (requires connecting to cloud SQL and modifying subgraph)
                if (historicalDataBetween.length === 0) continue;
            }

            let lpStats: LPStats;
            const lpLiquidityUSD = calculateUSDLiquidity(prevSnapshot);

            // Calculate stats for historical data window
            // Get starting liquidity from previous snapshot
            if (isDailyDataList(historicalDataBetween)) {
                lpStats = calculateLPStats({
                    dailyData: historicalDataBetween,
                    lpShare: lpLiquidityUSD.toNumber(),
                    lpDate: new Date(prevSnapshot.timestamp * 1000),
                });
            } else if (isHourlyDataList(historicalDataBetween)) {
                lpStats = calculateLPStats({
                    hourlyData: historicalDataBetween,
                    lpShare: lpLiquidityUSD.toNumber(),
                    lpDate: new Date(prevSnapshot.timestamp * 1000),
                });
            } else {
                throw new Error(
                    'Could not determine if historical data is daily or hourly'
                );
            }

            statsArr.push(lpStats);
        }

        // combine all lp stats for each window into one
        const aggregatedStats = statsArr.reduce(
            (acc: LPStats, currentStats) => {
                return {
                    totalFees: acc.totalFees.plus(currentStats.totalFees),
                    runningVolume: acc.runningVolume.concat(
                        ...currentStats.runningVolume
                    ),
                    runningFees: acc.runningFees.concat(
                        ...currentStats.runningFees
                    ),
                    runningImpermanentLoss: acc.runningImpermanentLoss.concat(
                        ...currentStats.runningImpermanentLoss
                    ),
                    runningReturn: acc.runningReturn.concat(
                        ...currentStats.runningReturn
                    ),
                    impermanentLoss: acc.impermanentLoss.plus(
                        currentStats.impermanentLoss
                    ),
                    totalReturn: acc.totalReturn.plus(currentStats.totalReturn),
                    days: acc.days.concat(...currentStats.days),
                    dailyLiquidity: acc.dailyLiquidity.concat(
                        ...currentStats.dailyLiquidity
                    ),
                };
            }
        );

        console.log('RETURNING', aggregatedStats);

        return {
            historicalData: historicalDailyData,
            statsWindows: statsArr,
            aggregatedStats,
        };
    });

    // get all entries and map
    const stats = await Promise.all(statsPromises);
    console.log('THIS IS STATS', stats.length);
    fs.writeFileSync('stats.json', JSON.stringify(stats, null, 4));

    const result = entries.reduce((acc: StatsMapping, [pairId], index) => {
        // We know indices match between stats array and entriess
        const statsForPair = stats[index];

        if (!statsForPair) {
            throw new Error(
                'Could not match stats with index in positions array'
            );
        }

        acc[pairId] = statsForPair;
        return acc;
    }, {});

    return result;
}
