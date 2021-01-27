import { Badge, Card } from 'react-bootstrap';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';

import { formatUSD } from 'util/formats';
import FadeOnChange from 'components/fade-on-change';


function USDValueWidget({ title, value, footnote, badge }: {
    title: string,
    value?: BigNumber,
    footnote?: JSX.Element | false,
    badge?: string
}): JSX.Element {
    if (!value) throw new Error('Passed falsy value to USDValueWidget');

    const displayValue = formatUSD(value.toNumber());

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
                {footnote &&
                    <p className='card-footnote'>
                        <FadeOnChange>{footnote}</FadeOnChange>
                    </p>
                }
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
