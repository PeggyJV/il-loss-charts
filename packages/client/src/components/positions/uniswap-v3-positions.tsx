import Box from '@material-ui/core/Box';
import { resolveLogo } from 'components/token-with-logo';
import './positions.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircle } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';

export const UniswapV3Positions = (): JSX.Element => (
    <Box
        className='uniswap-v3-positions'
        bgcolor='var(--bgDefault)'
        p='1rem'
        borderRadius='4px'
    >
        <Box mb='1rem'>Uniswap V3 Positions</Box>
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
                        <tr>
                            <td>
                                {resolveLogo(
                                    '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
                                )}
                                {resolveLogo(
                                    '0xdac17f958d2ee523a2206206994597c13d831ec7',
                                )}
                                &nbsp;&nbsp;
                                {'UNI/USDT'}
                            </td>
                            <td>
                                <div
                                    className={classNames('range', 'in-range')}
                                >
                                    <FontAwesomeIcon icon={faCircle} />
                                    In-range
                                </div>
                            </td>
                            <td>$153.75</td>
                            <td>123.46%</td>
                        </tr>
                    </tbody>
                </table>
            </Box>
        </Box>
    </Box>
);
