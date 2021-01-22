import { Card } from 'react-bootstrap';
import {
    VictoryChart,
    VictoryArea,
    VictoryLine,
    VictoryAxis,
    VictoryLabel,
    VictoryVoronoiContainer,
    VictoryTheme,
    VictoryTooltip,
    LineSegment,
} from 'victory';

import { LPStats } from 'constants/prop-types';
import { formatUSD } from 'util/formats';

function formatTooltipText({
    runningFee,
    runningReturn,
    runningImpermanentLoss,
    day,
}) {
    return [
        `${day}`,
        `Total Fees: ${formatUSD(runningFee)}`,
        `Impermanent Loss: ${formatUSD(runningImpermanentLoss)}`,
        `Total Return: ${formatUSD(runningReturn)}`,
    ].join('\n');
}

function LPStatsChart({ lpStats }) {
    const chartData = [];
    for (const i in lpStats.days) {
        const runningFee = lpStats.runningFees[i].toNumber();
        const runningReturn = lpStats.runningReturn[i].toNumber();

        chartData.push({
            day: lpStats.days[i],
            runningFee,
            runningReturn,
            runningImpermanentLoss: lpStats.runningImpermanentLoss[
                i
            ].toNumber(),
            returns: [runningFee, runningReturn],
        });
    }

    return (
        <Card body className='chart-card no-border'>
            <svg style={{ height: 0 }}>
                <defs>
                    <linearGradient id='areaColor' x1='0' y1='0' x2='0' y2='1'>
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
            </svg>
            <VictoryChart
                theme={VictoryTheme.material}
                animate={{ duration: 1000 }}
                domainPadding={10}
                containerComponent={
                    <VictoryVoronoiContainer
                        mouseFollowTooltips
                        voronoiDimension='x'
                    />
                }
                width={1450}
                height={563}
            >
                <VictoryAxis
                    crossAxis
                    fixLabelOverlap={true}
                    offsetY={50}
                    style={{
                        grid: { strokeWidth: 0 },
                    }}
                />
                <VictoryAxis
                    dependentAxis
                    tickLabelComponent={
                        <VictoryLabel dx={18} textAnchor='start' />
                    }
                    tickFormat={formatUSD}
                    style={{
                        ticks: { size: 0 },
                        tickLabels: { fontSize: 11 },
                    }}
                    gridComponent={<LineSegment type={'grid'} />}
                />
                <VictoryArea
                    labelComponent={
                        <VictoryTooltip
                            cornerRadius={0}
                            pointerLength={0}
                            style={{ textAnchor: 'start' }}
                        />
                    }
                    labels={({ datum }) => formatTooltipText(datum)}
                    interpolation='natural'
                    data={chartData}
                    style={{ data: { fill: 'url(#areaColor)' } }}
                    x='day'
                    y='runningFee'
                    y0='runningReturn'
                />
                <VictoryLine
                    interpolation='natural'
                    data={chartData}
                    style={{ data: { stroke: '#0089ff', strokeWidth: 2 } }}
                    x='day'
                    y='runningReturn'
                />
            </VictoryChart>
        </Card>
    );
}

LPStatsChart.propTypes = { lpStats: LPStats };

export default LPStatsChart;
