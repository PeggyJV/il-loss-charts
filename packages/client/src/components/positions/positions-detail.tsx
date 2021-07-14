import { useState, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { V3PositionData } from '@sommelier/shared-types/src/api';
import { resolveLogo } from 'components/token-with-logo';
import { Box } from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faStepBackward,
    faCopy,
    faExchangeAlt,
} from '@fortawesome/free-solid-svg-icons';
import { formatUSD, formatPercent } from 'util/formats';
import { FormatPNL } from 'components/blocks/text/format-pnl';
import { RemovePosition } from 'components/positions/remove-position';
import { RangeStatus } from 'components/positions/range-status';
import './positions.scss';
import BigNumber from 'bignumber.js';
import { EthGasPrices } from '@sommelier/shared-types';

type V3PositionDataList = { [key: string]: V3PositionData };

export const PositionsDetail = ({
    positionsData,
    gasPrices,
}: {
    positionsData: V3PositionDataList;
    gasPrices: EthGasPrices | null;
}): JSX.Element => {
    const { nflpId } = useParams<{ nflpId: string }>();
    const currentPosition = positionsData?.[nflpId];
    const { position, stats } = currentPosition;
    const history = useHistory();
    const [shortUrl, setShortUrl] = useState(null);
    const [copiedShortUrl, setCopiedShortUrl] = useState<boolean>(false);
    const { id }: { id: string } = position?.pool;
    const [isFlipped, setIsFlipped] = useState<boolean>(false);

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
    const { pool } = position;
    // const tick = TickMath.getTickAtSqrtRatio(JSBI.BigInt(pool?.sqrtPrice));
    // const baseToken = new Token(
    //     Number(1),
    //     pool?.token0?.id,
    //     Number(pool?.token0.decimals),
    //     pool?.token0?.symbol,
    //     pool?.token0?.name,
    // );
    // const quoteToken = new Token(
    //     Number(1),
    //     pool?.token1?.id,
    //     Number(pool?.token1.decimals),
    //     pool?.token1?.symbol,
    //     pool?.token1?.name,
    // );
    // const price = tickToPrice(baseToken, quoteToken, tick);

    const [showRemoveLiquidity, setShowRemoveLiquidity] = useState<boolean>(
        false,
    );

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
                </div>
                <RangeStatus position={position} />
                {/* <Box
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
                    {copiedShortUrl ? 'Copied' : 'Copy'}
                    {' Pool Link'}
                </Box> */}
            </Box>
            <Box
                display='flex'
                width='100%'
                flexWrap='wrap'
                justifyContent='space-between'
                mb='1rem'
                sx={{
                    border: '1px solid var(--borderDefault)',
                    borderRadius: '4px',
                    padding: '1rem',
                }}
            >
                <Box flexGrow='1'>
                    <Box lineHeight='2rem' color='var(--faceDeep)'>
                        {formatUSD(stats?.entryUsdAmount?.toString())}
                    </Box>
                    <Box fontSize='0.75rem'>Entry Liquidity</Box>
                </Box>
                <Box flexGrow='1'>
                    <Box lineHeight='2rem' color='var(--faceDeep)'>
                        {formatUSD(stats?.usdAmount?.toString())}
                    </Box>
                    <Box fontSize='0.75rem'>Current Size</Box>
                </Box>
                <Box flexGrow='1'>
                    <div>
                        <FormatPNL
                            isNegative={new BigNumber(
                                stats?.totalFeesUSD,
                            ).isNegative()}
                        >
                            {formatUSD(stats?.totalFeesUSD?.toString())}
                        </FormatPNL>
                    </div>
                    <Box fontSize='0.75rem'>Earned Fees</Box>
                </Box>
                <Box flexGrow='1'>
                    <div>
                        <FormatPNL
                            isNegative={new BigNumber(stats?.apy).isNegative()}
                        >
                            {formatPercent(stats?.apy?.toString())}
                        </FormatPNL>
                    </div>
                    <Box fontSize='0.75rem'>APY</Box>
                </Box>
            </Box>
            {showRemoveLiquidity ? (
                <RemovePosition
                    positionPoolStats={currentPosition}
                    setShowRemoveLiquidity={setShowRemoveLiquidity}
                    gasPrices={gasPrices}
                />
            ) : (
                <>
                    <Box mb='1rem'>
                        <Box
                            display='flex'
                            justifyContent='space-between'
                            mb='1rem'
                            alignItems='center'
                        >
                            <Box>Liquidity Range</Box>
                            <Box
                                sx={{
                                    border: '1px solid var(--borderDefault)',
                                    padding: '0.5rem',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                }}
                                onClick={() => {
                                    void navigator.clipboard.writeText(
                                        shortUrl || '',
                                    );
                                    setCopiedShortUrl(true);
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                <FontAwesomeIcon icon={faCopy} />
                                &nbsp;
                                {copiedShortUrl ? 'Copied' : 'Copy'}
                                {' Pool Link'}
                            </Box>
                        </Box>
                        <Box
                            sx={{
                                border: '1px solid var(--borderDefault)',
                                borderRadius: '4px',
                                textAlign: 'center',
                                bgcolor: 'var(--bgDeep)',
                            }}
                        >
                            <Box
                                sx={{
                                    flexGrow: '1',
                                    padding: '0.5rem 1rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <Box fontSize='0.75rem'>Current Price</Box>
                                <Box
                                    sx={{
                                        color: 'var(--faceDeep)',
                                        overflow: 'hidden',
                                        whiteSpace: 'nowrap',
                                        textOverflow: 'ellipsis',
                                    }}
                                >
                                    {isFlipped
                                        ? 1 / parseFloat(pool?.token0Price)
                                        : parseFloat(pool?.token0Price)}
                                    &nbsp;
                                    <span
                                        style={{
                                            fontSize: '0.85rem',
                                        }}
                                    >
                                        {' '}
                                        {isFlipped
                                            ? pool.token1.symbol
                                            : pool.token0.symbol}
                                        <span
                                            onClick={() =>
                                                setIsFlipped(!isFlipped)
                                            }
                                            style={{
                                                cursor: 'pointer',
                                                color: 'var(--objHighlight)',
                                                padding: '0.5rem',
                                            }}
                                        >
                                            <FontAwesomeIcon
                                                icon={faExchangeAlt}
                                            />
                                        </span>
                                        {isFlipped
                                            ? pool.token0.symbol
                                            : pool.token1.symbol}
                                    </span>
                                </Box>
                            </Box>
                            <Box
                                sx={{
                                    flexGrow: '1',
                                    padding: '0.5rem 1rem',
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap',
                                    textOverflow: 'ellipsis',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <Box fontSize='0.75rem'>Lower Bound</Box>
                                <Box
                                    sx={{
                                        color: 'var(--faceDeep)',
                                        overflow: 'hidden',
                                        whiteSpace: 'nowrap',
                                        textOverflow: 'ellipsis',
                                    }}
                                >
                                    {isFlipped
                                        ? parseFloat(
                                              position?.tickLower?.price1,
                                          )
                                        : parseFloat(
                                              position?.tickUpper?.price0,
                                          )}
                                </Box>
                            </Box>
                            <Box
                                sx={{
                                    flexGrow: '1',
                                    padding: '0.5rem 1rem',
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap',
                                    textOverflow: 'ellipsis',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <Box fontSize='0.75rem'>Upper Bound</Box>
                                <Box
                                    sx={{
                                        color: 'var(--faceDeep)',
                                        overflow: 'hidden',
                                        whiteSpace: 'nowrap',
                                        textOverflow: 'ellipsis',
                                    }}
                                >
                                    {isFlipped
                                        ? parseFloat(
                                              position?.tickUpper?.price1,
                                          )
                                        : parseFloat(
                                              position?.tickLower?.price0,
                                          )}
                                </Box>
                            </Box>
                        </Box>
                    </Box>

                    <Box display='flex' textAlign='center'>
                        <Box
                            sx={{
                                bgcolor: 'var(--objAccent)',
                                padding: '1rem',
                                flexGrow: '1',
                                borderRadius: '4px',
                                border: '1px solid var(--objAccentAlt)',
                            }}
                            style={{ cursor: 'pointer' }}
                            onClick={() => setShowRemoveLiquidity(true)}
                        >
                            Remove Liquidity & Collect Fees
                        </Box>
                    </Box>
                </>
            )}
        </div>
    );
};
