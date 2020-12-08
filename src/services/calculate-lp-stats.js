import BigNumber from 'bignumber.js';
import Uniswap from './uniswap';

export default function calculateLPStats(pairData, historicalData, lpLiquidityUSD) {
    if (historicalData.length === 0) return {};

    const firstDaily = historicalData[0];

    const runningVolume = [new BigNumber(0)];
    const runningFees = [new BigNumber(0)];
    const runningImpermanentLoss = [new BigNumber(0)];
    const runningReturn = [new BigNumber(0)];

    const initialExchangeRate = new BigNumber(firstDaily.reserve0).div(new BigNumber(firstDaily.reserve1));

    const calculateImpermanentLoss = (dailyData) => {
        const currentExchangeRate = new BigNumber(dailyData.reserve0).div(new BigNumber(dailyData.reserve1));
        const priceRatio = currentExchangeRate.div(initialExchangeRate);
        const impermanentLossPct = new BigNumber(2).times(priceRatio.sqrt()).div(priceRatio.plus(1)).minus(1);
        const impermanentLoss = impermanentLossPct.times(lpLiquidityUSD);

        return impermanentLoss;
    }

    for (let dailyData of historicalData.slice(1)) {
        const poolShare = new BigNumber(lpLiquidityUSD).div(dailyData.reserveUSD);

        const vol = new BigNumber(dailyData.dailyVolumeUSD);
        const dailyFees = vol.times(poolShare).times(Uniswap.FEE_RATIO);
        const dailyImpermanentLoss = calculateImpermanentLoss(dailyData);
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
    }

    const totalFees = runningFees[runningFees.length - 1];
    const impermanentLoss = calculateImpermanentLoss(pairData);
    const totalReturn = totalFees.plus(impermanentLoss);

    return {
        totalFees,
        runningVolume,
        runningFees,
        runningImpermanentLoss,
        runningReturn,
        impermanentLoss,
        totalReturn
    };
}