import { resolveLogo } from 'components/token-with-logo';
import { Box } from '@material-ui/core';
import { ethers } from 'ethers';
import classNames from 'classnames';

export const TokenWithBalance = ({
    id,
    name,
    balance,
    decimals,
    disabled,
}: {
    id: string;
    name: string;
    balance: ethers.BigNumber;
    decimals?: string;
    disabled: boolean;
}): JSX.Element => (
    <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        className='token-with-balance'
    >
        <div className={classNames('token-logo', { disable: disabled })}>
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
