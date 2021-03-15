import BigNumber from 'bignumber.js';
import { format } from 'date-fns';

import UniswapFetcher from 'services/uniswap';
import EthBlockFetcher from 'services/eth-blocks';
import {
    UniswapPair,
    IUniswapPair,
    UniswapDailyData,
    UniswapHourlyData,
    ILiquidityData,
    LPStats,
    MarketStats,
    UniswapLiquidityPositionAtTime,
    StatsOverTime,
} from '@sommelier/shared-types';

import redis from 'util/redis';
import { wrapWithCache } from 'util/redis-data-cache';

const FEE_RATIO = 0.003;

type HistoricalData = UniswapDailyData | UniswapHourlyData;
type HistoricalDataList = Array<
    UniswapDailyData[] | UniswapHourlyData[] | IUniswapPair[]
>;
type PositionMapping = { [pairId: string]: UniswapLiquidityPositionAtTime[] };
type StatsMapping = { [pairId: string]: StatsMappingValue };

const isDailyData = (data: HistoricalData): data is UniswapDailyData =>
    Object.prototype.hasOwnProperty.call(data, 'dailyVolumeUSD');
// const isHourlyData = (fdata: HistoricalData): data is UniswapDailyData => Object.prototype.hasOwnProperty.call(data, 'hourlyVolumeUSD');
const isDailyDataList = (data: HistoricalData[]): data is UniswapDailyData[] =>
    Object.prototype.hasOwnProperty.call(data[0], 'dailyVolumeUSD');
const isHourlyDataList = (
    data: HistoricalData[]
): data is UniswapHourlyData[] =>
    Object.prototype.hasOwnProperty.call(data[0], 'hourlyVolumeUSD');

const getEthPrice = wrapWithCache(redis, UniswapFetcher.getEthPrice, 3600 * 24, true);
const getBlockAtTime = wrapWithCache(
    redis,
    EthBlockFetcher.getFirstBlockAfter,
    10000,
    false
);

async function getEthPriceAtTime(date: Date): Promise<BigNumber> {
    const { number: blockNumber } = await getBlockAtTime(date);
    const { ethPrice } = await getEthPrice(blockNumber);

    return new BigNumber(ethPrice);
}

interface StatsMappingValue {
    historicalData: HistoricalData[];
    aggregatedStats: LPStats;
    statsWindows: LPStats[];
}

export async function calculateMarketStats(
    pairs: IUniswapPair[],
    historicalData: HistoricalDataList,
    period: 'daily' | 'hourly' | 'delta' = 'daily'
): Promise<MarketStats[]> {
    // Historical data fetches
    const { ethPrice } = await UniswapFetcher.getEthPrice();

    const calculateImpermanentLoss = (
        startDailyData: ILiquidityData,
        endDailyData: ILiquidityData
    ) => {
        const startReserve0 = new BigNumber(startDailyData.reserve0);
        const startReserve1 = new BigNumber(startDailyData.reserve1);
        const endReserve0 = new BigNumber(endDailyData.reserve0);
        const endReserve1 = new BigNumber(endDailyData.reserve1);

        let initialExchangeRate: BigNumber;
        let currentExchangeRate: BigNumber;

        // Only need to check one reserve, since if one is funded the other must be
        if (startReserve0.eq(0)) {
            initialExchangeRate = new BigNumber(1);
        } else {
            initialExchangeRate = startReserve0.div(startReserve1);
        }

        if (endReserve0.eq(0)) {
            currentExchangeRate = new BigNumber(1);
        } else {
            currentExchangeRate = endReserve0.div(endReserve1);
        }

        const priceRatio = currentExchangeRate.div(initialExchangeRate);
        const impermanentLossPct = new BigNumber(2)
            .times(priceRatio.sqrt())
            .div(priceRatio.plus(1))
            .minus(1);

        return impermanentLossPct;
    };

    const marketStats = pairs.reduce(
        (acc: MarketStats[], pairData: IUniswapPair, index: number) => {
            const pair = new UniswapPair(pairData);
            const historical = historicalData[index];

            const firstDaily = historical[0];
            const lastDaily = historical[historical.length - 1];

            const { pairReadable } = pair;

            // Skip pair if no data
            // TODO smarter error handling
            if (!firstDaily || !lastDaily) {
                console.warn(
                    `Could not calculate impermanent loss for ${pairReadable}`
                );
                return acc;
            }

            if (period === 'delta' && historical.length > 2) {
                console.warn(
                    `Received more than two historical data points for a delta calculation on ${pairReadable}`
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
            } else if (period === 'daily') {
                volume = (historical as UniswapDailyData[]).reduce(
                    (acc: BigNumber, h: UniswapDailyData) =>
                        acc.plus(h.dailyVolumeUSD),
                    new BigNumber(0)
                );
            } else {
                volume = new BigNumber(
                    (lastDaily as IUniswapPair).volumeUSD
                ).minus((firstDaily as IUniswapPair).volumeUSD);
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

export async function calculateLPStats({
    pairData,
    dailyData,
    hourlyData,
    lpShare: lpLiquidityUSD,
    lpDate,
}: {
    pairData: IUniswapPair;
    dailyData?: UniswapDailyData[];
    hourlyData?: UniswapHourlyData[];
    lpShare: number;
    lpDate: Date;
}): Promise<LPStats> {
    if (dailyData && hourlyData) {
        throw new Error('Should only receive one of daily or hourly data');
    }

    const historicalData: HistoricalData[] | undefined =
        dailyData ?? hourlyData;

    if (!historicalData) {
        throw new Error('Did not receive daily or hourly data');
    }

    const pair = pairData && new UniswapPair(pairData);

    const dailyLiquidity: BigNumber[] = [];
    const dailyVolume: BigNumber[] = [];
    const dailyEthPrice: BigNumber[] = [];
    const runningVolume: BigNumber[] = [];
    const runningPoolFees: BigNumber[] = [];
    const runningFees: BigNumber[] = [];
    const runningImpermanentLoss: BigNumber[] = [];
    const runningNotionalGain: BigNumber[] = [];
    const runningReturn: BigNumber[] = [];
    const fullDates: Date[] = [];
    const ticks: string[] = [];

    const calculateImpermanentLoss = (
        startDailyData: ILiquidityData,
        endDailyData: ILiquidityData,
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

    const calculateNotionalGain = async (
        startDailyData: HistoricalData,
        endDailyData: HistoricalData,
        lpLiquidity: number
    ): Promise<BigNumber> => {
        let startDate: Date;

        if (isDailyData(startDailyData)) {
            startDate = new Date(startDailyData.date * 1000);
        } else {
            startDate = new Date(startDailyData.hourStartUnix * 1000);
        }

        const initialEthPrice = await getEthPriceAtTime(startDate);
        const initialExchangeRate = new BigNumber(startDailyData.reserve0).div(
            new BigNumber(startDailyData.reserve1)
        );

        let initialToken0Price: BigNumber;
        let initialToken1Price: BigNumber;
        if (pair.symbols[0] === 'ETH' || pair.symbols[0] === 'WETH') {
            initialToken0Price = initialEthPrice;
            initialToken1Price = initialEthPrice.times(initialExchangeRate);
        } else if (pair.symbols[1] === 'ETH' || pair.symbols[1] === 'WETH') {
            initialToken0Price = initialEthPrice.times(initialExchangeRate.pow(-1));
            initialToken1Price = initialEthPrice;
        } else {
            throw new Error(`Trying to compute notional gain for non-floating pair: ${pair.symbols.join('/')}`);
        }

        let endDate: Date;

        if (isDailyData(endDailyData)) {
            endDate = new Date(endDailyData.date * 1000);
        } else {
            endDate = new Date(endDailyData.hourStartUnix * 1000);
        }

        const currentEthPrice = await getEthPriceAtTime(endDate);
        const currentExchangeRate = new BigNumber(endDailyData.reserve0).div(
            new BigNumber(endDailyData.reserve1)
        );

        let currentToken0Price: BigNumber;
        let currentToken1Price: BigNumber;
        if (pair.symbols[0] === 'ETH' || pair.symbols[0] === 'WETH') {
            currentToken0Price = currentEthPrice;
            currentToken1Price = currentEthPrice.times(currentExchangeRate);
        } else if (pair.symbols[1] === 'ETH' || pair.symbols[1] === 'WETH') {
            currentToken0Price = currentEthPrice.times(currentExchangeRate.pow(-1));
            currentToken1Price = currentEthPrice;
        } else {
            throw new Error(`Trying to compute notional gain for non-floating pair: ${pair.symbols.join('/')}`);
        }

        // Calculate gross gains based on liquidity
        // Return sum of token0 and token1 gain
        const token0PctGain = currentToken0Price.minus(initialToken0Price).div(initialToken0Price);
        const token1PctGain = currentToken1Price.minus(initialToken1Price).div(initialToken1Price);

        const lpLiquidityForSide = new BigNumber(lpLiquidity).div(2);
        const token0Gain = token0PctGain.times(lpLiquidityForSide);
        const token1Gain = token1PctGain.times(lpLiquidityForSide);

        return token0Gain.plus(token1Gain);
    };

    const getPrevRunningValue = (list: BigNumber[]): BigNumber =>
        list.length ? list[list.length - 1] : new BigNumber(0);
    let firstDaily: HistoricalData | null = null;

    for (const dataPoint of historicalData) {
        let currentDate: Date;

        if (isDailyData(dataPoint)) {
            currentDate = new Date(dataPoint.date * 1000);
        } else {
            currentDate = new Date(dataPoint.hourStartUnix * 1000);
        }

        // Ignore if below lp date
        if (currentDate.getTime() < lpDate.getTime()) continue;
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
        let dailyReturn = newRunningFees.plus(dailyImpermanentLoss);

        if (pair.isEthPair) {
            const ethPrice = await getEthPriceAtTime(currentDate);
            dailyEthPrice.push(ethPrice);
    
            // For notional gain - find which side is ETH
            // Compare eth price against price ratio to get other pair price
            // Calculate gains in both pairs
            const notionalGain = await calculateNotionalGain(firstDaily, dataPoint, lpLiquidityUSD);
            runningNotionalGain.push(notionalGain);
    
            dailyReturn = dailyReturn.plus(notionalGain);
        } else {
            runningNotionalGain.push(new BigNumber(0));
        }

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
        ticks.push(format(currentDate, 'MMM d'));
    }

    if (!firstDaily) {
        throw new Error('No provided historical data after LP date');
    }

    const totalFees = runningFees[runningFees.length - 1];
    const impermanentLoss = calculateImpermanentLoss(
        firstDaily,
        historicalData[historicalData.length - 1],
        lpLiquidityUSD
    );
    const totalNotionalGain = runningNotionalGain[runningNotionalGain.length - 1];
    const totalReturn = totalFees.plus(totalNotionalGain).plus(impermanentLoss);

    // If no pair data, just return LP stats
    return {
        timeWindow: isDailyData(historicalData[0]) ? 'daily' : 'hourly',
        dailyLiquidity,
        dailyVolume,
        dailyEthPrice,
        totalFees,
        runningVolume,
        runningFees,
        runningPoolFees,
        runningImpermanentLoss,
        runningNotionalGain,
        totalNotionalGain,
        runningReturn,
        impermanentLoss,
        totalReturn,
        ticks,
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

        const oneDayMs = 24 * 60 * 60 * 1000;
        const startDateDayStart = new Date(
            Math.floor(startDate.getTime() / oneDayMs) * oneDayMs - oneDayMs
        );

        const lastSnapshot = positionSnapshots[positionSnapshots.length - 1];
        let endDate: Date;

        // TODO: Figure out if we should also fetch current stats
        let fetchCurrent = false;

        if (new BigNumber(lastSnapshot.liquidityTokenBalance).isZero()) {
            // position is closed, so calculate up until last day
            endDate = new Date(lastSnapshot.timestamp * 1000);
        } else {
            // Position is still open, so calculate up until now
            endDate = new Date();
            fetchCurrent = true;
        }

        const endDateDayEnd = new Date(
            Math.ceil(endDate.getTime() / oneDayMs) * oneDayMs + 1000
        );

        // get historical data
        const historicalDailyData = await UniswapFetcher.getHistoricalDailyData(
            pairId,
            startDateDayStart,
            endDateDayEnd
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

            if (historicalDataBetween.length < 7) {
                // If within the same week, it makes more sense to get higher resolution
                // So try to get hourlies - if within the same hour, we can't get data
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
                lpStats = await calculateLPStats({
                    pairData: snapshot.pair as IUniswapPair,
                    dailyData: historicalDataBetween,
                    lpShare: lpLiquidityUSD.toNumber(),
                    lpDate: new Date(prevSnapshot.timestamp * 1000),
                });
            } else if (isHourlyDataList(historicalDataBetween)) {
                lpStats = await calculateLPStats({
                    pairData: snapshot.pair as IUniswapPair,
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

        if (fetchCurrent) {
            const prevSnapshot =
                positionSnapshots[positionSnapshots.length - 1];

            // also calculate final window until now
            let historicalDataBetween = sliceHistoricalData(
                prevSnapshot.timestamp,
                Math.floor(endDateDayEnd.getTime() / 1000)
            );

            if (historicalDataBetween.length < 7) {
                // If within the same week, we should try to get hourlies
                // So try to get hourlies - if within the same hour, we can't get data
                const oneHourMs = 60 * 60 * 1000;

                const hourlyStartDate = new Date(prevSnapshot.timestamp * 1000);
                const startDateHourStart = new Date(
                    Math.floor(hourlyStartDate.getTime() / oneHourMs) * oneHourMs
                );
                const endDateHourEnd = new Date(
                    Math.ceil(endDate.getTime() / oneHourMs) * oneHourMs
                );
                historicalDataBetween = await UniswapFetcher.getHourlyData(
                    pairId,
                    startDateHourStart,
                    endDateHourEnd
                );

                // We can't do anything here, it's within the same hour
                // TODO: Look into augmenting subgraph for 5m increments
                // (requires connecting to cloud SQL and modifying subgraph)
            }

            if (historicalDataBetween.length > 1) {
                let lpStats: LPStats;
                const lpLiquidityUSD = calculateUSDLiquidity(prevSnapshot);

                // Calculate stats for historical data window
                // Get starting liquidity from previous snapshot
                if (isDailyDataList(historicalDataBetween)) {
                    lpStats = await calculateLPStats({
                        pairData: prevSnapshot.pair as IUniswapPair,
                        dailyData: historicalDataBetween,
                        lpShare: lpLiquidityUSD.toNumber(),
                        lpDate: new Date(prevSnapshot.timestamp * 1000),
                    });
                } else if (isHourlyDataList(historicalDataBetween)) {
                    lpStats = await calculateLPStats({
                        pairData: prevSnapshot.pair as IUniswapPair,
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
        }

        let aggregatedStats: LPStats;

        if (statsArr.length < 2) {
            aggregatedStats = statsArr[0];
        } else {
            // combine all lp stats for each window into one
            aggregatedStats = statsArr.reduce((acc: LPStats, currentStats) => {
                const stats: LPStats = {
                    timeWindow: acc.timeWindow,
                    totalFees: acc.totalFees.plus(currentStats.totalFees),
                    totalNotionalGain: acc.totalNotionalGain.plus(currentStats.totalNotionalGain),
                    dailyVolume: acc.dailyVolume.concat(
                        ...currentStats.dailyVolume
                    ),
                    dailyEthPrice: acc.dailyEthPrice.concat(
                        ...currentStats.dailyEthPrice
                    ),
                    runningVolume: acc.runningVolume.concat(
                        ...currentStats.runningVolume
                    ),
                    runningFees: acc.runningFees.concat(
                        ...currentStats.runningFees
                    ),
                    runningPoolFees: acc.runningPoolFees.concat(
                        ...currentStats.runningPoolFees
                    ),
                    runningImpermanentLoss: acc.runningImpermanentLoss.concat(
                        ...currentStats.runningImpermanentLoss
                    ),
                    runningNotionalGain: acc.runningNotionalGain.concat(
                        ...currentStats.runningNotionalGain
                    ),
                    runningReturn: acc.runningReturn.concat(
                        ...currentStats.runningReturn
                    ),
                    impermanentLoss: acc.impermanentLoss.plus(
                        currentStats.impermanentLoss
                    ),
                    totalReturn: acc.totalReturn.plus(currentStats.totalReturn),
                    ticks: acc.ticks.concat(...currentStats.ticks),
                    dailyLiquidity: acc.dailyLiquidity.concat(
                        ...currentStats.dailyLiquidity
                    ),
                };

                if (acc.fullDates && currentStats.fullDates) {
                    stats.fullDates = acc.fullDates.concat(
                        ...currentStats.fullDates
                    );
                }

                return stats;
            });
        }

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
