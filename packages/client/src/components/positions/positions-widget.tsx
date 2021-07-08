import Box from '@material-ui/core/Box';
import { PositionsOverview } from 'components/positions/positions-overview';
import { useEffect, useState } from 'react';
import { useWallet } from 'hooks/use-wallet';
import { UniswapV3Positions } from 'components/positions/uniswap-v3-positions';
import './positions.scss';
import BigNumber from 'bignumber.js';
import PositionsData from 'components/positions/positions-data.json';
import { V3PositionData } from '@sommelier/shared-types/src/api';
type V3PositionDataList = { [key: string]: V3PositionData };
import { formatUSD } from 'util/formats';

export const PositionsWidget = (): JSX.Element => {
    const { wallet } = useWallet();
    const [positionsSummary, setPositionsSummary] = useState({
        totalLiquidity: new BigNumber('0'),
        gasUsed: new BigNumber('0'),
        return: new BigNumber('0'),
        fees: new BigNumber('0'),
    });
    const positionsData = (PositionsData as unknown) as V3PositionDataList;

    useEffect(() => {
        const openPositionSummary = Object.keys(positionsData).reduce(
            (acc, ele: string): any => {
                const liquidity = new BigNumber(
                    positionsData?.[ele]?.position?.liquidity,
                );
                const usdAmount = new BigNumber(
                    positionsData?.[ele]?.stats?.usdAmount,
                );
                const gasUsed = new BigNumber(
                    positionsData?.[ele]?.stats?.txFeesUSD,
                );
                const totalReturn = new BigNumber(
                    positionsData?.[ele]?.stats?.totalReturn,
                );

                const uncollectedFees = new BigNumber(
                    positionsData?.[ele]?.stats?.uncollectedFeesUSD,
                );

                if (liquidity.isZero()) return acc;

                acc['totalLiquidity'] = acc?.totalLiquidity?.plus(usdAmount);
                acc['gasUsed'] = acc?.gasUsed?.plus(gasUsed);
                acc['return'] = acc?.return?.plus(totalReturn);
                acc['fees'] = acc?.fees?.plus(uncollectedFees);
                return acc;
            },
            positionsSummary,
        );

        console.log(formatUSD(openPositionSummary.totalLiquidity.toString()));
        console.log(formatUSD(openPositionSummary.gasUsed.toString()));
        console.log(formatUSD(openPositionSummary.return.toString()));
        console.log(formatUSD(openPositionSummary.fees.toString()));
        setPositionsSummary(openPositionSummary);
    }, [positionsData, positionsSummary]);

    useEffect(() => {
        const getPositionsData = async () => {
            if (!wallet?.account) return;

            const data = await // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            (
                await fetch(
                    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                    `/api/v1/mainnet/positions/${wallet?.account}/stats`,
                )
            ).json();
        };
        void getPositionsData();
    }, [wallet?.account]);
    console.log(positionsSummary);
    return (
        <Box className='positions'>
            <PositionsOverview positionsSummary={positionsSummary} />
            <UniswapV3Positions />
        </Box>
    );
};
