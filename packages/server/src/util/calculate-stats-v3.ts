import BigNumber from 'bignumber.js';
import { format } from 'date-fns';
import { ethers } from 'ethers';
import { UniswapFetcher } from 'index';

import nflpManagerAbi from 'constants/abis/nflpmanager.json';

import config from '@config';

const MAX_UINT128 = ethers.BigNumber.from(2).pow(128).sub(1);
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

export async function calculateStatsForNFLPs(position: Position, snapshots: PositionSnapshots) {
    // get sizes
    // token0 size - done
    // token1 size - done
    // usd size - done
    // token0 at entry - done
    // token1 at entry - done
    // usd at entry - done

    // get fees 0 - need to total
    // gas costs
    // fees collected - done
    // impermanent loss
    // get total return
    // get pct return
    // calculate APY

    // Historical data fetches
    const { ethPrice } = await UniswapFetcher.getEthPrice();

    const initialSnapshot = snapshots[0];
    const currentSnapshot = snapshots[snapshots.length - 1];

    // if (new BigNumber(currentSnapshot.liquidity).eq(0)) {
    //     // Position no longer has any liquidity, so look at
    //     // last one with liquidity
    //     currentSnapshot = snapshots[snapshots.length - 2];
    // }

    // Find reserves based on liquidity and sqrtPrice
    function getReservesForSnapshot(snapshot: PositionSnapshot) {
        const liquidity = new BigNumber(snapshot.liquidity);
        const sqrtPrice = new BigNumber(snapshot.sqrtPrice);

        const reserve0 = liquidity.div(sqrtPrice);
        const reserve1 = liquidity.times(sqrtPrice);
        const reserveUSD = reserve0
            .times(snapshot.token0PriceUSD)
            .plus(reserve1.times(snapshot.token1PriceUSD));

        return {
            reserve0,
            reserve1,
            reserveUSD,
        };
    }

    const { pool, owner } = position;
    const liquidity = new BigNumber(position.liquidity);
    const sqrtPrice = new BigNumber(position.sqrtPrice);

    const reserve0 = liquidity.div(sqrtPrice);
    const reserve1 = liquidity.times(sqrtPrice);
    const token0PriceUSD = pool.token0.derivedETH.times(ethPrice);
    const token1PriceUSD = pool.token1.derivedETH.times(ethPrice);
    const reserveUSD = reserve0
        .times(token0PriceUSD)
        .plus(reserve1.times(token1PriceUSD));

    const {
        reserve0: entryReserve0,
        reserve1: entryReserve1,
        reserveUSD: entryReserveUSD,
    } = getReservesForSnapshot(initialSnapshot);

    const collectedFees0 = currentSnapshot.collectedFeesToken0;
    const collectedFees1 = currentSnapshot.collectedFeesToken1;

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

    const {
        amount0: uncollectedFees0,
        amount1: uncollectedFees1,
    } = uncollectedFees;

    return {
        token0Amount: reserve0,
        token1Amount: reserve1,
        usdAmount: reserveUSD,
        entryToken0Amount: entryReserve0,
        entryToken1Amount: entryReserve1,
        entryUsdAmount: entryReserveUSD,
    }


}