import { useEffect, useState } from 'react';
import { Paper, Grid } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import USDValueWidget from 'components/usd-value-widget';
import PairSelector from 'components/pair-selector';
import LPInput from 'components/lp-input';

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

    const [allPairs, setAllPairs] = useState([]);
    const [pairId, setPairId] = useState('0xa478c2975ab1ea89e8196811f51a7b7ade33eb11');
    const [pairData, setPairData] = useState(null);
    const [lpDate, setLPDate] = useState(null);
    const [historicalData, setHistoricalData] = useState([]);

    useEffect(() => {
        const fetchPairData = async () => {
            // Fetch pair overview when pair ID changes
            // Default to createdAt date if LP date not set
            const newPair = await Uniswap.getPairOverview(pairId);
            setPairData(newPair);
            if (!lpDate) setLPDate(new Date(newPair.createdAtTimestamp * 1000));
        }
        fetchPairData();
    }, [pairId, lpDate]);

    useEffect(() => {
        const fetchAllPairs = async () => {
            // Fetch all pairs
            const allPairs = await Uniswap.getTopPairs();
            setAllPairs(allPairs);
        }
        fetchAllPairs();
    });

    useEffect(() => {
        const getDailyPairData = async () => {
            if (!lpDate) return;
            // Get historical data for pair from lp date until now
            const historicalDailyData = await Uniswap.getHistoricalDailyData(pairId, lpDate);
            setHistoricalData(historicalDailyData);
        }
        getDailyPairData();
    }, [lpDate, pairId])

    window.data = {
        allPairs,
        pairId,
        pairData,
        historicalData
    };

    if (!lpDate) return null;
    if (allPairs.length === 0) return null;
    if (!pairData) return null;

    return (
        <div className={classes.root}>
            <Grid container spacing={3}>
                <Grid item xs={3}>
                    <Paper className={classes.paper}>
                        <PairSelector pairs={allPairs} currentPairId={pairId} setPair={setPairId} />
                    </Paper>
                </Grid>
                <Grid item xs={3}>
                    <Paper className={classes.paper}>
                        <USDValueWidget title="USD Volume" value={pairData.volumeUSD} />
                    </Paper>
                </Grid>
                <Grid item xs={3}>
                    <Paper className={classes.paper}>
                        <USDValueWidget title="Total Liquidity" value={pairData.reserveUSD} />
                    </Paper>
                </Grid>
                <Grid item xs={3}>
                    <Paper className={classes.paper}>
                        <USDValueWidget title="Total Fees" value={pairData.feesUSD} />
                    </Paper>
                </Grid>
                <Grid item xs={9}>
                    <Paper className={classes.paper}>
                        {/* <HistoricalChart /> */}
                    </Paper>
                </Grid>
                <Grid item xs={3}>
                    <Paper className={classes.paper}>
                        <LPInput
                            lpDate={lpDate}
                            setLPDate={setLPDate}
                        />
                    </Paper>
                </Grid>
            </Grid>
        </div>
    );
}

export default ChartsContainer;