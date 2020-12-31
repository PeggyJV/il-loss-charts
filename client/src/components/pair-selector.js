import { Card, Container, Row, Col, InputGroup } from 'react-bootstrap';
import { Combobox } from 'react-widgets';
import { useTransition, animated } from 'react-spring';

import logoMappings from 'constants/trustwallet-mappings';

const TokenWithLogo = (side) => ({ item: pair }) => {
    let token;

    if (side === 'left') token = pair.token0;
    else if (side === 'right') token = pair.token1;
    else throw new Error('Unknown side');

    return (
        <span>
            {resolveLogo(token.id)}{' '}{token.symbol}
        </span>
    )
}

const WineSpinner = () => {
    const transitions = useTransition('🍷', null, {
        from: { rotate: 0 },
        enter: { rotate: 180 },
        leave: { rotate: 0 },
    });

    return transitions.map(({ item, key, props }) =>
        <animated.span key={key} style={props}>{item}</animated.span>
    )
};

function PairSelector({ pairs, currentPairId, setPair, isLoading }) {
    console.log('CURRENT PAIR ID', currentPairId);

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
        if (pair.id) setPair(pair.id);
    }

    return (
        <Card className='pair-selector-card'>
            <Card.Body>
                <Card.Title className='stats-card-title'>Market</Card.Title>
                <Container fluid>
                    <Row>
                        <Col xs={5} className='pair-selector-col'>
                            <InputGroup>
                                <InputGroup.Prepend className='token-logo'>
                                    <InputGroup.Text>{resolveLogo(defaultValue.token0.id)}</InputGroup.Text>
                                </InputGroup.Prepend>
                                <Combobox
                                    className='pair-selector'
                                    data={leftSideOptions}
                                    textField={pair => pair.token0.symbol}
                                    itemComponent={TokenWithLogo('left')}
                                    defaultValue={defaultValue}
                                    filter='contains'
                                    caseSensitive={false}
                                    onChange={handleChange}
                                />
                            </InputGroup>
                        </Col>
                        <Col xs={2} className='pair-selector-middle-col'>
                            {isLoading ? <WineSpinner /> : '✖️'}
                        </Col>
                        <Col xs={5} className='pair-selector-col'>
                            <InputGroup>
                                <InputGroup.Prepend className='token-logo'>
                                    <InputGroup.Text >{resolveLogo(defaultValue.token1.id)}</InputGroup.Text>
                                </InputGroup.Prepend>
                                <Combobox
                                    className='pair-selector'
                                    data={rightSideOptions}
                                    textField={pair => pair.token1.symbol}
                                    itemComponent={TokenWithLogo('right')}
                                    defaultValue={defaultValue}
                                    filter='contains'
                                    caseSensitive={false}
                                    onChange={handleChange}
                                />
                            </InputGroup>
                        </Col>
                    </Row>
                </Container>

            </Card.Body>
        </Card>
    );
}

function resolveLogo(addressLower) {
    const address = logoMappings[addressLower];

    if (!address) return <span>🍇</span>;

    const imgUrl = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png`;
    return <span><img style={{ height: '1rem' }} src={imgUrl} alt="🍇" /></span>
}

export default PairSelector;
