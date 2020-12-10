import { Card } from 'react-bootstrap';
import { Combobox } from 'react-widgets';

function PairSelector({ pairs, currentPairId, setPair }) {
    let defaultValue = null;
    const pairEntries = pairs.reduce((acc, pair) => {
        if (pair.id === currentPairId) defaultValue = pairToDisplayText(pair);
        return { ...acc, [pairToDisplayText(pair)]: pair.id }
    });

    window.pairEntries = pairEntries;

    return (
        <Card.Body>
            <Card.Title>Market</Card.Title>
            <Card.Text>
                <Combobox
                    data={pairs.map(pairToDisplayText)}
                    defaultValue={defaultValue}
                    filter='contains'
                    caseSensitive={false}
                    onChange={selectedLabel => pairEntries[selectedLabel] && setPair(pairEntries[selectedLabel])}
                />
            </Card.Text>
        </Card.Body>
    );
}

function pairToDisplayText(pair) {
    return `${pair.token0.symbol}/${pair.token1.symbol}`;
}

export default PairSelector;
