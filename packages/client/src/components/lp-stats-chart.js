import { Card } from 'react-bootstrap';
import { ComposedChart, Area, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
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
        <Card body className='no-border'>
            <ResponsiveContainer width="100%" height={563}>
                <ComposedChart
                    data={chartData}
                    margin={{ top: 10, right: 10, bottom: 10 }}
                    width="100%"
                    height={563}
                >
                    <defs>
                        <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0089ff" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#0089ff" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis dataKey='day' interval={30} tickLine={false} tickMargin={10} />
                    <YAxis tick={<YAxisTick />} width={100} tickMargin={-100} />
                    <Area type='monotone' dataKey='returns' strokeWidth={0} fill='url(#areaColor)' />
                    <Line type='monotone' dataKey='runningReturn' stroke='#0089ff' strokeWidth={2} dot={false} />
                    <Tooltip content={<CustomTooltip />} />
                </ComposedChart>
            </ResponsiveContainer>
        </Card>
    );
}

function CustomTooltip({ active, payload, label }) {
    if (!active || !payload) return null;
    const lpStats = {
        totalFees: payload[0].payload.runningFee,
        totalReturn: payload[0].payload.runningReturn,
        impermanentLoss: payload[0].payload.runningImpermanentLoss
    };
    return <LPStatsWidget lpStats={lpStats} />;
}

function YAxisTick({ x, y, stroke = 'none', payload }) {
    return (
        <g class="recharts-layer recharts-cartesian-axis-tick yolo">
            <text width="100" height="513" x={x} y={y} stroke={stroke} fill="#666" class="recharts-text recharts-cartesian-axis-tick-value" text-anchor="end" font-size="0.8rem">
                <tspan x="194" dy="0.355em">
                    {formatter.format(payload.value)}
                </tspan>
            </text>
        </g>
    )
}

export default LPStatsChart;