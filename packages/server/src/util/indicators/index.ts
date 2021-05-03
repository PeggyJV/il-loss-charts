import { LiquidityBand } from '@sommelier/shared-types';
import { DexTrade } from 'services/bitquery/generated-types';

export function getAllIndicators(marketData: DexTrade[]): { [indicatorName: string]: LiquidityBand } {
    return {
        bollingerSMANormalBand: { 
            ...getSMABollingerBands(marketData), 
            indicatorName: 'bollingerSMANormalBand' 
        },
        bollingerSMAWideBand: {
            ...getSMABollingerBands(marketData, 2.5), 
            indicatorName: 'bollingerSMANormalBand'
        },
        bollingerEMANormalBand: {
            ...getEMABollingerBands(marketData),
            indicatorName: 'bollingerEMANormalBand'
        },
        bollingerEMAWideBand: {
            ...getEMABollingerBands(marketData, 2.5),
            indicatorName: 'bollingerEMANormalBand'
        }
    }
}

export function getEMABollingerBands(marketData: DexTrade[], numStdDevs = 2): LiquidityBand {
    const sampleData = marketData[0];
    const ma = getEMA(marketData);
    const stddev = getStandardDeviation(marketData);
    const boundTerm = numStdDevs * stddev;

    return {
        baseTokenId: sampleData.baseCurrency.address,
        quoteTokenId: sampleData.quoteCurrency.address,
        indicatorName: 'BollingerBand',
        currentPrice: marketData[0].quotePrice,
        bounds: {
            bullish: [ma - boundTerm, ma + (boundTerm * 1.5)],
            neutral: [ma - boundTerm, ma + boundTerm],
            bearish: [ma - (boundTerm * 1.5), ma + boundTerm],
        }
    };
}

export function getSMABollingerBands(marketData: DexTrade[], numStdDevs = 2): LiquidityBand {
    const sampleData = marketData[0];
    const ma = getSMA(marketData);
    const stddev = getStandardDeviation(marketData);
    const boundTerm = numStdDevs * stddev;

    return {
        baseTokenId: sampleData.baseCurrency.address,
        quoteTokenId: sampleData.quoteCurrency.address,
        indicatorName: 'BollingerBand',
        currentPrice: marketData[0].quotePrice,
        bounds: {
            bullish: [ma - boundTerm, ma + (boundTerm * 1.5)],
            neutral: [ma - boundTerm, ma + boundTerm],
            bearish: [ma - (boundTerm * 1.5), ma + boundTerm],
        }
    };
}

export function getRSILevels(marketData: DexTrade[]): LiquidityBand {
    const sampleData = marketData[0];
    const currentPrice = sampleData.quotePrice;
    const last14Days = marketData.slice(0, 14);

    const [pctGains, pctLosses] = last14Days.reduce((acc: number[][], ohlc: DexTrade, index: number) => {
        if (index === 0) return acc;
        const [pctGains, pctLosses] = acc;

        const currentClosePrice = parseFloat(ohlc.close_price || '0');
        const lastClosePrice = parseFloat(last14Days[index - 1].close_price || '0');

        const amtChange = currentClosePrice - lastClosePrice;
        const pctChange = amtChange / lastClosePrice;

        if (amtChange > 0) {
            return [pctGains.concat(pctChange), pctLosses];
        } else {
            return [pctGains, pctLosses.concat(pctChange)];
        }
    }, [[], []]);

    const totalPctGains = pctGains.reduce((acc, val) => acc + val, 0);
    const avgPctGain = totalPctGains / pctGains.length;

    const totalPctLosses = pctLosses.reduce((acc, val) => acc - val, 0);
    const avgPctLoss = totalPctLosses / pctLosses.length;

    // We want an 80 RSI for our upper bound, so figure out what avgPctGain would get us there
    // We know (100 - rsi) = 100 / 1 + RS so (1 + RS) = 100 / 100 - RSI
    // So RS = (100 / (100 - RSI)) + 1
    const getAvgPctGainForTargetRSI = (target: number) => {
        return ((100 / (100 - target)) + 1) * avgPctLoss;
    }
    const getAvgPctLossForTargetRSI = (target: number) => {
        return ((100 / (100 - target)) + 1) * avgPctGain;
    }

    const targetAvgPctGain = getAvgPctGainForTargetRSI(80);
    const targetAvgPctLoss = getAvgPctLossForTargetRSI(20);

    // We know targetGain = (prev gains + next day gain) / n
    // So N * targetGain = prevgains + next day gani
    const nextDayPctGain = ((pctGains.length + 1) * targetAvgPctGain) - totalPctGains;
    const upperBound = (1 + nextDayPctGain) * currentPrice;

    const nextDayPctLoss = ((pctLosses.length + 1) * targetAvgPctLoss) - totalPctLosses;

    const lowerBound = (1 - nextDayPctLoss) * currentPrice;

    return {
        baseTokenId: sampleData.baseCurrency.address,
        quoteTokenId: sampleData.quoteCurrency.address,
        indicatorName: 'RSI',
        currentPrice: currentPrice,
        bounds: { neutral: [lowerBound, upperBound] }
    };
}

export function getSMA(marketData: DexTrade[]): number {
    const numDays = marketData.length;
    const priceSum = marketData.reduce((acc: number, ohlc: DexTrade) =>
        acc + getTypicalPrice(ohlc)
    , 0);
    return priceSum / numDays;
}

export function getEMA(marketData: DexTrade[], smoothing = 2): number {
    const numDays = marketData.length;
    const prevSMA = getSMA(marketData.slice(1));

    const ema = (getTypicalPrice(marketData[0]) * (smoothing / (1 + numDays)))
        + (prevSMA * (1 - (smoothing / (1 + numDays))));
    
    return ema;
}


export function getStandardDeviation(marketData: DexTrade[]): number {
    const mean = getSMA(marketData);

    const sumOfSquares = marketData.reduce((acc: number, ohlc: DexTrade) => {
        const tp = getTypicalPrice(ohlc);
        const diff = Math.pow(Math.abs(tp - mean), 2);
        return acc + diff;
    }, 0);

    return Math.sqrt(sumOfSquares / marketData.length);
}

function getTypicalPrice(ohlc: DexTrade): number {
    return (ohlc.maximum_price + ohlc.minimum_price + parseFloat(ohlc.close_price || '0')) / 3;
}