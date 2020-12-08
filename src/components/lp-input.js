import { useState } from 'react'
import BigNumber from 'bignumber.js';

import { FormControlLabel, FormGroup, TextField } from '@material-ui/core';
import { DateTimePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';

function LPInput({ lpDate, setLPDate, pairData, lpShare, setLPShare, dailyDataAtLPDate }) {
    const { token0, token1 } = pairData;
    
    const poolShare = new BigNumber(lpShare).div(dailyDataAtLPDate.reserveUSD);

    const [usdAmt, setUsdAmt] = useState(lpShare);
    const [token0Amt, setToken0Amt] = useState(poolShare.times(dailyDataAtLPDate.reserve0).toNumber());
    const [token1Amt, setToken1Amt] = useState(poolShare.times(dailyDataAtLPDate.reserve1).toNumber());

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

    return (
        <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <div>
                <FormGroup>
                    <FormControlLabel
                        label="LP Date"
                        labelPlacement="start"
                        control={
                            <DateTimePicker
                                autoOk
                                ampm={false}
                                disableFuture
                                value={lpDate}
                                onChange={setLPDate}
                            />
                        }
                    />
                    <FormControlLabel
                        label={`USD Liquidity`}
                        labelPlacement="start"
                        control={
                            <TextField 
                                variant="outlined" 
                                onChange={(event) => updateShare('USD', event.target.value)}
                                value={usdAmt}
                            />
                        }
                    />
                    <FormControlLabel
                        label={`${token0.symbol} Liquidity`}
                        labelPlacement="start"
                        control={
                            <TextField 
                                variant="outlined" 
                                onChange={(event) => updateShare('token0', event.target.value)}
                                value={token0Amt}
                            />
                        }
                    />
                    <FormControlLabel
                        label={`${token1.symbol} Liquidity`}
                        labelPlacement="start"
                        control={
                            <TextField 
                                variant="outlined" 
                                onChange={(event) => updateShare('token1', event.target.value)}
                                value={token1Amt}
                            />
                        }
                    />
                </FormGroup>
            </div>
        </MuiPickersUtilsProvider>
    );
}

export default LPInput;