import { Badge, Card } from 'react-bootstrap';
import PropTypes from 'prop-types';

import { formatUSD } from 'util/formats';
import FadeOnChange from 'components/fade-on-change';


function USDValueWidget({ title, value, footnote, badge }) {
    const displayValue = formatUSD(value);

    return (
        <Card className='stats-card no-border'>
            <Card.Body>
                <Card.Title className='stats-card-title'>
                    {title}
                    {badge && <Badge variant='secondary'>{badge}</Badge>}
                </Card.Title>
                <Card.Text className='stats-card-body'>
                    <FadeOnChange>{displayValue}</FadeOnChange>
                </Card.Text>
                <p className='card-footnote'>
                    <FadeOnChange>{footnote}</FadeOnChange>
                </p>
            </Card.Body>
        </Card>
    );
}

USDValueWidget.propTypes = {
    title: PropTypes.string,
    value: PropTypes.node.isRequired,
    footnote: PropTypes.node,
    badge: PropTypes.node
};

export default USDValueWidget;
