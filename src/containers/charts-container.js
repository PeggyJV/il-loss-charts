import { useEffect, useState } from 'react';
import { Paper, Grid } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import USDValueWidget from 'components/usd-value-widget';
import Uniswap from 'services/uniswap';

const useStyles = makeStyles((theme) => ({
    root: {
      flexGrow: 1,
    },
    paper: {
      padding: theme.spacing(2),
      textAlign: 'center',
      color: theme.palette.text.secondary,
    },
}));

function ChartsContainer() {
    const classes = useStyles();
    console.log('THESE ARE CLASSES', classes);

    const pairId = '0xa478c2975ab1ea89e8196811f51a7b7ade33eb11';
    const [{ pair, isFetching }, setPair] = useState({ pair: null, isFetching: true });

    useEffect(async () => {
        setPair({ pair, isFetching: true });
        const newPair = await Uniswap.getPairOverview(pairId);
        setPair({ pair: newPair, isFetching: false });
    }, []);

    window.pair = pair;

    if (!pair) return null;

    return (
        <div className={classes.root}>
            <Grid container spacing={3}>
                <Grid item xs={3}>
                    <Paper className={classes.paper}>
                        <USDValueWidget title="USD Volume" value={pair.volumeUSD} />
                    </Paper>
                </Grid>
                <Grid item xs={3}>
                    <Paper className={classes.paper}>
                        <USDValueWidget title="Total Liquidity" value={pair.reserveUSD} />
                    </Paper>
                </Grid>
            </Grid>
        </div>
    );
}

export default ChartsContainer;