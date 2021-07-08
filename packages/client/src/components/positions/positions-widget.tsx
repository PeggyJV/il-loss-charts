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

export const PositionsWidget = (): JSX.Element => {
    const { wallet } = useWallet();
    const [positionsSummary, setPositionsSummary] = useState({
        open: {
            totalLiquidity: new BigNumber('0'),
            gasUsed: new BigNumber('0'),
            return: new BigNumber('0'),
            fees: new BigNumber('0'),
        },
        all: {
            totalLiquidity: new BigNumber('0'),
            gasUsed: new BigNumber('0'),
            return: new BigNumber('0'),
            fees: new BigNumber('0'),
        },
    });
    const [openPositionsData, setOpenPositionsData] = useState<any | null>(
        null,
    );
    const positionsData = (PositionsData as unknown) as V3PositionDataList;

    useEffect(() => {
        const openPositions: V3PositionData[] = [];
        Object.keys(positionsData).forEach((id) => {
            if (
                !new BigNumber(
                    positionsData?.[id]?.position?.liquidity,
                ).isZero()
            )
                openPositions.push(positionsData?.[id]);
        });
        setOpenPositionsData(openPositions);

        const overview = Object.keys(positionsData).reduce(
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

                // open position
                if (!liquidity.isZero()) {
                    const { open } = acc;
                    open['totalLiquidity'] = open?.totalLiquidity?.plus(
                        usdAmount,
                    );
                    open['gasUsed'] = open?.gasUsed?.plus(gasUsed);
                    open['return'] = open?.return?.plus(totalReturn);
                    open['fees'] = open?.fees?.plus(uncollectedFees);
                }

                // all positions
                const { all } = acc;

                all['totalLiquidity'] = all?.totalLiquidity?.plus(usdAmount);
                all['gasUsed'] = all?.gasUsed?.plus(gasUsed);
                all['return'] = all?.return?.plus(totalReturn);
                all['fees'] = all?.fees?.plus(uncollectedFees);

                return acc;
            },
            positionsSummary,
        );
        setPositionsSummary(overview);
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

    return (
        <Box className='positions'>
            <PositionsOverview positionsSummary={positionsSummary} />
            <UniswapV3Positions positionsData={openPositionsData} />
        </Box>
    );
};
