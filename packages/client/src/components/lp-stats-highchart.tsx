import { Card } from 'react-bootstrap';
import BigNumber from 'bignumber.js';
import { format } from 'date-fns';

import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import HCMore from 'highcharts/highcharts-more';
HCMore(Highcharts);

import { LPStats as ILPStats } from '@sommelier/shared-types';

import LPStatsWidget from 'components/lp-stats-widget';
import { LPStats } from 'constants/prop-types';
import { formatUSD } from 'util/formats';

// interface LPStatsDataPoint {
//     fullDate?: Date;
//     dateStr?: string;
//     tick: string;
//     runningFee: number;
//     runningReturn: number;
//     runningImpermanentLoss: number;
//     returns: [number, number];
// }

type LPStatsDataPoint = [number, number, number];

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

        chartData.push([
            lpStats.fullDates?.[i].getTime() as number,
            runningFee,
            runningReturn,
        ]);

        // chartData.push({
        //     fullDate: lpStats.fullDates?.[i],
        //     dateStr: lpStats.fullDates?.[i]?.toISOString(),
        //     tick: lpStats.ticks[i],
        //     runningFee,
        //     runningReturn,
        //     runningImpermanentLoss: new BigNumber(
        //         lpStats.runningImpermanentLoss[i]
        //     ).toNumber(),
        //     returns: [runningFee, runningReturn],
        // });
    });

    (window as any).chartData = chartData;

    const options: Highcharts.Options = {
        chart: {
            type: 'areaspline',
            height: 563,
        },
        credits: {
            enabled: false,
        },
        title: { text: undefined },
        xAxis: {
            type: 'datetime',
            title: {
                text: null,
            },
        },
        rangeSelector: {
            selected: 5,
        },
        yAxis: {
            title: {
                text: null,
            },
            labels: {
                formatter: function () {
                    return formatUSD(this.value);
                },
            },
            tickPosition: 'outside',
        },
        series: [
            {
                type: 'areasplinerange',
                data: chartData,
                marker: { enabled: false },
            },
            {
                type: 'line',
                data: chartData.map((c) => [c[0], c[2]]),
                color: '#0089ff',
                marker: { enabled: false },
            },
        ],
        legend: {
            enabled: false,
        },
        tooltip: {
            split: false,
            shared: true,
            formatter: function () {
                console.log('HELLO', this);
                const impermanentLoss =
                    (this?.points?.[0].y || 0) - (this?.points?.[1].y || 0);
                const date = format(new Date(this.x), 'MMMM d, yyyy HH:mm:ss');

                return `
                    <em>${date}</em><br><br>
                    <b>Fees Collected:</b> ${formatUSD(
                        this?.points?.[0].y || 0
                    )}<br>
                    <b>Impermanent Loss:</b> ${formatUSD(impermanentLoss)}<br>
                    <b>Total Return:</b> ${formatUSD(
                        this?.points?.[1].y || 0
                    )}<br>
                `;
            },
        },
        responsive: {
            rules: [
                {
                    condition: {
                        maxWidth: 800,
                    },
                    chartOptions: {
                        rangeSelector: {
                            inputEnabled: false,
                        },
                    },
                },
            ],
        },
    };

    return (
        <Card body className='no-border'>
            <HighchartsReact
                constructorType='stockChart'
                highcharts={Highcharts}
                options={options}
            />
        </Card>
    );
}

LPStatsChart.propTypes = { lpStats: LPStats };

export default LPStatsChart;
