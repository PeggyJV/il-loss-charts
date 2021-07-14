import { useState } from 'react';
import Box from '@material-ui/core/Box';
import { formatUSD } from 'util/formats';
import { ToggleSwitch } from 'components/blocks/toggle-switch/toggle-switch';
import { FormatPNL } from 'components/blocks/text/format-pnl';

const overviewItemStyles = {
    display: 'flex',
    flexDirection: 'column',
    padding: '1rem',
    justifyContent: 'left',
    flexGrow: 1,
    fontSize: '1.15rem',
};

export const PositionsSummary = ({
    positionsSummary,
}: {
    positionsSummary: any;
}): JSX.Element => {
    const [showClosedPositions, setShowClosedPositions] = useState(false);
    const positions = showClosedPositions
        ? positionsSummary?.all
        : positionsSummary?.open;
    return (
        <Box mb='1rem'>
            <Box
                display='flex'
                mb='1rem'
                alignItems='center'
                justifyContent='space-between'
            >
                <Box>Positions Summary</Box>
                <Box display='flex' alignItems='center'>
                    <ToggleSwitch
                        size='small'
                        checked={showClosedPositions}
                        onChange={() =>
                            setShowClosedPositions(!showClosedPositions)
                        }
                    />
                    <Box pl='1rem' sx={{ fontSize: '0.75rem' }}>
                        Include closed positions
                    </Box>
                </Box>
            </Box>
            <Box bgcolor='var(--bgDefault)' borderRadius='4px'>
                <Box display='flex' flexWrap='wrap'>
                    <Box sx={overviewItemStyles}>
                        <div
                            style={{
                                color: 'var(--faceDeep)',
                                lineHeight: '2rem',
                            }}
                        >
                            {formatUSD(positions?.totalLiquidity?.toString())}
                        </div>
                        <div style={{ fontSize: '0.75rem' }}>Liquidity</div>
                    </Box>
                    <Box sx={overviewItemStyles}>
                        <div
                            style={{
                                color: 'var(--faceDeep)',
                                lineHeight: '2rem',
                            }}
                        >
                            {formatUSD(positions?.gasUsed?.toString())}
                        </div>
                        <div style={{ fontSize: '0.75rem' }}>Gas Costs</div>
                    </Box>
                    <Box sx={overviewItemStyles}>
                        <FormatPNL isNegative={positions?.return?.isNegative()}>
                            {formatUSD(positions?.return?.toString())}
                        </FormatPNL>
                        <div style={{ fontSize: '0.75rem' }}>Returns</div>
                    </Box>
                    <Box sx={overviewItemStyles}>
                        <FormatPNL isNegative={positions?.fees?.isNegative()}>
                            {formatUSD(positions?.fees?.toString())}
                        </FormatPNL>
                        <div style={{ fontSize: '0.75rem' }}>Accrued Fees</div>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};
