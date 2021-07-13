import { useState, useEffect } from 'react';
import Box from '@material-ui/core/Box';
import './positions.scss';
import { V3PositionData } from '@sommelier/shared-types/src/api';
import BigNumber from 'bignumber.js';
import { Route, useHistory } from 'react-router';
import { PositionsDetail } from 'components/positions/positions-detail';
import { PositionsList } from 'components/positions/positions-list';
import { EthGasPrices } from '@sommelier/shared-types';

type V3PositionDataList = { [key: string]: V3PositionData };

export const PositionsOverview = ({
    positionsData,
    gasPrices,
}: {
    positionsData: V3PositionDataList;
    gasPrices: EthGasPrices | null;
}): JSX.Element => {
    const history = useHistory();
    const [openPositionsData, setOpenPositionsData] = useState<any | null>(
        null,
    );
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
    }, [positionsData]);

    return (
        <Box
            className='uniswap-v3-positions'
            bgcolor='var(--bgDefault)'
            p='1rem'
            borderRadius='4px'
        >
            <Route exact path='/positions'>
                <Box mb='1rem'>Uniswap V3 Open Positions</Box>
                <Box>
                    <Box bgcolor='var(--bgDeep)' p='0.5rem'>
                        <PositionsList openPositions={openPositionsData} />
                    </Box>
                </Box>
            </Route>
            <Route path='/positions/:nflpId'>
                <PositionsDetail
                    positionsData={positionsData}
                    gasPrices={gasPrices}
                />
            </Route>
        </Box>
    );
};
