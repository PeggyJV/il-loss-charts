import { Card, Form } from 'react-bootstrap';

function PairSelector({ pairs, currentPairId, setPair }) {
    return (
        <Card.Body>
            <Card.Title>Market</Card.Title>
            <Card.Text>
                <Form.Control 
                    as="select"
                    value={currentPairId}
                    onChange={(event) => setPair(event.target.value)}
                >
                    {pairs.map((pair) => 
                        <option
                            key={pair.id}
                            value={pair.id}
                        >
                            {pairToDisplayText(pair)}
                        </option>
                    )}
                </Form.Control>
            </Card.Text>
        </Card.Body>
    );
}

function pairToDisplayText(pair) {
    return `${pair.token0.symbol}/${pair.token1.symbol}`;
}

export default PairSelector;