import { useEffect, useState } from 'react';
import { Paper, Grid } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import USDValueWidget from 'components/usd-value-widget';
import PairSelector from 'components/pair-selector';
import LPInput from 'components/lp-input';
import LPStatsWidget from 'components/lp-stats-widget';

import Uniswap from 'services/uniswap';
import calculateLPStats from 'services/calculate-lp-stats';

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
    const [lpDate, setLPDate] = useState(new Date('2020-05-18'));
    const [lpShare, setLPShare] = useState(0);
    const [historicalData, setHistoricalData] = useState([]);
    const [lpStats, setLPStats] = useState({});
    const [dailyDataAtLPDate, setDailyDataAtLPDate] = useState({});

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
            setDailyDataAtLPDate(historicalDailyData[0]);
        }
        getDailyPairData();
    }, [lpDate, pairId])

    useEffect(() => {
        if (!pairData) return;

        const newLpStats = calculateLPStats(pairData, historicalData, lpShare);
        setLPStats(newLpStats);
    }, [pairData, lpShare, historicalData]);

    window.data = {
        allPairs,
        pairId,
        pairData,
        historicalData,
        lpStats
    };

    if (!lpDate) return null;
    if (allPairs.length === 0) return null;
    if (!pairData) return null;

    return (
        <div className={classes.root}>
            <Grid container spacing={3}>
                <Grid item xs={4}>
                    <Paper className={classes.paper}>
                        <PairSelector pairs={allPairs} currentPairId={pairId} setPair={setPairId} />
                    </Paper>
                </Grid>
                <Grid item xs={2}>
                    <Paper className={classes.paper}>
                        <USDValueWidget title="USD Volume" value={pairData.volumeUSD} />
                    </Paper>
                </Grid>
                <Grid item xs={2}>
                    <Paper className={classes.paper}>
                        <USDValueWidget title="Total Liquidity" value={pairData.reserveUSD} />
                    </Paper>
                </Grid>
                <Grid item xs={4}>
                    <Paper className={classes.paper}>
                        <USDValueWidget title="Total Fees" value={pairData.feesUSD} />
                    </Paper>
                </Grid>
                <Grid item xs={8}>
                    <Paper className={classes.paper}>
                        {/* <HistoricalChart /> */}
                    </Paper>
                </Grid>
                <Grid item xs={4}>
                    <Paper className={classes.paper}>
                        <LPInput
                            pairData={pairData}
                            lpDate={lpDate}
                            setLPDate={setLPDate}
                            lpShare={lpShare}
                            setLPShare={setLPShare}
                            dailyDataAtLPDate={dailyDataAtLPDate}
                        />
                        <LPStatsWidget lpStats={lpStats} pairData={pairData} />
                    </Paper>
                </Grid>
            </Grid>
        </div>
    );
}

export default ChartsContainer;