import { useState, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { V3PositionData } from '@sommelier/shared-types/src/api';
import { resolveLogo } from 'components/token-with-logo';
import { Box } from '@material-ui/core';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCircle,
    faStepBackward,
    faCopy,
} from '@fortawesome/free-solid-svg-icons';
import { formatUSD, formatPercent } from 'util/formats';
import { FormatPNL } from 'components/blocks/text/format-pnl';

import './positions.scss';
import BigNumber from 'bignumber.js';
type V3PositionDataList = { [key: string]: V3PositionData };

export const PositionsDetail = ({
    positionsData,
}: {
    positionsData: V3PositionDataList;
}): JSX.Element => {
    const { nflpId } = useParams<{ nflpId: string }>();
    const { position, stats } = positionsData?.[nflpId];
    const history = useHistory();
    const [shortUrl, setShortUrl] = useState(null);
    const [copiedShortUrl, setCopiedShortUrl] = useState<boolean>(false);
    const { id }: { id: string } = position?.pool;

    useEffect(() => {
        if (!id) return;
        const getShortUrl = async () => {
            const data = await (
                await fetch(`/api/v1/mainnet/pools/${id}/shorts`)
            ).json();
            setShortUrl(data);
        };

        void getShortUrl();
    }, [id]);

    return (
        <div className='positions-detail'>
            <Box
                display='flex'
                mb='1rem'
                justifyContent='space-between'
                alignItems='center'
            >
                <div
                    onClick={() => void history.push('/positions')}
                    style={{ cursor: 'pointer' }}
                >
                    <Box
                        sx={{
                            border: '1px solid var(--borderDefault)',
                            padding: '0.5rem',
                            bgcolor: 'var(--objPrimary)',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                        }}
                    >
                        <FontAwesomeIcon icon={faStepBackward} />
                        &nbsp;Back
                    </Box>
                </div>

                <div>
                    {resolveLogo(position?.pool?.token0?.id)}
                    {resolveLogo(position?.pool?.token1?.id)}
                    &nbsp;&nbsp;
                    {position?.pool?.token0?.symbol}/
                    {position?.pool?.token1?.symbol}
                    &nbsp;
                    <div className={classNames('range', 'in-range')}>
                        <FontAwesomeIcon icon={faCircle} />
                        In-range
                    </div>
                </div>
                <Box
                    sx={{
                        border: '1px solid var(--borderPrimary)',
                        padding: '0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                    }}
                    onClick={() => {
                        void navigator.clipboard.writeText(shortUrl || '');
                        setCopiedShortUrl(true);
                    }}
                    style={{ cursor: 'pointer' }}
                >
                    <FontAwesomeIcon icon={faCopy} />
                    &nbsp;
                    {copiedShortUrl ? 'Copied' : 'Copy Pool Link'}
                </Box>
            </Box>
            <Box
                display='flex'
                sx={{
                    fontSize: '1rem',
                    bgcolor: 'var(--bgDeep)',
                    padding: '1rem',
                    borderRadius: '4px',
                    lineHeight: '1.75rem',
                    mb: '1rem',
                }}
            >
                <Box
                    display='flex'
                    flexDirection='column'
                    flexGrow='1'
                    justifyContent='center'
                    sx={{ fontSize: '0.75rem' }}
                >
                    <div>Entry Liquidity</div>
                    <div>Current Size</div>
                    <div>7d Fees</div>
                    <div>APY</div>
                </Box>
                <Box
                    display='flex'
                    flexDirection='column'
                    flexGrow='1'
                    alignItems='flex-end'
                >
                    <div>{formatUSD(stats?.entryUsdAmount?.toString())}</div>
                    <div>{formatUSD(stats?.usdAmount?.toString())}</div>
                    <div>
                        <FormatPNL
                            isNegative={new BigNumber(
                                stats?.totalFeesUSD,
                            ).isNegative()}
                        >
                            {formatUSD(stats?.totalFeesUSD?.toString())}
                        </FormatPNL>
                    </div>
                    <div>
                        <FormatPNL
                            isNegative={new BigNumber(stats?.apy).isNegative()}
                        >
                            {formatPercent(stats?.apy?.toString())}
                        </FormatPNL>
                    </div>
                </Box>
            </Box>
            <Box mb='1rem'>
                <Box mb='1rem'>Liquidity Range</Box>
                <Box
                    display='flex'
                    sx={{
                        border: '1px solid var(--borderPrimary)',
                        borderRadius: '4px',
                        textAlign: 'center',
                    }}
                >
                    <Box
                        sx={{
                            flexGrow: '1',
                            padding: '1rem',
                            borderRight: '1px solid var(--borderPrimary)',
                        }}
                    >
                        -
                    </Box>
                    <Box
                        sx={{
                            flexGrow: '1',
                            padding: '1rem',
                            borderRight: '1px solid var(--borderPrimary)',
                        }}
                    >
                        -
                    </Box>
                    <Box sx={{ flexGrow: '1', padding: '1rem' }}>-</Box>
                </Box>
            </Box>
            <Box
                display='flex'
                justifyContent='space-between'
                textAlign='center'
            >
                <Box
                    sx={{
                        bgcolor: 'var(--objNegative)',
                        padding: '1rem',
                        flexGrow: '1',
                        borderRadius: '4px',
                        color: 'var(--faceNegative)',
                        mr: '1rem',
                    }}
                >
                    Remove Liquidity
                </Box>
                <Box
                    sx={{
                        bgcolor: 'var(--objPositive)',
                        padding: '1rem',
                        flexGrow: '1',
                        borderRadius: '4px',
                        color: 'var(--facePositive)',
                    }}
                >
                    Add Liquidity
                </Box>
            </Box>
        </div>
    );
};
