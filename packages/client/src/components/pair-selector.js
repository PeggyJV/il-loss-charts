import { Card } from 'react-bootstrap';
import { Combobox } from 'react-widgets';

function PairSelector({ pairs, currentPairId, setPair }) {
    let defaultValue = null;
    const pairEntries = pairs.reduce((acc, pair) => {
        if (pair.id === currentPairId) defaultValue = pairToDisplayText(pair);
        return { ...acc, [pairToDisplayText(pair)]: pair.id }
    });

    return (
        <Card className='no-border'>
            <Card.Body>
                <Card.Title className='stats-card-title'>Market</Card.Title>
                <Card.Text>
                    <Combobox
                        className='pair-selector'
                        data={pairs.map(pairToDisplayText)}
                        defaultValue={defaultValue}
                        filter='contains'
                        caseSensitive={false}
                        onChange={selectedLabel => pairEntries[selectedLabel] && setPair(pairEntries[selectedLabel])}
                    />
                </Card.Text>
            </Card.Body>
        </Card>
    );
}

function pairToDisplayText(pair) {
    return `${pair.token0.symbol}/${pair.token1.symbol}`;
}

export default PairSelector;
