import BigNumber from 'bignumber.js';
import { format } from 'date-fns';

import UniswapFetcher from 'services/uniswap';


const FEE_RATIO = 0.003;

export type LPStats = {
    totalFees: BigNumber,
    runningVolume: BigNumber[],
    runningFees: BigNumber[],
    runningImpermanentLoss: BigNumber[]
    runningReturn: BigNumber[],
    impermanentLoss: BigNumber,
    totalReturn: BigNumber,
    days: string[]
};

export async function calculateMarketStats(pairs, startDate, endDate) {
    // Historical data fetches
    // const pairsByLiq = [...pairs].sort((a, b) => parseInt(b.reserveUSD, 10) - parseInt(a.reserveUSD, 10)).slice(0, 25);
    const pairsByVol = pairs.slice(0, 25);

    // TODO: Save requests by only fetching first and last day
    const historicalFetches = pairsByVol.map((pair) => UniswapFetcher.getHistoricalDailyData(pair.id, startDate, endDate));

    const calculateImpermanentLoss = (startDailyData, endDailyData) => {
        const initialExchangeRate = new BigNumber(startDailyData.reserve0).div(new BigNumber(startDailyData.reserve1));
        const currentExchangeRate = new BigNumber(endDailyData.reserve0).div(new BigNumber(endDailyData.reserve1));
        const priceRatio = currentExchangeRate.div(initialExchangeRate);
        const impermanentLossPct = new BigNumber(2).times(priceRatio.sqrt()).div(priceRatio.plus(1)).minus(1);

        return impermanentLossPct;
    }

    const historicalData: any[] = await Promise.all(historicalFetches);

    const marketStats = pairsByVol.reduce((acc, pair, index) => {
        const historical = historicalData[index];
        const firstDaily = historical[0];
        const lastDaily = historical[historical.length - 1];
        const impermanentLoss = calculateImpermanentLoss(firstDaily, lastDaily);
        const volume = historical.reduce((acc, h) => acc.plus(h.dailyVolumeUSD), new BigNumber(0));
        const fees = volume.times(FEE_RATIO);
        const returns = fees.plus(impermanentLoss);
        const impermanentLossGross = impermanentLoss.times(returns);

        acc.push({
            ...pair,
            ilGross: impermanentLossGross.toNumber(),
            market: `${pair.token0.symbol}/${pair.token1.symbol}`,
            impermanentLoss: impermanentLoss.toFixed(5),
            volume: volume.toFixed(5),
            liquidity: pair.reserveUSD,
            returnsUSD: returns.toFixed(5)
        });
        return acc;
    }, []);


    // const historicalData = {};
    // for (const pair of pairs) {
    //     console.log('FETCHING PAIR ID', pair.id);
    //     const pairHistorical = await UniswapFetcher.getHistoricalDailyData(pair.id, startDate, endDate);
    //     historicalData[pair.id] = pairHistorical;
    // }
    return marketStats;

}

export function calculateLPStats(pairData, historicalData, lpLiquidityUSD) {
    if (historicalData.length === 0) return {};

    const firstDaily = historicalData[0];

    const runningVolume = [new BigNumber(0)];
    const runningFees = [new BigNumber(0)];
    const runningImpermanentLoss = [new BigNumber(0)];
    const runningReturn = [new BigNumber(0)];
    const days = [format(new Date(firstDaily.date * 1000), 'MMM d')];


    const calculateImpermanentLoss = (startDailyData, endDailyData) => {
        const initialExchangeRate = new BigNumber(startDailyData.reserve0).div(new BigNumber(startDailyData.reserve1));
        const currentExchangeRate = new BigNumber(endDailyData.reserve0).div(new BigNumber(endDailyData.reserve1));
        const priceRatio = currentExchangeRate.div(initialExchangeRate);
        const impermanentLossPct = new BigNumber(2).times(priceRatio.sqrt()).div(priceRatio.plus(1)).minus(1);
        const impermanentLoss = impermanentLossPct.times(lpLiquidityUSD);

        return impermanentLoss;
    }

    historicalData.forEach((dailyData, index) => {
        if (index === 0) return;

        const poolShare = new BigNumber(lpLiquidityUSD).div(dailyData.reserveUSD);

        const vol = new BigNumber(dailyData.dailyVolumeUSD);
        const dailyFees = vol.times(poolShare).times(FEE_RATIO);
        const dailyImpermanentLoss = calculateImpermanentLoss(historicalData[index - 1], dailyData);
        const dailyReturn = dailyFees.plus(dailyImpermanentLoss);

        runningVolume.push(
            runningVolume[runningVolume.length - 1].plus(vol)
        );
        runningFees.push(
            runningFees[runningFees.length - 1].plus(
                dailyFees
            )
        );
        runningImpermanentLoss.push(
            runningImpermanentLoss[runningImpermanentLoss.length - 1].plus(
                dailyImpermanentLoss
            )
        );
        runningReturn.push(
            runningReturn[runningReturn.length - 1].plus(
                dailyReturn
            )
        );

        days.push(format(new Date(dailyData.date * 1000), 'MMM d'))
    })

    const totalFees = runningFees[runningFees.length - 1];
    const impermanentLoss = calculateImpermanentLoss(firstDaily, pairData);
    const totalReturn = totalFees.plus(impermanentLoss);

    return {
        totalFees,
        runningVolume,
        runningFees,
        runningImpermanentLoss,
        runningReturn,
        impermanentLoss,
        totalReturn,
        days
    };
}