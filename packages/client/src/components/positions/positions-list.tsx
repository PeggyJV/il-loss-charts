import { resolveLogo } from 'components/token-with-logo';
import './positions.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircle } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';
import { V3PositionData } from '@sommelier/shared-types/src/api';
import { formatUSD, formatPercent } from 'util/formats';
import { RangeStatus } from 'components/positions/range-status';
import BigNumber from 'bignumber.js';
import { FormatPNL } from 'components/blocks/text/format-pnl';
import { useHistory } from 'react-router';

export const PositionsList = ({
    openPositions,
}: {
    openPositions: V3PositionData[];
}): JSX.Element => {
    const history = useHistory();

    return (
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
                {openPositions?.map((data, id) => {
                    return (
                        <tr
                            key={id}
                            onClick={() =>
                                void history.push(
                                    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                                    `/positions/${data?.position?.id}`,
                                )
                            }
                        >
                            <td>
                                {resolveLogo(data?.position?.pool?.token0?.id)}
                                {resolveLogo(data?.position?.pool?.token1?.id)}
                                &nbsp;&nbsp;
                                {data?.position?.pool?.token0?.symbol}/
                                {data?.position?.pool?.token1?.symbol}
                            </td>
                            <td>
                                <RangeStatus position={data?.position} />
                            </td>
                            <td>
                                {formatUSD(data?.stats?.usdAmount?.toString())}
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
    );
};
