import Box from '@material-ui/core/Box';
import { resolveLogo } from 'components/token-with-logo';
import './positions.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircle } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';
import { V3PositionData } from '@sommelier/shared-types/src/api';
import { formatUSD, formatPercent } from 'util/formats';
import BigNumber from 'bignumber.js';
import { FormatPNL } from 'components/blocks/text/format-pnl';

export const UniswapV3Positions = ({
    positionsData,
}: {
    positionsData: V3PositionData[];
}): JSX.Element => (
    <Box
        className='uniswap-v3-positions'
        bgcolor='var(--bgDefault)'
        p='1rem'
        borderRadius='4px'
    >
        <Box mb='1rem'>Uniswap V3 Open Positions</Box>
        <Box>
            <Box bgcolor='var(--bgDeep)' p='0.5rem'>
                <table width='100%'>
                    <thead>
                        <tr>
                            <th>Pools</th>
                            <th>status</th>
                            <th align='right'>Size</th>
                            <th align='right'>APY</th>
                        </tr>
                    </thead>
                    <tbody>
                        {positionsData?.map((data, id) => {
                            return (
                                <tr key={id}>
                                    <td>
                                        {resolveLogo(
                                            data?.position?.pool?.token0?.id,
                                        )}
                                        {resolveLogo(
                                            data?.position?.pool?.token1?.id,
                                        )}
                                        &nbsp;&nbsp;
                                        {data?.position?.pool?.token0?.symbol}/
                                        {data?.position?.pool?.token1?.symbol}
                                    </td>
                                    <td>
                                        <div
                                            className={classNames(
                                                'range',
                                                'in-range',
                                            )}
                                        >
                                            <FontAwesomeIcon icon={faCircle} />
                                            In-range
                                        </div>
                                    </td>
                                    <td>
                                        {formatUSD(
                                            data?.stats?.usdAmount?.toString(),
                                        )}
                                    </td>
                                    <td>
                                        <FormatPNL
                                            isNegative={new BigNumber(
                                                data?.stats?.apy,
                                            ).isNegative()}
                                        >
                                            {formatPercent(
                                                data?.stats?.apy?.toString(),
                                            )}
                                        </FormatPNL>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </Box>
        </Box>
    </Box>
);
