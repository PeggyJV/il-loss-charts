import { makeStyles } from '@material-ui/core/styles';
import { FormControlLabel, FormGroup, TextField } from '@material-ui/core';
import { DateTimePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';

const useStyles = makeStyles((theme) => ({
    formControl: {
        margin: theme.spacing(1),
        minWidth: 120,
    },
    selectEmpty: {
        marginTop: theme.spacing(2),
    },
}));

function LPInput({ lpDate, setLPDate, pairData, lpShare, setLPShare }) {
    const classes = useStyles();
    const { token0, token1 } = pairData;

    // TODO
    // Make sure that inputs all match up
    // If USD liquidity changes, change token0 and token1 liquidity
    // If token0 liquidity changes, change USD and token1 liquidity
    // If token1 liquidity changes, change USD and token0 liquidity

    const updateShare = (denom) => (event) => {
        if (denom === 'USD') {
            const usdShare = event.target.value;
            setLPShare(event.target.value);
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
                                value={lpShare}
                                defaultValue={pairData.reserveUSD}
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
                                value={lpShare}
                                defaultValue={pairData.reserve0}
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
                                value={lpShare}
                                defaultValue={pairData.reserve1}
                            />
                        }
                    />
                </FormGroup>
                {/* Add usd, token0 amt, token1 amount inputs */}
            </div>
        </MuiPickersUtilsProvider>
    );
}

export default LPInput;