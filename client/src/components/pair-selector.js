import { useState } from 'react';
import { Card, Container, Row, Col, InputGroup } from 'react-bootstrap';
import { Combobox } from 'react-widgets';
import { useSpring, animated } from 'react-spring';

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
                                    value={defaultValue}
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
                            {isLoading ? <div className='wine-spin'>🍷</div> : '✖️'}
                        </Col>
                        <Col xs={5} className='pair-selector-col'>
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
