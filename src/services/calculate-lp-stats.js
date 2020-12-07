import BigNumber from 'bignumber.js';
import Uniswap from './uniswap';

export default function calculateLPStats(pair, historicalData, lpLiquidityUSD) {
    const poolShare = new BigNumber(lpLiquidityUSD || pair.reserveUSD).div(pair.reserveUSD);
    let runningVolume = [new BigNumber(0)];
    let runningFees = [new BigNumber(0)];

    for (let dailyData of historicalData) {
        const vol = new BigNumber(dailyData.dailyVolumeUSD);
        runningVolume.push(
            runningVolume[runningVolume.length - 1].plus(vol)
        );
        runningFees.push(
            runningFees[runningFees.length - 1].plus(
                vol.times(poolShare).times(Uniswap.FEE_RATIO)
            )
        );
    }

    // Calculate return above fees
    // Calculate impermanent loss

    return {
        runningVolume,
        runningFees
    };
}