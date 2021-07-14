import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircle } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';
import { V3PositionData } from '@sommelier/shared-types/src/api';
import BigNumber from 'bignumber.js';
import './positions.scss';

export const RangeStatus = ({
    position,
}: {
    // position: Pick<V3PositionData, 'position'>;
    position: any;
}): JSX.Element => {
    // FixMe:  flip tickUpper and tickLower once sub graph is synced
    let isInRange = false;
    const lower = new BigNumber(position?.tickUpper?.price0);
    const upper = new BigNumber(position?.tickLower?.price0);
    const current = new BigNumber(position?.pool?.token0Price);
    if (current.gte(lower) && current.lte(upper)) {
        isInRange = true;
    }

    return (
        <div
            className={classNames('range', {
                'in-range': isInRange,
                'out-range': !isInRange,
            })}
        >
            <FontAwesomeIcon icon={faCircle} />
            {isInRange ? 'In-range' : 'Out-of-Range'}
        </div>
    );
};
