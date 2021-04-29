import { LiquidityBound } from '@sommelier/shared-types';
import { DexTrade } from 'services/bitquery/generated-types';

export function getAllIndicators(marketData: DexTrade[]): { [key: indicatorName]: LiquidityBound } {
    return {
        bollinger: getBollingerBands(marketData),
        rsi: getRSILevels(marketData)
    }
}

export function getBollingerBands(marketData: DexTrade[]): LiquidityBound {
    
}

export function getRSILevels(marketData: DexTrade[]): LiquidityBound {

}

export function getSMA(marketData: DexTrade[]): number {
    const numDays = marketData.length;
    const priceSum = marketData.reduce((acc: number, ohlc: DexTrade) => {
        return acc + getTypicalPrice(ohlc)
    }, 0);
    return priceSum / numDays;
}

function getTypicalPrice(ohlc: DexTrade): number {
    return (ohlc.maximum_price + ohlc.minimum_price + parseFloat(ohlc.close_price || '0')) / 3;
}