import BigNumber from 'bignumber.js';

import { UniswapPair } from '@sommelier/shared-types';

export function calculatePoolEntryData(pairData: UniswapPair | null, entryToken: string, entryAmount: string): {
    expectedLpTokens: string;
    expectedPoolToken0: string;
    expectedPoolToken1: string;
    expectedPriceImpact: string;
} {
    if (pairData == null) {
        return {
            expectedLpTokens: '0',
            expectedPoolToken0: '0',
            expectedPoolToken1: '0',
            expectedPriceImpact: '0'
        };
    }

    let pctShare;
    if (entryToken === 'ETH') {
        const amt = new BigNumber(entryAmount);
        pctShare = amt.div(pairData.trackedReserveETH);
    } else if (entryToken === pairData.token0.symbol) {
        const amt = new BigNumber(entryAmount);
        // Half of the value will go to the other token
        pctShare = amt.div(2).div(pairData.reserve0);
    } else if (entryToken === pairData.token1.symbol) {
        const amt = new BigNumber(entryAmount);
        // Half of the value will go to the other token
        pctShare = amt.div(2).div(pairData.reserve1);
    } else {
        throw new Error('Entry token does not belong to pair');
    }

    // Calculate pricing
    let expectedPoolToken0 = pctShare.times(pairData.reserve0).toFixed(4);
    let expectedPoolToken1 = pctShare.times(pairData.reserve1).toFixed(4);
    const currentInvariant = new BigNumber(pairData.reserve0).times(pairData.reserve1);
    let expectedPriceImpact = '';

    // Calculate price impact
    if (entryToken === 'ETH') {
        const currentInvariant = new BigNumber(pairData.reserve0).times(pairData.reserve1);

        if (pairData.token0.symbol !== 'WETH' && pairData.token1.symbol !== 'WETH') {
            // We need to invest our ETH equally in each token, so no price impact
            expectedPriceImpact = '0';

            // One side is WETH, so we need to swap into the other side. Calculate 
            // the price impact of this swap 
        } else if (pairData.token0.symbol === 'WETH') {
            // We need to buy token1
            const currentPriceRatio = new BigNumber(pairData.reserve0).div(pairData.reserve1);

            // Deduct fee from amount we can swap
            const purchasingPower = new BigNumber(0.997).times(expectedPoolToken0);
            const updatedReserve0 = new BigNumber(pairData.reserve0).plus(purchasingPower);
            const updatedReserve1 = currentInvariant.div(updatedReserve0);
            const newPriceRatio = updatedReserve0.div(updatedReserve1);

            expectedPoolToken1 = updatedReserve1.minus(pairData.reserve1).times(-1).toFixed(4);
            const invariantAfterSwap = updatedReserve0.times(updatedReserve1);

            if (invariantAfterSwap.toFixed(4) !== currentInvariant.toFixed(4)) {
                // throw new Error(`Swap expectations do not meet invariant - old ${currentInvariant.toFixed(4)} - new ${invariantAfterSwap.toFixed(4)}`);
                console.warn(`Swap expectations do not meet invariant - old ${currentInvariant.toFixed()} - new ${invariantAfterSwap.toFixed()}`);
            }

            expectedPriceImpact = new BigNumber(newPriceRatio).minus(currentPriceRatio).div(currentPriceRatio).times(100).abs().toFixed(2);
        } else {
            // We need to buy token0
            const currentPriceRatio = new BigNumber(pairData.reserve0).div(pairData.reserve1);

            // Deduct fee from amount we can swap
            const purchasingPower = new BigNumber(0.997).times(expectedPoolToken1);
            const updatedReserve1 = new BigNumber(pairData.reserve1).plus(purchasingPower);
            const updatedReserve0 = currentInvariant.div(updatedReserve1);
            const newPriceRatio = updatedReserve0.div(updatedReserve1);

            expectedPoolToken0 = updatedReserve0.minus(pairData.reserve0).times(-1).toFixed(4);
            const invariantAfterSwap = updatedReserve0.times(updatedReserve1);

            if (invariantAfterSwap.toFixed(4) !== currentInvariant.toFixed(4)) {
                // throw new Error(`Swap expectations do not meet invariant - old ${currentInvariant.toFixed(4)} - new ${invariantAfterSwap.toFixed(4)}`);
                console.warn(`Swap expectations do not meet invariant - old ${currentInvariant.toFixed()} - new ${invariantAfterSwap.toFixed()}`);
            }

            expectedPriceImpact = new BigNumber(newPriceRatio).minus(currentPriceRatio).div(currentPriceRatio).times(100).abs().toFixed(2);
        }
    } else if (entryToken === pairData.token0.symbol) {
        const currentPriceRatio = new BigNumber(pairData.reserve0).div(pairData.reserve1);

        // Deduct fee from amount we can swap
        const purchasingPower = new BigNumber(0.997).times(expectedPoolToken0);
        const updatedReserve0 = new BigNumber(pairData.reserve0).plus(purchasingPower);
        const updatedReserve1 = currentInvariant.div(updatedReserve0);
        const newPriceRatio = updatedReserve0.div(updatedReserve1);

        expectedPoolToken1 = updatedReserve1.minus(pairData.reserve1).times(-1).toFixed(4);
        const invariantAfterSwap = updatedReserve0.times(updatedReserve1);

        if (invariantAfterSwap.toFixed(4) !== currentInvariant.toFixed(4)) {
            // throw new Error(`Swap expectations do not meet invariant - old ${currentInvariant.toFixed(4)} - new ${invariantAfterSwap.toFixed(4)}`);
            console.warn(`Swap expectations do not meet invariant - old ${currentInvariant.toFixed()} - new ${invariantAfterSwap.toFixed()}`);
        }

        expectedPriceImpact = new BigNumber(newPriceRatio).minus(currentPriceRatio).div(currentPriceRatio).times(100).abs().toFixed(2);
    } else if (entryToken === pairData.token1.symbol) {
        const currentPriceRatio = new BigNumber(pairData.reserve0).div(pairData.reserve1);

        // Deduct fee from amount we can swap
        const purchasingPower = new BigNumber(0.997).times(expectedPoolToken1);
        const updatedReserve1 = new BigNumber(pairData.reserve1).plus(purchasingPower);
        const updatedReserve0 = currentInvariant.div(updatedReserve1);
        const newPriceRatio = updatedReserve0.div(updatedReserve1);

        expectedPoolToken0 = updatedReserve0.minus(pairData.reserve0).times(-1).toFixed(4);
        const invariantAfterSwap = updatedReserve0.times(updatedReserve1);

        if (invariantAfterSwap.toFixed(4) !== currentInvariant.toFixed(4)) {
            // throw new Error(`Swap expectations do not meet invariant - old ${currentInvariant.toFixed(4)} - new ${invariantAfterSwap.toFixed(4)}`);
            console.warn(`Swap expectations do not meet invariant - old ${currentInvariant.toFixed()} - new ${invariantAfterSwap.toFixed()}`);
        }

        expectedPriceImpact = new BigNumber(newPriceRatio).minus(currentPriceRatio).div(currentPriceRatio).times(100).abs().toFixed(2);

    } else {
        // throw new Error(`Entry token ${entryToken} does not belong to pair - could not calculate price impact`);
        console.warn(`Entry token ${entryToken} does not belong to pair - could not calculate price impact`);
    }

    // If we have one side of the pair and need to swap for the other, we will drive the
    // price of that other token up
    const expectedLpTokens = pctShare.times(pairData.totalSupply).toFixed(8);

    return {
        expectedLpTokens,
        expectedPoolToken0,
        expectedPoolToken1,
        expectedPriceImpact
    }
}