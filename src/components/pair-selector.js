import { makeStyles } from '@material-ui/core/styles';
import { FormControl, Select, MenuItem } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
    formControl: {
        margin: theme.spacing(1),
        minWidth: 120,
    },
    selectEmpty: {
        marginTop: theme.spacing(2),
    },
}));

function PairSelector({ pairs, currentPairId, setPair }) {
    const classes = useStyles();

    return (
        <>
            <h3>Market</h3>
            <div>
                <FormControl className={classes.formControl}>
                    <Select
                        value={currentPairId}
                        onChange={(event) => setPair(event.target.value)}
                        displayEmpty
                        className={classes.selectEmpty}
                    >
                        {pairs.map((pair) => 
                            <MenuItem
                                key={pair.id}
                                value={pair.id}
                            >
                                {pairToDisplayText(pair)}
                            </MenuItem>
                        )}
                    </Select>
                </FormControl>
            </div>
        </>
    );
}

function pairToDisplayText(pair) {
    return `${pair.token0.symbol}/${pair.token1.symbol}`;
}

export default PairSelector;