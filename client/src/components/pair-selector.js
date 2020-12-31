import { useState } from 'react';
import { Card } from 'react-bootstrap';
import { Combobox } from 'react-widgets';

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

    return (
        <Card className='no-border'>
            <Card.Body>
                <Card.Title className='stats-card-title'>Market</Card.Title>
                <Combobox
                    className='pair-selector'
                    data={leftSideOptions}
                    textField={pair => pair.token0.symbol}
                    defaultValue={defaultValue}
                    filter='contains'
                    caseSensitive={false}
                    onChange={pair => setPair(pair.id)}
                />
                <Combobox
                    className='pair-selector'
                    data={rightSideOptions}
                    textField={pair => pair.token1.symbol}
                    defaultValue={defaultValue}
                    filter='contains'
                    caseSensitive={false}
                    onChange={pair => setPair(pair.id)}
                />
            </Card.Body>
        </Card>
    );
}

function pairToLookup(pair) {
    return `${pair.token0.symbol}/${pair.token1.symbol}`;
}

export default PairSelector;
