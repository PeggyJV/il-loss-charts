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
                        label="USD Liquidity"
                        labelPlacement="start"
                        control={
                            <TextField 
                                variant="outlined" 
                                onChange={(event) => setLPShare(event.target.value)}
                                value={lpShare}
                                defaultValue={pairData.reserveUSD}
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