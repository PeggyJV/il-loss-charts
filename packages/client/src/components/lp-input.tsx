import { useState, useEffect } from 'react';
import { Form, Card, Col } from 'react-bootstrap';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';
import { DateTimePicker } from 'react-widgets';
import { useMediaQuery } from 'react-responsive';
import dateFnsLocalizer, { defaultFormats } from 'react-widgets-date-fns';

import { UniswapPair, LiquidityData } from '@sommelier/shared-types';
import { Pair, DailyData, HourlyData } from 'constants/prop-types';

import 'styles/lp-input.scss';

const dateFormats = Object.assign(defaultFormats, { default: 'YYYY-MM-DD' });
dateFnsLocalizer({ formats: dateFormats });

function LPInput({
    lpDate,
    setLPDate,
    pairData,
    lpShare,
    setLPShare,
    dataAtLPDate,
}: {
    lpDate: Date;
    setLPDate: (newLPDate: Date) => void;
    pairData: UniswapPair;
    lpShare: number;
    setLPShare: (newLPShare: number) => void;
    dataAtLPDate: LiquidityData;
}): JSX.Element {
    const isLargestBreakpoint = useMediaQuery({ query: '(min-width: 1500px)' });
    const isMobile = useMediaQuery({ query: '(max-width: 500px)' });

    const { token0, token1 } = pairData;

    const calcAmounts = (
        lpShare: number,
        dataAtLPDate: LiquidityData
    ): void => {
        const poolShare = new BigNumber(lpShare).div(dataAtLPDate.reserveUSD);
        const token0Amt = poolShare.times(dataAtLPDate.reserve0).toNumber();
        const token1Amt = poolShare.times(dataAtLPDate.reserve1).toNumber();

        setUsdAmt(lpShare);
        setToken0Amt(token0Amt);
        setToken1Amt(token1Amt);
    };

    const updateShare = (denom: 'USD' | 'token0' | 'token1', value: number) => {
        if (Number.isNaN(value)) value = 0;

        if (denom === 'USD') {
            const poolShare = new BigNumber(value).div(dataAtLPDate.reserveUSD);
            setUsdAmt(value);
            setToken0Amt(poolShare.times(dataAtLPDate.reserve0).toNumber());
            setToken1Amt(poolShare.times(dataAtLPDate.reserve1).toNumber());

            setLPShare(value);
        } else if (denom === 'token0') {
            const poolShare = new BigNumber(value).div(dataAtLPDate.reserve0);
            const usdValue = poolShare
                .times(dataAtLPDate.reserveUSD)
                .toNumber();
            setUsdAmt(usdValue);
            setToken0Amt(value);
            setToken1Amt(poolShare.times(dataAtLPDate.reserve1).toNumber());

            setLPShare(usdValue);
        } else if (denom === 'token1') {
            const poolShare = new BigNumber(value).div(dataAtLPDate.reserve1);
            const usdValue = poolShare
                .times(dataAtLPDate.reserveUSD)
                .toNumber();
            setUsdAmt(usdValue);
            setToken0Amt(poolShare.times(dataAtLPDate.reserve1).toNumber());
            setToken1Amt(value);

            setLPShare(usdValue);
        }
    };

    const handleNewDate = (newDate?: Date) => {
        newDate && setLPDate(newDate);
    };

    const [usdAmt, setUsdAmt] = useState(lpShare);
    const [token0Amt, setToken0Amt] = useState(0);
    const [token1Amt, setToken1Amt] = useState(0);

    useEffect(() => {
        calcAmounts(lpShare, dataAtLPDate);
    }, [lpShare, dataAtLPDate]);

    if (!isLargestBreakpoint && !isMobile) {
        return (
            <Card className='lp-input-card'>
                <Card.Body className='lp-input-form'>
                    <Form.Row>
                        <Col>
                            <Form.Group>
                                <Form.Label>LP Date</Form.Label>
                                <div>
                                    <DateTimePicker
                                        // @ts-expect-error: className is not on the props definition but does propagate to component
                                        className='lp-date-picker form-control'
                                        dropUp
                                        min={new Date('2020-05-18')}
                                        max={new Date()}
                                        format='yyyy-MM-dd'
                                        value={lpDate}
                                        onChange={handleNewDate}
                                        time={false}
                                    />
                                </div>
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form.Group>
                                <Form.Label>USD Liquidity</Form.Label>
                                <Form.Control
                                    type='text'
                                    onChange={(event) =>
                                        updateShare(
                                            'USD',
                                            parseFloat(event.target.value)
                                        )
                                    }
                                    value={usdAmt}
                                />
                            </Form.Group>
                        </Col>
                    </Form.Row>
                    <Form.Row>
                        <Col>
                            <Form.Group>
                                <Form.Label>{`${
                                    token0.symbol || ''
                                } Liquidity`}</Form.Label>
                                <Form.Control
                                    type='text'
                                    onChange={(event) =>
                                        updateShare(
                                            'token0',
                                            parseFloat(event.target.value)
                                        )
                                    }
                                    value={token0Amt}
                                />
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form.Group>
                                <Form.Label>{`${
                                    token1.symbol || ''
                                } Liquidity`}</Form.Label>
                                <Form.Control
                                    type='text'
                                    onChange={(event) =>
                                        updateShare(
                                            'token1',
                                            parseFloat(event.target.value)
                                        )
                                    }
                                    value={token1Amt}
                                />
                            </Form.Group>
                        </Col>
                    </Form.Row>
                </Card.Body>
            </Card>
        );
    }

    return (
        <Card className='lp-input-card'>
            <Card.Body className='lp-input-form'>
                <Form.Group>
                    <Form.Label>LP Date</Form.Label>
                    <div>
                        <DateTimePicker
                            // @ts-expect-error: className is not on the props definition but does propagate to component
                            className='lp-date-picker form-control'
                            min={new Date('2020-05-18')}
                            max={new Date()}
                            format='yyyy-MM-dd'
                            value={lpDate}
                            onChange={handleNewDate}
                            time={false}
                        />
                    </div>
                </Form.Group>
                <Form.Group>
                    <Form.Label>USD Liquidity</Form.Label>
                    <Form.Control
                        type='text'
                        onChange={(event) =>
                            updateShare('USD', parseFloat(event.target.value))
                        }
                        value={usdAmt}
                    />
                </Form.Group>
                <Form.Group>
                    <Form.Label>{`${
                        token0.symbol || ''
                    } Liquidity`}</Form.Label>
                    <Form.Control
                        type='text'
                        onChange={(event) =>
                            updateShare(
                                'token0',
                                parseFloat(event.target.value)
                            )
                        }
                        value={token0Amt}
                    />
                </Form.Group>
                <Form.Group>
                    <Form.Label>{`${
                        token1.symbol || ''
                    } Liquidity`}</Form.Label>
                    <Form.Control
                        type='text'
                        onChange={(event) =>
                            updateShare(
                                'token1',
                                parseFloat(event.target.value)
                            )
                        }
                        value={token1Amt}
                    />
                </Form.Group>
            </Card.Body>
        </Card>
    );
}

LPInput.propTypes = {
    lpDate: PropTypes.instanceOf(Date).isRequired,
    setLPDate: PropTypes.func.isRequired,
    pairData: Pair.isRequired,
    lpShare: PropTypes.number.isRequired,
    setLPShare: PropTypes.func.isRequired,
    dataAtLPDate: PropTypes.oneOf([DailyData, HourlyData]),
};

export default LPInput;
