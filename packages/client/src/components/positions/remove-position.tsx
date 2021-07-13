import { Box } from '@material-ui/core';
import { useState } from 'react';
import Slider from '@material-ui/core/Slider';
import { V3PositionData } from '@sommelier/shared-types/src/api';
import BigNumber from 'bignumber.js';
import { resolveLogo } from 'components/token-with-logo';

export const RemovePosition = ({
    position,
}: {
    position: V3PositionData;
}): JSX.Element => {
    const [removeAmountPercent, setRemoveAmountPercent] = useState<number>(100);
    const { stats } = position;
    const percentStyle = {
        borderRadius: '4px',
        padding: '0.5rem 1rem',
        border: '1px solid borderPrimary',
        bgcolor: 'var(--objPrimary)',
        margin: '0 0.5rem',
    };
    return (
        <>
            <Box
                p='1rem'
                display='flex'
                alignItems='center'
                justifyContent='space-between'
            >
                <Box>
                    Remove Amount{' '}
                    <span
                        style={{ fontSize: '2rem', color: 'var(--faceDeep)' }}
                    >
                        {removeAmountPercent}
                        <span style={{ color: 'var(--faceSecondary)' }}>%</span>
                    </span>
                </Box>
                <Box display='flex' flexDirection='column'>
                    <Box display='flex' justifyContent='center'>
                        <Box
                            sx={percentStyle}
                            style={{ cursor: 'pointer' }}
                            onClick={() => setRemoveAmountPercent(25)}
                        >
                            25%
                        </Box>
                        <Box
                            sx={percentStyle}
                            style={{ cursor: 'pointer' }}
                            onClick={() => setRemoveAmountPercent(50)}
                        >
                            50%
                        </Box>
                        <Box
                            sx={percentStyle}
                            style={{ cursor: 'pointer' }}
                            onClick={() => setRemoveAmountPercent(75)}
                        >
                            75%
                        </Box>
                        <Box
                            sx={percentStyle}
                            style={{ cursor: 'pointer' }}
                            onClick={() => setRemoveAmountPercent(100)}
                        >
                            Max
                        </Box>
                    </Box>
                    <Box>
                        <Slider
                            aria-label='Small'
                            valueLabelDisplay='auto'
                            onChange={(_, value) =>
                                setRemoveAmountPercent(value as number)
                            }
                            value={removeAmountPercent}
                        />
                    </Box>
                </Box>
            </Box>
            <Box
                display='flex'
                justifyContent='space-between'
                borderRadius='4px'
                bgcolor='var(--bgDeep)'
                mb='1rem'
                p='1rem'
                lineHeight='1.75rem'
            >
                <table width='100%'>
                    <thead>
                        <tr
                            style={{
                                color: 'var(--faceSecondary)',
                                fontSize: '0.75rem',
                            }}
                        >
                            <td>Token</td>
                            <td>Pooled</td>
                            <td>Fees</td>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                {resolveLogo(
                                    position?.position?.pool?.token0?.id,
                                )}{' '}
                                <span
                                    style={{
                                        fontWeight: 'bold',
                                        color: 'var(--faceDeep)',
                                        fontSize: '1rem',
                                    }}
                                >
                                    {position?.position?.pool?.token0?.symbol}
                                </span>
                            </td>
                            <td>
                                {new BigNumber(stats?.token0Amount)
                                    .times(removeAmountPercent / 100)
                                    .toFixed(8)}
                            </td>
                            <td>
                                {new BigNumber(stats?.uncollectedFees0).toFixed(
                                    8,
                                )}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                {resolveLogo(
                                    position?.position?.pool?.token1?.id,
                                )}{' '}
                                <span
                                    style={{
                                        fontWeight: 'bold',
                                        color: 'var(--faceDeep)',
                                        fontSize: '1rem',
                                    }}
                                >
                                    {position?.position?.pool?.token1?.symbol}
                                </span>
                            </td>
                            <td>
                                {new BigNumber(stats?.token1Amount)
                                    .times(removeAmountPercent / 100)
                                    .toFixed(8)}
                            </td>
                            <td>
                                {new BigNumber(stats?.uncollectedFees1).toFixed(
                                    8,
                                )}
                            </td>
                        </tr>
                    </tbody>
                </table>
                {/* <Box
                    display='flex'
                    flexDirection='column'
                    flexGrow='1'
                    justifyContent='center'
                    fontSize='0.75rem'
                >
                    <div>
                        Pooled{' '}
                        <span
                            style={{
                                fontWeight: 'bold',
                                color: 'var(--faceDeep)',
                                fontSize: '1rem',
                            }}
                        >
                            {position?.position?.pool?.token0?.symbol}
                        </span>
                    </div>
                    <div>
                        Pooled{' '}
                        <span
                            style={{
                                fontWeight: 'bold',
                                color: 'var(--faceDeep)',
                                fontSize: '1rem',
                            }}
                        >
                            {position?.position?.pool?.token1?.symbol}
                        </span>
                    </div>
                    <div>
                        Fees{' '}
                        <span
                            style={{
                                fontWeight: 'bold',
                                color: 'var(--faceDeep)',
                                fontSize: '1rem',
                            }}
                        >
                            {position?.position?.pool?.token0?.symbol}
                        </span>
                    </div>
                    <div>
                        Fees{' '}
                        <span
                            style={{
                                fontWeight: 'bold',
                                color: 'var(--faceDeep)',
                                fontSize: '1rem',
                            }}
                        >
                            {position?.position?.pool?.token1?.symbol}
                        </span>
                    </div>
                </Box> */}
                {/* <Box
                    display='flex'
                    flexDirection='column'
                    flexGrow='1'
                    alignItems='flex-end'
                >
                    <div>
                        {new BigNumber(stats?.token0Amount).toFixed(8)}&nbsp;
                        {resolveLogo(position?.position?.pool?.token0?.id)}
                    </div>
                    <div>
                        {new BigNumber(stats?.token1Amount).toFixed(8)}&nbsp;
                        {resolveLogo(position?.position?.pool?.token1?.id)}
                    </div>
                    <div>
                        {new BigNumber(stats?.uncollectedFees0).toFixed(8)}
                        &nbsp;
                        {resolveLogo(position?.position?.pool?.token0?.id)}
                    </div>
                    <div>
                        {new BigNumber(stats?.uncollectedFees1).toFixed(8)}
                        &nbsp;
                        {resolveLogo(position?.position?.pool?.token1?.id)}
                    </div>
                </Box> */}
            </Box>
        </>
    );
};
