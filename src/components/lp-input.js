import { useState, useEffect } from 'react'
import { Form, Card } from 'react-bootstrap';
import BigNumber from 'bignumber.js';
import { DateTimePicker } from 'react-widgets';
import dateFnsLocalizer, { defaultFormats } from 'react-widgets-date-fns';

import 'styles/lp-input.scss';

const dateFormats = Object.assign(defaultFormats, { default: 'YYYY-MM-DD' });
dateFnsLocalizer({ formats: dateFormats });

function LPInput({ lpDate, setLPDate, pairData, lpShare, setLPShare, dailyDataAtLPDate }) {
    const { token0, token1 } = pairData;

    const calcAmounts = (lpShare, dailyDataAtLPDate) => {
        const poolShare = new BigNumber(lpShare).div(dailyDataAtLPDate.reserveUSD);
        const token0Amt = poolShare.times(dailyDataAtLPDate.reserve0).toNumber();
        const token1Amt = poolShare.times(dailyDataAtLPDate.reserve1).toNumber();

        setUsdAmt(lpShare);
        setToken0Amt(token0Amt);
        setToken1Amt(token1Amt);
    }

    const updateShare = (denom, value) => {
        if (denom === 'USD') {
            const poolShare = new BigNumber(value).div(dailyDataAtLPDate.reserveUSD);
            setUsdAmt(value);
            setToken0Amt(poolShare.times(dailyDataAtLPDate.reserve0).toNumber());
            setToken1Amt(poolShare.times(dailyDataAtLPDate.reserve1).toNumber());

            setLPShare(value);
        } else if (denom === 'token0') {
            const poolShare = new BigNumber(value).div(dailyDataAtLPDate.reserve0);
            const usdValue = poolShare.times(dailyDataAtLPDate.reserveUSD).toNumber();
            setUsdAmt(usdValue);
            setToken0Amt(value);
            setToken1Amt(poolShare.times(dailyDataAtLPDate.reserve1).toNumber());

            setLPShare(usdValue);
        } else if (denom === 'token1') {
            const poolShare = new BigNumber(value).div(dailyDataAtLPDate.reserve1);
            const usdValue = poolShare.times(dailyDataAtLPDate.reserveUSD).toNumber();
            setUsdAmt(usdValue);
            setToken0Amt(poolShare.times(dailyDataAtLPDate.reserve1).toNumber());
            setToken1Amt(value);

            setLPShare(usdValue);
        } else {
            throw new Error(`Tried to update share with invalid denom: ${denom}`);
        }
    };

    const [usdAmt, setUsdAmt] = useState(lpShare);
    const [token0Amt, setToken0Amt] = useState(0);
    const [token1Amt, setToken1Amt] = useState(0);

    useEffect(() => {
        calcAmounts(lpShare, dailyDataAtLPDate);
    }, [lpShare, dailyDataAtLPDate]);

    return (
        <Card.Body className="lp-input-form">
            <Form.Group>
                <Form.Label>
                    LP Date
                </Form.Label>
                <div>
                    <DateTimePicker
                        className="lp-date-picker form-control"
                        min={new Date('2020-05-18')}
                        max={new Date()}
                        format="yyyy-MM-dd"
                        value={lpDate}
                        onChange={setLPDate}
                        time={false}
                    />
                </div>
            </Form.Group>
            <Form.Group>
                <Form.Label>
                    USD Liquidity
                </Form.Label>
                <Form.Control
                    type="text"
                    onChange={(event) => updateShare('USD', event.target.value)}
                    value={usdAmt}
                />
            </Form.Group>
            <Form.Group>
                <Form.Label>
                    {`${token0.symbol} Liquidity`}
                </Form.Label>
                <Form.Control
                    type="text"
                    onChange={(event) => updateShare('token0', event.target.value)}
                    value={token0Amt}
                />
            </Form.Group>
            <Form.Group>
                <Form.Label>
                    {`${token1.symbol} Liquidity`}
                </Form.Label>
                <Form.Control
                    type="text"
                    onChange={(event) => updateShare('token1', event.target.value)}
                    value={token1Amt}
                />
            </Form.Group>
        </Card.Body >
    );
}

export default LPInput;