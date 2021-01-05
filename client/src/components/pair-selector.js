import { useState } from 'react';
import { Card, Container, Row, Col, InputGroup } from 'react-bootstrap';
import { Combobox } from 'react-widgets';
import { useSpring, animated } from 'react-spring';

import TokenWithLogo, { resolveLogo } from 'components/token-with-logo';

function PairSelector({ pairs, currentPairId, setPair, isLoading }) {
    let defaultValue;
    for (let pair of pairs) {
        if (pair.id === currentPairId) {
            defaultValue = pair;
            break;
        }
    };

    const leftSideOptions = [];
    const rightSideOptions = [];

    for (let pair of pairs) {
        if (pair.token1.symbol === defaultValue.token1.symbol) {
            leftSideOptions.push(pair);
        }

        if (pair.token0.symbol === defaultValue.token0.symbol) {
            rightSideOptions.push(pair);
        }
    }

    const handleChange = (pair) => {
        // Ignore if typed in for now
        if (typeof pair === 'string') {
            return;
        }

        if (pair.id) setPair(pair.id);
    }

    return (
        <Card className='pair-selector-card'>
            <Card.Body>
                <Card.Title className='stats-card-title'>Market</Card.Title>
                <div className='pair-selector-container'>
                    <InputGroup>
                        <InputGroup.Prepend className='token-logo'>
                            <InputGroup.Text>{resolveLogo(defaultValue.token0.id)}</InputGroup.Text>
                        </InputGroup.Prepend>
                        <Combobox
                            className='pair-selector'
                            data={leftSideOptions}
                            value={defaultValue}
                            textField={pair => pair.token0.symbol}
                            itemComponent={TokenWithLogo('left')}
                            defaultValue={defaultValue}
                            filter='contains'
                            caseSensitive={false}
                            onChange={handleChange}
                        />
                    </InputGroup>
                    {isLoading ?
                        <div className='wine-spin pair-selector-separator'>🍷</div>
                        : <div className='pair-selector-separator'>✖️</div>}
                    <InputGroup>
                        <InputGroup.Prepend className='token-logo'>
                            <InputGroup.Text >{resolveLogo(defaultValue.token1.id)}</InputGroup.Text>
                        </InputGroup.Prepend>
                        <Combobox
                            className='pair-selector'
                            data={rightSideOptions}
                            value={defaultValue}
                            textField={pair => pair.token1.symbol}
                            itemComponent={TokenWithLogo('right')}
                            defaultValue={defaultValue}
                            filter='contains'
                            caseSensitive={false}
                            onChange={handleChange}
                        />
                    </InputGroup>
                </div>
            </Card.Body>
        </Card >
    );
}

export default PairSelector;
