import BigNumber from 'bignumber.js';
import { format } from 'date-fns';

import Uniswap from './uniswap';

export default function calculateLPStats(pairData, historicalData, lpLiquidityUSD) {
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
        if (index == 0) return;

        const poolShare = new BigNumber(lpLiquidityUSD).div(dailyData.reserveUSD);

        const vol = new BigNumber(dailyData.dailyVolumeUSD);
        const dailyFees = vol.times(poolShare).times(Uniswap.FEE_RATIO);
        const dailyImpermanentLoss = calculateImpermanentLoss(historicalData[index-1], dailyData);
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