import { makeStyles } from '@material-ui/core/styles';
import { FormControl, InputLabel } from '@material-ui/core';
import { DateTimePicker, MuiPickersUtilsProvider} from '@material-ui/pickers';
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

function LPInput({ lpDate, setLPDate }) {
    const classes = useStyles();

    return (
        <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <div>
                <FormControl className={classes.formControl}>
                    <InputLabel>LP Date</InputLabel>
                    <DateTimePicker
                        autoOk
                        ampm={false}
                        disableFuture
                        value={lpDate}
                        onChange={setLPDate}
                    />
                </FormControl>
                {/* Add usd, token0 amt, token1 amount inputs */}
            </div>
        </MuiPickersUtilsProvider>
    );
}

export default LPInput;