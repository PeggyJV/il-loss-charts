import Box from '@material-ui/core/Box';
import { formatUSD } from 'util/formats';

const FormatPNL = ({
    children,
    isNegative,
}: {
    children: string;
    isNegative: boolean;
}): JSX.Element => {
    return (
        <div
            style={{
                color: isNegative
                    ? 'var(--faceNegative)'
                    : 'var(--facePositive)',
                lineHeight: '2rem',
            }}
        >
            {children}
        </div>
    );
};
const overviewItemStyles = {
    display: 'flex',
    flexDirection: 'column',
    padding: '1rem',
    justifyContent: 'left',
    flexGrow: 1,
};

export const PositionsOverview = ({
    positionsSummary,
}: {
    positionsSummary: any;
}): JSX.Element => (
    <Box mb='1rem'>
        <Box mb='1rem'>Positions Overview</Box>
        <Box display='flex' bgcolor='var(--bgDefault)' borderRadius='4px'>
            <Box sx={overviewItemStyles}>
                <div style={{ color: 'var(--faceDeep)', lineHeight: '2rem' }}>
                    {formatUSD(positionsSummary?.totalLiquidity?.toString())}
                </div>
                <div style={{ fontSize: '0.75rem' }}>Liquidity</div>
            </Box>
            <Box sx={overviewItemStyles}>
                <div style={{ color: 'var(--faceDeep)', lineHeight: '2rem' }}>
                    {formatUSD(positionsSummary?.gasUsed?.toString())}
                </div>
                <div style={{ fontSize: '0.75rem' }}>Gas Costs</div>
            </Box>
            <Box sx={overviewItemStyles}>
                <FormatPNL isNegative={positionsSummary?.return?.isNegative()}>
                    {formatUSD(positionsSummary?.return?.toString())}
                </FormatPNL>
                <div style={{ fontSize: '0.75rem' }}>Returns</div>
            </Box>
            <Box sx={overviewItemStyles}>
                <FormatPNL isNegative={positionsSummary?.fees?.isNegative()}>
                    {formatUSD(positionsSummary?.fees?.toString())}
                </FormatPNL>
                <div style={{ fontSize: '0.75rem' }}>Accrued Fees</div>
            </Box>
        </Box>
    </Box>
);
