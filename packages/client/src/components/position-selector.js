import { useEffect, useState } from 'react';
import { Card, InputGroup } from 'react-bootstrap';
import { Combobox } from 'react-widgets';
import PropTypes from 'prop-types';
import { Pair } from 'constants/prop-types';

import TokenWithLogo from 'components/token-with-logo';

function PositionSelector({ pairs, currentPairId, setPair, isLoading }) {
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

    const renderPair = (pair) => {
        // If pair is string, it's typed in so return
        if (typeof pair === 'string') return pair;

        console.log('RENDERING PAIR', pair);

        return (
            <span>
                {TokenWithLogo('left')(pair)}/{TokenWithLogo('right')(pair, 'right')}
            </span>
        );
    };

    return (
        <Card className='pair-selector-card'>
            <Card.Body>
                <Card.Title className='stats-card-title'>Open and Closed Positions</Card.Title>
                <div className='pair-selector-container'>
                    {isLoading && (
                        <div className='wine-spin pair-selector-separator'>
                            🍷
                        </div>
                    )}
                    <Combobox
                        className='pair-selector'
                        data={pairs}
                        value={currentValue}
                        textField={(pair) => `${pair.token0.symbol}/${pair.token1.symbol}`}
                        itemComponent={renderPair}
                        defaultValue={defaultValue}
                        filter='contains'
                        caseSensitive={false}
                        onChange={setCurrentValue}
                    />
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
};

export default PositionSelector;
