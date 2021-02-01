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
import BigNumber from 'bignumber.js';
import PropTypes from 'prop-types';
import { format } from 'date-fns';

import { LPStats as ILPStats } from '@sommelier/shared-types';

import LPStatsWidget from 'components/lp-stats-widget';
import { LPStats } from 'constants/prop-types';
import { formatUSD } from 'util/formats';

interface LPStatsDataPoint {
    fullDate?: Date;
    dateStr?: string;
    tick: string;
    runningFee: number;
    runningReturn: number;
    runningImpermanentLoss: number;
    returns: [number, number];
}

function LPStatsChart({
    lpStats,
}: {
    lpStats: ILPStats<BigNumber | string>;
}): JSX.Element {
    const chartData: LPStatsDataPoint[] = [];

    lpStats.ticks.forEach((stats, i) => {
        const runningFee = new BigNumber(lpStats.runningFees[i]).toNumber();
        const runningReturn = new BigNumber(
            lpStats.runningReturn[i]
        ).toNumber();

        chartData.push({
            fullDate: lpStats.fullDates?.[i],
            dateStr: lpStats.fullDates?.[i]?.toISOString(),
            tick: lpStats.ticks[i],
            runningFee,
            runningReturn,
            runningImpermanentLoss: new BigNumber(
                lpStats.runningImpermanentLoss[i]
            ).toNumber(),
            returns: [runningFee, runningReturn],
        });
    });

    (window as any).chartData = chartData;

    const showXAxisTicks = window.innerWidth > 700;

    const tickInterval = Math.floor(chartData.length / 10);

    function XAxisTick({
        x,
        y,
        stroke = 'none',
        payload,
    }: {
        x: number;
        y: number;
        stroke: string;
        payload: { value: number; index: number };
    }) {
        console.log('THIS IS PAYLOAD', tickInterval, payload);
        const tickDate = new Date(payload.value);
        const lastVisible = payload.index - tickInterval - 1;
        console.log('THIS IS LAST INTERVAL', lastVisible);

        let printDay;
        if (lastVisible >= 0) {
            const lastTick = chartData[lastVisible];
            const currentDay = new Date(payload.value).getDay();
            const lastDay = lastTick.fullDate?.getDay();

            if (currentDay !== lastDay) {
                printDay = true;
            }
        } else {
            printDay = true;
        }

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
                    textAnchor='middle'
                    fontSize='0.8rem'
                >
                    <tspan dx='15' dy='0.355em'>
                        {format(tickDate, 'HH:mm')}
                    </tspan>
                    {printDay && (
                        <tspan dx='-37' dy='1.355em'>
                            {format(tickDate, 'MMM d')}
                        </tspan>
                    )}
                </text>
            </g>
        );
    }

    XAxisTick.propTypes = {
        x: PropTypes.number,
        y: PropTypes.number,
        stroke: PropTypes.string,
        payload: PropTypes.object,
        tickInterval: PropTypes.number,
    };

    return (
        <Card body className='no-border'>
            <ResponsiveContainer width='100%' height={563}>
                <ComposedChart
                    data={chartData}
                    margin={{ top: 10, right: 10, bottom: 10, left: -50 }}
                    // padding={{ left: -100 }}
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
                        dataKey='dateStr'
                        tick={showXAxisTicks && XAxisTick}
                        interval={tickInterval}
                        tickLine={false}
                        tickMargin={10}
                        padding={{ left: 60, right: 20 }}
                    />
                    <YAxis
                        axisLine={false}
                        tick={YAxisTick}
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
                    <Tooltip content={CustomTooltip} />
                </ComposedChart>
            </ResponsiveContainer>
        </Card>
    );
}

LPStatsChart.propTypes = { lpStats: LPStats };

function CustomTooltip({
    active,
    payload,
}: {
    active: boolean;
    payload: [{ payload: LPStatsDataPoint }];
}) {
    if (!active || !payload) return null;
    const lpStats = {
        totalFees: new BigNumber(payload[0].payload.runningFee),
        totalReturn: new BigNumber(payload[0].payload.runningReturn),
        impermanentLoss: new BigNumber(
            payload[0].payload.runningImpermanentLoss
        ),
    };

    if (!payload[0].payload.fullDate) {
        throw new Error(
            `Could not render tooltip - data point did not have fullDate`
        );
    }

    const tooltipDate = format(
        new Date(payload[0].payload.fullDate),
        'MMMM d, yyyy'
    );
    const tooltipTime = format(
        new Date(payload[0].payload.fullDate),
        'HH:mm:ss'
    );

    return (
        <LPStatsWidget
            title={tooltipDate}
            subtitle={tooltipTime}
            lpStats={lpStats as Partial<ILPStats>}
        />
    );
}

CustomTooltip.propTypes = {
    active: PropTypes.bool,
    payload: PropTypes.array,
};
function YAxisTick({
    x,
    y,
    stroke = 'none',
    payload,
}: {
    x: number;
    y: number;
    stroke: string;
    payload: { value: number };
}) {
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
                    {formatUSD(payload.value)}
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
