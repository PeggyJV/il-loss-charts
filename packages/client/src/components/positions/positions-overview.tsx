import Box from '@material-ui/core/Box';

const overviewItemStyles = {
    display: 'flex',
    flexDirection: 'column',
    padding: '1rem',
    justifyContent: 'left',
    flexGrow: 1,
};

export const PositionsOverview = (): JSX.Element => (
    <Box mb='1rem'>
        <Box mb='1rem'>Positions Overview</Box>
        <Box display='flex' bgcolor='var(--bgDefault)' borderRadius='4px'>
            <Box sx={overviewItemStyles}>
                <div style={{ color: 'var(--faceDeep)', lineHeight: '2rem' }}>
                    $23,5000
                </div>
                <div style={{ fontSize: '0.75rem' }}>Liquidity</div>
            </Box>
            <Box sx={overviewItemStyles}>
                <div style={{ color: 'var(--faceDeep)', lineHeight: '2rem' }}>
                    $23,5000
                </div>
                <div style={{ fontSize: '0.75rem' }}>Gas Costs</div>
            </Box>
            <Box sx={overviewItemStyles}>
                <div
                    style={{ color: 'var(--facePositive)', lineHeight: '2rem' }}
                >
                    $23,5000
                </div>
                <div style={{ fontSize: '0.75rem' }}>Returns</div>
            </Box>
            <Box sx={overviewItemStyles}>
                <div
                    style={{ color: 'var(--facePositive)', lineHeight: '2rem' }}
                >
                    $23,5000
                </div>
                <div style={{ fontSize: '0.75rem' }}>Accrued Fees</div>
            </Box>
        </Box>
    </Box>
);
