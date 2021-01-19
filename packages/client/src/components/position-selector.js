import { useEffect, useState } from 'react';
import { Card, InputGroup } from 'react-bootstrap';
import { Combobox } from 'react-widgets';
import PropTypes from 'prop-types';
import { Pair } from 'constants/prop-types';

import TokenWithLogo, { resolveLogo } from 'components/token-with-logo';

function PositionSelector({ pairs, currentPairId, setPair, isLoading }) {
    let defaultValue;
    for (const pair of pairs) {
        if (pair.id === currentPairId) {
            defaultValue = pair;
            break;
        }
    }

    const [currentValue, setCurrentValue] = useState(defaultValue);

    const leftSideOptions = [];
    const rightSideOptions = [];

    for (const pair of pairs) {
        if (pair.token1.symbol === defaultValue.token1.symbol) {
            leftSideOptions.push(pair);
        }

        if (pair.token0.symbol === defaultValue.token0.symbol) {
            rightSideOptions.push(pair);
        }
    }

    // Update actual pair if current value matches a given ID
    useEffect(() => {
        if (typeof currentValue === 'string') {
            return;
        }

        if (currentValue?.id) setPair(currentValue.id);
    }, [currentValue, setPair]);

    const renderPairText = (side) => (pair) => {
        // If pair is string, it's typed in so return
        if (typeof pair === 'string') return pair;

        const token = side === 'left' ? 'token0' : 'token1';
        return pair[token].symbol;
    };

    const handleChange = (side) => (value) => {
        // If pair is string, it's typed in
        // so just override one side
        if (typeof value === 'string') {
            const token = side === 'left' ? 'token0' : 'token1';
            setCurrentValue((current) => ({
                ...current,
                id: null,
                [token]: {
                    ...[current[token]],
                    symbol: value,
                },
            }));
        } else {
            setCurrentValue(value);
        }
    };

    return (
        <Card className='pair-selector-card'>
            <Card.Body>
                <Card.Title className='stats-card-title'>Open and Closed Positions </Card.Title>
                <div className='pair-selector-container'>
                    <InputGroup>
                        <InputGroup.Prepend className='token-logo'>
                            <InputGroup.Text className='logo-span'>
                                {resolveLogo(defaultValue.token0.id)}
                            </InputGroup.Text>
                        </InputGroup.Prepend>
                        <Combobox
                            className='pair-selector'
                            data={leftSideOptions}
                            value={currentValue}
                            textField={renderPairText('left')}
                            itemComponent={TokenWithLogo('left')}
                            defaultValue={defaultValue}
                            filter='contains'
                            caseSensitive={false}
                            onChange={handleChange('left')}
                        />
                    </InputGroup>
                    {isLoading ? (
                        <div className='wine-spin pair-selector-separator'>
                            🍷
                        </div>
                    ) : (
                            <div className='pair-selector-separator'>✖️</div>
                        )}
                    <InputGroup>
                        <InputGroup.Prepend className='token-logo'>
                            <InputGroup.Text className='logo-span'>
                                {resolveLogo(defaultValue.token1.id)}
                            </InputGroup.Text>
                        </InputGroup.Prepend>
                        <Combobox
                            className='pair-selector'
                            data={rightSideOptions}
                            value={currentValue}
                            textField={renderPairText('right')}
                            itemComponent={TokenWithLogo('right')}
                            defaultValue={defaultValue}
                            filter='contains'
                            caseSensitive={false}
                            onChange={handleChange('right')}
                        />
                    </InputGroup>
                </div>
            </Card.Body>
        </Card>
    );
}

PositionSelector.propTypes = {
    pairs: PropTypes.arrayOf(Pair).isRequired,
    currentPairId: PropTypes.string.isRequired,
    setPair: PropTypes.func.isRequired,
    isLoading: PropTypes.bool.isRequired,
};

export default PositionSelector;
