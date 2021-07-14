import Box from '@material-ui/core/Box';
import { PositionsSummary } from 'components/positions/positions-summary';
import { useEffect, useState } from 'react';
import { useWallet } from 'hooks/use-wallet';
import { PositionsOverview } from 'components/positions/positions-overview';
import './positions.scss';
import BigNumber from 'bignumber.js';
import { V3PositionData } from '@sommelier/shared-types/src/api';
import { EthGasPrices } from '@sommelier/shared-types';

type V3PositionDataList = { [key: string]: V3PositionData };

export const PositionsWidget = ({
    gasPrices,
}: {
    gasPrices: EthGasPrices | null;
}): JSX.Element => {
    const { wallet } = useWallet();
    const [
        positionsData,
        setPositionsData,
    ] = useState<V3PositionDataList | null>(null);
    const [isError, setIsError] = useState<boolean>(false);
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

    useEffect(() => {
        if (!positionsData) return;
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

            const response = await fetch(
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                `/api/v1/mainnet/positions/${wallet?.account}/stats`,
            );
            if (response?.status === 200) {
                const data = await response.json();
                setPositionsData(data);
            } else {
                setIsError(true);
            }
        };
        void getPositionsData();
    }, [wallet?.account]);

    return (
        <Box className='positions'>
            {!positionsData || isError ? (
                <Box>Positions Unavailable</Box>
            ) : (
                <>
                    <PositionsSummary positionsSummary={positionsSummary} />
                    <PositionsOverview
                        positionsData={positionsData}
                        gasPrices={gasPrices}
                    />
                </>
            )}
        </Box>
    );
};
