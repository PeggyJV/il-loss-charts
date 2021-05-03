import { resolveLogo } from 'components/token-with-logo';
import { Box } from '@material-ui/core';
import { ethers } from 'ethers';

export const TokenWithBalance = ({
    id,
    name,
    balance,
    decimals,
}: {
    id: string;
    name: string;
    balance: ethers.BigNumber;
    decimals?: string;
}): JSX.Element => (
    <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        className='token-with-balance'
    >
        <div className='token-logo'>
            {resolveLogo(id)}&nbsp;{name}
        </div>
        <Box
            display='flex'
            flexDirection='column'
            className='balance'
            alignItems='flex-end'
        >
            <div>
                <span style={{ color: 'var(--faceSecondary)' }}>Balance</span>
            </div>
            <div className='balance-string'>
                {ethers.utils.formatUnits(
                    balance || 0,
                    parseInt(decimals || '0', 10)
                )}
            </div>
        </Box>
    </Box>
);
