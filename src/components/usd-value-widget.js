import { Card } from 'react-bootstrap';

const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'

    // These options are needed to round to whole numbers if that's what you want.
    //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
    //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
});

function USDValueWidget({ title, value }) {
    const displayValue = formatter.format(parseInt(value, 10));

    return (
        <Card.Body>
            <Card.Title>{title}</Card.Title>
            <Card.Text>{displayValue}</Card.Text>
        </Card.Body>
    );
}

export default USDValueWidget;