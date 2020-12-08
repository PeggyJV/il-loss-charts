import { AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

function LPStatsChart({ lpStats }) {
    const chartData = [];
    for (let i in lpStats.days) {
        chartData.push({
            day: lpStats.days[i],
            runningFee: lpStats.runningFees[i].toNumber(),
            runningReturn: lpStats.runningReturn[i].toNumber(),
            runningImpermanentLoss: lpStats.runningImpermanentLoss[i].toNumber()
        });
    }

    window.chartData = chartData;

    return (
        <AreaChart 
            data={chartData}
            margin={{ top: 10, right: 10, bottom: 10 }}
            width={600}
            height={400}
        >
            <XAxis dataKey='day' />
            <YAxis />
            <Area type='monotone' dataKey='runningFee' stroke='#8884d8' fill='#8884d8' />
            <Area type='monotone' dataKey='runningReturn' stroke="#8884d8" fill="#ffffff" fillOpacity={1} />
        </AreaChart>
    );
}

export default LPStatsChart;