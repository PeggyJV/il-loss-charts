import { Card } from 'react-bootstrap';
import {
    ComposedChart,
    CartesianGrid,
    Area,
    Line,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip,
} from 'recharts';
import PropTypes from 'prop-types';
import { format } from 'date-fns';

import LPStatsWidget from 'components/lp-stats-widget';
import { LPStats } from 'constants/prop-types';

const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',

    // These options are needed to round to whole numbers if that's what you want.
    //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
    //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
});

function LPStatsChart({ lpStats }) {
    const chartData = [];
    for (const i in lpStats.days) {
        const runningFee = lpStats.runningFees[i].toNumber();
        const runningReturn = lpStats.runningReturn[i].toNumber();

        chartData.push({
            fullDate: lpStats.fullDates[i],
            day: lpStats.days[i],
            runningFee,
            runningReturn,
            runningImpermanentLoss: lpStats.runningImpermanentLoss[
                i
            ].toNumber(),
            returns: [runningFee, runningReturn],
        });
    }

    const showXAxisTicks = window.innerWidth > 700;

    return (
        <Card body className='no-border'>
            <ResponsiveContainer width='100%' height={563}>
                <ComposedChart
                    data={chartData}
                    margin={{ top: 10, right: 10, bottom: 10, left: -50 }}
                    padding={{ left: -100 }}
                    height={563}
                >
                    <defs>
                        <linearGradient
                            id='areaColor'
                            x1='0'
                            y1='0'
                            x2='0'
                            y2='1'
                        >
                            <stop
                                offset='5%'
                                stopColor='#0089ff'
                                stopOpacity={0.8}
                            />
                            <stop
                                offset='95%'
                                stopColor='#0089ff'
                                stopOpacity={0}
                            />
                        </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray='3 3' />
                    <XAxis
                        dataKey='day'
                        tick={showXAxisTicks}
                        interval={30}
                        tickLine={false}
                        tickMargin={10}
                        padding={{ left: 60, right: 20 }}
                    />
                    <YAxis
                        axisLine={false}
                        tick={<YAxisTick />}
                        tickLine={false}
                        padding={{ bottom: 20 }}
                    />
                    <Area
                        type='monotone'
                        dataKey='returns'
                        strokeWidth={0}
                        fill='url(#areaColor)'
                    />
                    <Line
                        type='monotone'
                        dataKey='runningReturn'
                        stroke='#0089ff'
                        strokeWidth={2}
                        dot={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                </ComposedChart>
            </ResponsiveContainer>
        </Card>
    );
}

LPStatsChart.propTypes = { lpStats: LPStats };

function CustomTooltip({ active, payload }) {
    if (!active || !payload) return null;
    const lpStats = {
        totalFees: payload[0].payload.runningFee,
        totalReturn: payload[0].payload.runningReturn,
        impermanentLoss: payload[0].payload.runningImpermanentLoss,
    };

    const tooltipDate = format(payload[0].payload.fullDate, 'MMMM d, yyyy');

    return (
        <LPStatsWidget title={tooltipDate} lpStats={lpStats} />
    );
}

CustomTooltip.propTypes = {
    active: PropTypes.bool,
    payload: PropTypes.array,
};

function YAxisTick({ x, y, stroke = 'none', payload }) {
    return (
        <g className='recharts-layer recharts-cartesian-axis-tick'>
            <text
                width='100'
                height='513'
                x={x}
                y={y}
                stroke={stroke}
                fill='#666'
                className='recharts-text recharts-cartesian-axis-tick-value'
                textAnchor='start'
                fontSize='0.8rem'
            >
                <tspan dx='15' dy='0.355em'>
                    {formatter.format(payload.value)}
                </tspan>
            </text>
        </g>
    );
}

YAxisTick.propTypes = {
    x: PropTypes.number,
    y: PropTypes.number,
    stroke: PropTypes.string,
    payload: PropTypes.object,
};

export default LPStatsChart;
