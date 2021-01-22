import { useEffect, useState } from 'react';
import { Card } from 'react-bootstrap';
import { Combobox } from 'react-widgets';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';

import { Pair, PositionData, LPStats, DailyData, HourlyData } from 'constants/prop-types';
import { formatUSD } from 'util/formats';

import TokenWithLogo from 'components/token-with-logo';

function PositionSelector({ pairs, currentPairId, setPair, isLoading, positionData }) {
    let defaultValue;
    for (const pair of pairs) {
        if (pair.id === currentPairId) {
            defaultValue = pair;
            break;
        }
    }

    const [currentValue, setCurrentValue] = useState(defaultValue);

    // Update actual pair if current value matches a given ID
    useEffect(() => {
        if (typeof currentValue === 'string') {
            return;
        }

        if (currentValue?.id) setPair(currentValue.id);
    }, [currentValue, setPair]);

    const getPositionText = (pair) => {
        const allPositions = positionData.positions[pair.id];
        const mostRecentPosition = allPositions[allPositions.length - 1];
        const tokenBalance = new BigNumber(mostRecentPosition.liquidityTokenBalance);

        if (tokenBalance.eq(0)) {
            return 'Closed';
        } else {
            // determine USD value of position
            const poolShare = tokenBalance.div(new BigNumber(mostRecentPosition.liquidityTokenTotalSupply));
            const usdValue = new BigNumber(mostRecentPosition.reserveUSD).times(poolShare).toNumber();
            return formatUSD(usdValue);
        }
    };

    const renderPair = (listItem) => {
        // If listItem is string, it's typed in so return
        if (typeof listItem === 'string') return listItem;

        return (
            <span>
                {TokenWithLogo('left')(listItem)}/{TokenWithLogo('right')(listItem, 'right')}{' '}
                ({getPositionText(listItem.value)})
            </span>
        );
    };

    const renderPairText = (pair) => {
        if (typeof pair === 'string') return pair;
        return `${pair.token0.symbol}/${pair.token1.symbol} (${getPositionText(pair)})`;
    }

    return (
        <Card className='pair-selector-card'>
            <Card.Body>
                <Card.Title className='stats-card-title'>Open and Closed Positions</Card.Title>
                <div className='pair-selector-container'>
                    <Combobox
                        className='pair-selector'
                        data={pairs}
                        textField={renderPairText}
                        itemComponent={renderPair}
                        value={defaultValue}
                        defaultValue={defaultValue}
                        filter='contains'
                        caseSensitive={false}
                        onChange={setCurrentValue}
                    />
                    {isLoading && (
                        <div className='wine-spin pair-selector-separator'>
                            🍷
                        </div>
                    )}
                </div>
            </Card.Body>
        </Card >
    );
}

PositionSelector.propTypes = {
    pairs: PropTypes.arrayOf(Pair).isRequired,
    currentPairId: PropTypes.string.isRequired,
    setPair: PropTypes.func.isRequired,
    isLoading: PropTypes.bool.isRequired,
    positionData: PropTypes.shape({
        positions: PropTypes.objectOf(PositionData),
        stats: PropTypes.objectOf(PropTypes.shape({
            historicalData: PropTypes.arrayOf(PropTypes.oneOf([DailyData, HourlyData])),
            statsWindows: PropTypes.arrayOf(LPStats),
            aggregatedStats: LPStats
        }))
    })
};

export default PositionSelector;
