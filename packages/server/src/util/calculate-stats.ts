import BigNumber from 'bignumber.js';
import { format } from 'date-fns';

import UniswapFetcher, { UniswapPair, UniswapDailyData, UniswapHourlyData, LiquidityData } from 'services/uniswap';

const FEE_RATIO = 0.003;

export interface LPStats {
    totalFees: BigNumber;
    runningVolume: BigNumber[];
    runningFees: BigNumber[];
    runningImpermanentLoss: BigNumber[];
    runningReturn: BigNumber[];
    impermanentLoss: BigNumber;
    totalReturn: BigNumber;
    days: string[];
}

<<<<<<< HEAD
export async function calculateMarketStats(pairs, historicalData, period = 'daily') {
=======
export interface MarketStats extends UniswapPair {
    ilGross: number;
    market: string;
    impermanentLoss: number;
    volume: number;
    liquidity: number;
    returnsUSD: number;
    returnsETH: number;
}

// export async function calculateMarketStats(pairs, startDate, endDate) {
type historicalDataParam = Array<UniswapDailyData[] | UniswapHourlyData[]>

export async function calculateMarketStats(pairs: UniswapPair[], historicalData: historicalDataParam, period = 'daily'): Promise<MarketStats[]> {
>>>>>>> get ts working
    // Historical data fetches
    const { ethPrice } = await UniswapFetcher.getEthPrice();

    const calculateImpermanentLoss = (startDailyData: LiquidityData, endDailyData: LiquidityData) => {
        const initialExchangeRate = new BigNumber(startDailyData.reserve0).div(new BigNumber(startDailyData.reserve1));
        const currentExchangeRate = new BigNumber(endDailyData.reserve0).div(new BigNumber(endDailyData.reserve1));
        const priceRatio = currentExchangeRate.div(initialExchangeRate);
        const impermanentLossPct = new BigNumber(2).times(priceRatio.sqrt()).div(priceRatio.plus(1)).minus(1);

        return impermanentLossPct;
    }

    const marketStats = pairs.reduce((acc: MarketStats[], pair: UniswapPair, index: number) => {
        const historical = historicalData[index];
        const firstDaily = historical[0];
        const lastDaily = historical[historical.length - 1];

        // Skip pair if no data
        // TODO smarter error handling
        if (!firstDaily || !lastDaily) {
            console.warn(`Could not calculate impermanent loss for ${pair.token0.symbol}/${pair.token1.symbol}`);
            return acc;
        }

        const impermanentLoss = calculateImpermanentLoss(firstDaily, lastDaily);
        let volume;
        if (period === 'hourly') {
            volume = (historical as UniswapHourlyData[]).reduce((acc: BigNumber, h: UniswapHourlyData) => acc.plus(h.hourlyVolumeUSD), new BigNumber(0));
        } else {
            volume = (historical as UniswapDailyData[]).reduce((acc: BigNumber, h: UniswapDailyData) => acc.plus(h.dailyVolumeUSD), new BigNumber(0));
        }
        const fees = volume.times(FEE_RATIO);
        const returns = fees.plus(impermanentLoss);
        const pctReturn = returns.div(pair.reserveUSD);
        const impermanentLossGross = impermanentLoss.times(returns);

        acc.push({
            ...pair,
            ilGross: impermanentLossGross.toNumber(),
            market: `${pair.token0.symbol}/${pair.token1.symbol}`,
            impermanentLoss: impermanentLoss.toNumber(),
            volume: volume.toNumber(),
            liquidity: new BigNumber(pair.reserveUSD).toNumber(),
            returnsUSD: returns.toNumber(),
            pctReturn: pctReturn.toNumber(),
            returnsETH: returns.div(ethPrice).toNumber(),
        });
        return acc;
    }, []);

    return marketStats;
}

export function calculateLPStats(pairData: UniswapPair, historicalData: UniswapDailyData[], lpLiquidityUSD: number): LPStats {
    if (historicalData.length === 0) throw new Error(`Did not receive historical data`);

    const firstDaily = historicalData[0];

    const runningVolume = [new BigNumber(0)];
    const runningFees = [new BigNumber(0)];
    const runningImpermanentLoss = [new BigNumber(0)];
    const runningReturn = [new BigNumber(0)];
    const days = [format(new Date(firstDaily.date * 1000), 'MMM d')];


    const calculateImpermanentLoss = (startDailyData: LiquidityData, endDailyData: LiquidityData) => {
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