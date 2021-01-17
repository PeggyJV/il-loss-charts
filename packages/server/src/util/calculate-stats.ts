import BigNumber from 'bignumber.js';
import { format } from 'date-fns';

import UniswapFetcher from 'services/uniswap';
import {
    UniswapPair,
    UniswapDailyData,
    UniswapHourlyData,
    LiquidityData,
    LPStats,
    MarketStats,
    UniswapLiquidityPositionAtTime,
} from '@sommelier/shared-types';

const FEE_RATIO = 0.003;

type HistoricalData = Array<UniswapDailyData | UniswapHourlyData>;
type HistoricalDataList = Array<HistoricalData>;
type PositionMapping = { [pairId: string]: UniswapLiquidityPositionAtTime[] };
type StatsMapping = { [pairId: string]: StatsMappingValue };

interface StatsMappingValue {
    historicalData: HistoricalData;
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

            const pairReadable = `${pair.token0?.symbol || ''}/${
                pair.token1?.symbol || 's'
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

export function calculateLPStats(
    finalLiquidityData: LiquidityData,
    historicalData: HistoricalData,
    lpLiquidityUSD: number
): LPStats {
    if (historicalData.length === 0)
        throw new Error(`Did not receive historical data`);

    const firstDaily = historicalData[0];

    const runningVolume = [new BigNumber(0)];
    const runningFees = [new BigNumber(0)];
    const runningImpermanentLoss = [new BigNumber(0)];
    const runningReturn = [new BigNumber(0)];
    const days = [format(new Date(firstDaily.date * 1000), 'MMM d')];

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
        const impermanentLoss = impermanentLossPct.times(lpLiquidityUSD);

        return impermanentLoss;
    };

    historicalData.forEach((dailyData, index) => {
        if (index === 0) return;

        const poolShare = new BigNumber(lpLiquidityUSD).div(
            dailyData.reserveUSD
        );

        const vol = new BigNumber(dailyData.dailyVolumeUSD);
        const dailyFees = vol.times(poolShare).times(FEE_RATIO);
        const dailyImpermanentLoss = calculateImpermanentLoss(
            historicalData[index - 1],
            dailyData
        );
        const dailyReturn = dailyFees.plus(dailyImpermanentLoss);

        runningVolume.push(runningVolume[runningVolume.length - 1].plus(vol));
        runningFees.push(runningFees[runningFees.length - 1].plus(dailyFees));
        runningImpermanentLoss.push(
            runningImpermanentLoss[runningImpermanentLoss.length - 1].plus(
                dailyImpermanentLoss
            )
        );
        runningReturn.push(
            runningReturn[runningReturn.length - 1].plus(dailyReturn)
        );

        days.push(format(new Date(dailyData.date * 1000), 'MMM d'));
    });

    const totalFees = runningFees[runningFees.length - 1];
    const impermanentLoss = calculateImpermanentLoss(
        firstDaily,
        finalLiquidityData
    );
    const totalReturn = totalFees.plus(impermanentLoss);

    return {
        totalFees,
        runningVolume,
        runningFees,
        runningImpermanentLoss,
        runningReturn,
        impermanentLoss,
        totalReturn,
        days,
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

        // TODO: Figure out if we should also fetch urrent stats
        // let fetchCurrent = false;

        if (parseInt(lastSnapshot.liquidityTokenBalance, 10) === 0) {
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
        ): HistoricalData => {
            if (endSlice < startSlice) {
                throw new Error(
                    `Could not slice historical data - end date is before start date`
                );
            }

            const acc: HistoricalData = [];

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
            if (index === 0) return;

            const prevSnapshot = positionSnapshots[index - 1];

            if (parseInt(prevSnapshot.liquidityTokenBalance, 10) === 0) {
                // nothing to calculate here, since we calculate the trailing
                // window, and LP had no LP tokens in the trailing window
                return;
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

            // Calculate stats for historical data window
            // Get starting liquidity from previous snapshot
            const lpLiquidityUSD = calculateUSDLiquidity(prevSnapshot);
            const lpStats = calculateLPStats(
                historicalDataBetween[historicalDataBetween.length - 1],
                historicalDataBetween,
                lpLiquidityUSD
            );
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
                };
            }
        );

        return {
            historicalData: historicalDailyData,
            statsWindows: statsArr,
            aggregatedStats,
        };
    });

    // get all entries and map
    const stats = await Promise.all(statsPromises);
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
