import BigNumber from 'bignumber.js';
import { format } from 'date-fns';
import { ethers } from 'ethers';
import { Position, Pool, FeeAmount } from '@uniswap/v3-sdk';
import { Token } from '@uniswap/sdk-core';
import { UniswapV3Fetchers } from 'services/uniswap-v3';
import {
    GetPositionsResult,
    GetPositionSnapshotsResult,
    V3PositionStats,
} from '@sommelier/shared-types/src/api';

import nflpManagerAbi from 'constants/abis/nflp-manager.json';

import config from '@config';

const oneYearSeconds = 24 * 60 * 60 * 365;
const MAX_UINT128 = ethers.BigNumber.from(2).pow(128).sub(1);
const Q96 = new BigNumber(2).pow(96);
const { NONFUNGIBLE_POSITION_MANAGER } = config.uniswap.contracts;
const provider = new ethers.providers.InfuraProvider(
    'mainnet',
    config.infura.projectId,
);

const nflpContract = new ethers.Contract(
    NONFUNGIBLE_POSITION_MANAGER,
    nflpManagerAbi,
    provider,
);

export async function calculateStatsForNFLPs(
    position: GetPositionsResult[0],
    snapshots: GetPositionSnapshotsResult,
): Promise<V3PositionStats> {
    const fetcher = UniswapV3Fetchers.get('mainnet');
    // get sizes
    // token0 size - done
    // token1 size - done
    // usd size - done
    // token0 at entry - done
    // token1 at entry - done
    // usd at entry - done

    // get fees 0 - done
    // gas costs - done
    // fees collected - done
    // impermanent loss - done
    // get total return - done
    // get pct return - done
    // calculate APY

    const { ethPrice } = await fetcher.getEthPrice();
    const { pool, owner } = position;
    const token0Denom = new BigNumber(10).pow(pool.token0.decimals);
    const token1Denom = new BigNumber(10).pow(pool.token1.decimals);
    const ethDenom = new BigNumber(10).pow(18);

    const initialSnapshot = snapshots[0];
    const currentSnapshot = snapshots[snapshots.length - 1];

    // if (new BigNumber(currentSnapshot.liquidity).eq(0)) {
    //     // Position no longer has any liquidity, so look at
    //     // last one with liquidity
    //     currentSnapshot = snapshots[snapshots.length - 2];
    // }

    const baseTokenCurrency = new Token(
        1,
        pool.token0.id,
        Number(pool.token0.decimals),
        pool.token0.symbol,
        pool.token0.name,
    );

    const quoteTokenCurrency = new Token(
        1,
        pool.token1.id,
        Number(pool.token1.decimals),
        pool.token1.symbol,
        pool.token1.name,
    );

    const uniPool = new Pool(
        baseTokenCurrency,
        quoteTokenCurrency,
        (parseInt(pool.feeTier, 10) as any) as FeeAmount,
        pool.sqrtPrice,
        pool.liquidity,
        parseInt(pool.tick || '0', 10),
        [],
    );

    // Find reserves based on liquidity and sqrtPrice
    function getReservesForSnapshot(snapshot: GetPositionSnapshotsResult[0]) {
        const uniPosition = new Position({
            pool: uniPool,
            liquidity: snapshot.position.liquidity,
            tickLower: Number(snapshot.position.tickLower.tickIdx),
            tickUpper: Number(snapshot.position.tickUpper.tickIdx),
        });

        const reserve0 = new BigNumber(uniPosition.amount0.toFixed());
        const reserve1 = new BigNumber(uniPosition.amount1.toFixed());

        const reserveUSD = reserve0
            .times(snapshot.token0PriceUSD)
            .plus(reserve1.times(snapshot.token1PriceUSD));

        return {
            reserve0,
            reserve1,
            reserveUSD,
        };
    }

    const uniPosition = new Position({
        pool: uniPool,
        liquidity: position.liquidity,
        tickLower: Number(position.tickLower.tickIdx),
        tickUpper: Number(position.tickUpper.tickIdx),
    });

    const reserve0 = new BigNumber(uniPosition.amount0.toFixed());
    const reserve1 = new BigNumber(uniPosition.amount1.toFixed());

    const token0PriceUSD = new BigNumber(pool.token0.derivedETH).times(
        ethPrice,
    );
    const token1PriceUSD = new BigNumber(pool.token1.derivedETH).times(
        ethPrice,
    );
    const reserveUSD = reserve0
        .times(token0PriceUSD)
        .plus(reserve1.times(token1PriceUSD));

    const {
        reserve0: entryReserve0,
        reserve1: entryReserve1,
        reserveUSD: entryReserveUSD,
    } = getReservesForSnapshot(initialSnapshot);

    const collectedFees0 = new BigNumber(currentSnapshot.collectedFeesToken0);
    const collectedFees1 = new BigNumber(currentSnapshot.collectedFeesToken1);
    const collectedFeesUSD = collectedFees0
        .times(token0PriceUSD)
        .plus(collectedFees1.times(token1PriceUSD));

    let uncollectedFees0 = new BigNumber(0);
    let uncollectedFees1 = new BigNumber(0);
    try {
        // Get uncollected fees by calling into the contract
        const uncollectedFees = await nflpContract.callStatic.collect(
            {
                tokenId: position.id,
                recipient: owner, // some tokens might fail if transferred to address(0)
                amount0Max: MAX_UINT128,
                amount1Max: MAX_UINT128,
            },
            { from: owner }, // need to simulate the call as the owner
        );

        const { amount0, amount1 } = uncollectedFees;

        uncollectedFees0 = new BigNumber(amount0.toString()).div(token0Denom);
        uncollectedFees1 = new BigNumber(amount1.toString()).div(token1Denom);
    } catch (err) {
        console.error('Could not attempt to collect fees for position');
    }

    const uncollectedFeesUSD = uncollectedFees0
        .times(token0PriceUSD)
        .plus(uncollectedFees1.times(token1PriceUSD));

    const totalFeesUSD = uncollectedFeesUSD.plus(collectedFeesUSD);

    const gasUsed = new BigNumber(position.transaction.gasUsed);
    const gasPrice = new BigNumber(position.transaction.gasPrice).div(ethDenom);
    const txFees = gasUsed.times(gasPrice);
    const txFeesUSD = txFees.times(ethPrice);

    const initialPrice = new BigNumber(
        initialSnapshot.position.pool.token0Price,
    );

    // TODO: handle liquidity being 0
    // TODO: Revisit IL calculations after subgraph changes
    const currentPrice = new BigNumber(pool.token0Price);
    const priceRatio = currentPrice.div(initialPrice);
    const impermanentLossPct = new BigNumber(2)
        .times(priceRatio.sqrt())
        .div(priceRatio.plus(1))
        .minus(1);
    const impermanentLoss = reserveUSD.times(impermanentLossPct);

    const totalReturn = reserveUSD
        .minus(entryReserveUSD)
        .plus(totalFeesUSD)
        .minus(txFeesUSD)
        .minus(impermanentLoss);
    const pctReturn = totalReturn.div(entryReserveUSD);

    const apyFactor = new BigNumber(Math.floor(Date.now() / 1000))
        .minus(initialSnapshot.timestamp)
        .div(oneYearSeconds);
    const apy = pctReturn.div(apyFactor);

    return {
        gasUsed,
        gasPrice,
        token0Amount: reserve0,
        token1Amount: reserve1,
        usdAmount: reserveUSD,
        entryToken0Amount: entryReserve0,
        entryToken1Amount: entryReserve1,
        entryUsdAmount: entryReserveUSD,
        collectedFees0,
        collectedFees1,
        collectedFeesUSD,
        uncollectedFees0,
        uncollectedFees1,
        uncollectedFeesUSD,
        totalFeesUSD,
        txFees,
        txFeesUSD,
        impermanentLoss,
        impermanentLossPct,
        totalReturn,
        pctReturn,
        apy,
    };
}
