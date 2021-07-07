import Box from '@material-ui/core/Box';

const overviewItemStyles = {
    display: 'flex',
    flexDirection: 'column',
    padding: '1rem',
    justifyContent: 'left',
    flexGrow: 1,
};

const PositionsOverview = () => (
    <>
        <Box p='1rem 0'>Positions Overview</Box>
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
    </>
);
const UniswapV3Positions = () => <div>Uniswap V3 Positions</div>;
export const PositionsWidget = () => (
    <Box p='1rem'>
        <PositionsOverview />
        <UniswapV3Positions />
    </Box>
);
