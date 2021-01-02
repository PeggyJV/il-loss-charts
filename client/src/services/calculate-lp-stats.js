import BigNumber from 'bignumber.js';
import { format } from 'date-fns';

import Uniswap from './uniswap';

export function calculateLPStats({ pairData, historicalData, lpShare: lpLiquidityUSD, lpDate }) {
    if (historicalData.length === 0) return {};

    const runningVolume = [];
    const runningFees = [];
    const runningImpermanentLoss = [];
    const runningReturn = [];
    const days = [];

    const calculateImpermanentLoss = (startDailyData, endDailyData) => {
        const initialExchangeRate = new BigNumber(startDailyData.reserve0).div(new BigNumber(startDailyData.reserve1));
        const currentExchangeRate = new BigNumber(endDailyData.reserve0).div(new BigNumber(endDailyData.reserve1));
        const priceRatio = currentExchangeRate.div(initialExchangeRate);
        const impermanentLossPct = new BigNumber(2).times(priceRatio.sqrt()).div(priceRatio.plus(1)).minus(1);
        const impermanentLoss = impermanentLossPct.times(lpLiquidityUSD);

        return impermanentLoss;
    }

    let firstDaily = null;
    historicalData.forEach((dailyData, index) => {
        if (index === 0) return;

        // Ignore if below lp date
        const currentDate = new Date(dailyData.date * 1000);
        if (currentDate.getTime() < lpDate.getTime()) return;
        if (!firstDaily) firstDaily = dailyData;

        const poolShare = new BigNumber(lpLiquidityUSD).div(dailyData.reserveUSD);

        const vol = new BigNumber(dailyData.dailyVolumeUSD);
        const dailyFees = vol.times(poolShare).times(Uniswap.FEE_RATIO);
        const dailyImpermanentLoss = calculateImpermanentLoss(historicalData[index - 1], dailyData);
        const dailyReturn = dailyFees.plus(dailyImpermanentLoss);

        runningVolume.push(
            (runningVolume[runningVolume.length - 1] ?? new BigNumber(0)).plus(vol)
        );
        runningFees.push(
            (runningFees[runningFees.length - 1] ?? new BigNumber(0)).plus(
                dailyFees
            )
        );
        runningImpermanentLoss.push(
            (runningImpermanentLoss[runningImpermanentLoss.length - 1] ?? new BigNumber(0)).plus(
                dailyImpermanentLoss
            )
        );
        runningReturn.push(
            (runningReturn[runningReturn.length - 1] ?? new BigNumber(0)).plus(
                dailyReturn
            )
        );

        days.push(format(currentDate, 'MMM d'));
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

export function calculatePairRankings(pairs) {
    const byVolume = [...pairs].sort((a, b) => new BigNumber(a.volumeUSD).minus(new BigNumber(b.volumeUSD)).toNumber());
    const byLiquidity = [...pairs].sort((a, b) => new BigNumber(b.reserveUSD).minus(new BigNumber(a.reserveUSD)).toNumber());
    const liquidityLookup = byLiquidity.reduce((acc, pair, index) => ({ ...acc, [pair.id]: index + 1 }), {});

    const pairLookups = pairs.reduce((acc, pair, index) => ({
        ...acc,
        [pair.id]: {
            ...pair,
            volumeRanking: parseInt(index, 10) + 1,
            liquidityRanking: liquidityLookup[pair.id]
        }
    }), {});

    return {
        byVolume,
        byLiquidity,
        pairs,
        pairLookups
    };
}