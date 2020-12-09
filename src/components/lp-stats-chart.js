import { AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import LPStatsWidget from 'components/lp-stats-widget';

const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'

    // These options are needed to round to whole numbers if that's what you want.
    //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
    //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
});


function LPStatsChart({ lpStats }) {
    const chartData = [];
    for (let i in lpStats.days) {
        const runningFee = lpStats.runningFees[i].toNumber();
        const runningReturn = lpStats.runningReturn[i].toNumber();

        chartData.push({
            day: lpStats.days[i],
            runningFee,
            runningReturn,
            runningImpermanentLoss: lpStats.runningImpermanentLoss[i].toNumber(),
            returns: [runningFee, runningReturn]
        });
    }

    return (
        <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, bottom: 10 }}
            width={800}
            height={563}
        >
            <defs>
                <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                </linearGradient>
            </defs>
            <XAxis dataKey='day' interval={30} tickLine={false} tickMargin={10} />
            <YAxis tickFormatter={tick => formatter.format(tick)} width={100} />
            < Area type='monotone' dataKey='returns' stroke='#82ca9d' fill='url(#areaColor)' />
            <Tooltip content={renderTooltip} />
        </AreaChart>
    );
}

function renderTooltip({ runningFee, runningReturn, runningImpermanentLoss }) {
    console.log('THIS IS FEE', runningFee);
    const lpStats = {
        totalFees: runningFee,
        totalReturn: runningReturn,
        impermanentLoss: runningImpermanentLoss
    };
    return <LPStatsWidget lpStats={lpStats} />;
}

export default LPStatsChart;