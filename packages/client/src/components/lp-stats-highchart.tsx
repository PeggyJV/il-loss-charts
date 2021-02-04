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

// interface AreaChartDataPoint {
//     fullDate?: Date;
//     dateStr?: string;
//     tick: string;
//     runningFee: number;
//     runningReturn: number;
//     runningImpermanentLoss: number;
//     returns: [number, number];
// }

type AreaChartDataPoint = [number, number, number];
type BarChartDataPoint = [number, number];

function LPStatsChart({
    lpStats,
}: {
    lpStats: ILPStats<BigNumber | string>;
}): JSX.Element {
    const chartData: AreaChartDataPoint[] = [];
    const volChartData: BarChartDataPoint[] = [];
    const liqChartData: BarChartDataPoint[] = [];

    (window as any).lpStats = lpStats;

    lpStats.ticks.forEach((stats, i) => {
        const runningFee = new BigNumber(lpStats.runningFees[i]).toNumber();
        const runningReturn = new BigNumber(
            lpStats.runningReturn[i]
        ).toNumber();

        const date = lpStats.fullDates?.[i].getTime() as number;

        chartData.push([date, runningFee, runningReturn]);

        volChartData.push([
            date,
            new BigNumber(lpStats.dailyVolume[i]).toNumber(),
        ]);
        liqChartData.push([
            date,
            new BigNumber(lpStats.dailyLiquidity[i]).toNumber(),
        ]);
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
        yAxis: [
            {
                title: {
                    text: null,
                },
                height: '80%',
                labels: {
                    formatter: function () {
                        return formatUSD(this.value);
                    },
                },
                tickPosition: 'outside',
            },
            {
                title: {
                    text: null,
                },
                top: '80%',
                height: '20%',
                offset: 0,
                labels: {
                    formatter: function () {
                        return this.value.toFixed(3);
                    },
                },
                tickPosition: 'outside',
            },
        ],
        series: [
            {
                name: 'Fees Collected',
                type: 'areasplinerange',
                data: chartData,
                marker: { enabled: false },
                yAxis: 0,
            },
            {
                name: 'Total Return',
                type: 'line',
                data: chartData.map((c) => [c[0], c[2]]),
                color: '#0089ff',
                marker: { enabled: false },
                yAxis: 0,
            },
            {
                color: '#71BA63',
                name: 'USD Volume',
                type: 'column',
                data: volChartData,
                yAxis: 1,
            },
            {
                color: '#90ED7D',
                name: 'Total Pool Liquidity',
                type: 'column',
                data: liqChartData,
                yAxis: 1,
            },
        ],
        legend: {
            enabled: true,
        },
        tooltip: {
            split: false,
            shared: true,
            formatter: function (tooltip) {
                if (!this.points) {
                    return tooltip.defaultFormatter.call(this, tooltip);
                }

                const feesPoint = this.points.find(
                    (p) => p.series.name === 'Fees Collected'
                );
                const returnPoint = this.points.find(
                    (p) => p.series.name === 'Total Return'
                );
                const calculatedIl =
                    feesPoint && returnPoint && feesPoint.y - returnPoint.y;
                const volPoint = this.points.find(
                    (p) => p.series.name === 'USD Volume'
                );
                const liqPoint = this.points.find(
                    (p) => p.series.name === 'Total Pool Liquidity'
                );

                // Format data and call default formatter
                const date = format(new Date(this.x), 'MMMM d, yyyy HH:mm:ss');

                return `
                    <em>${date}</em><br><br>
                    ${
                        feesPoint
                            ? `<span style="color:${
                                  feesPoint.color as string
                              };">\u25CF</span><b> Fees Collected:</b> ${formatUSD(
                                  feesPoint.y
                              )}<br>`
                            : ''
                    }
                    ${
                        calculatedIl
                            ? `<span style="color:${
                                  feesPoint?.color as string
                              };">\u25CF</span><b> Impermanent Loss:</b> ${formatUSD(
                                  calculatedIl
                              )}<br>`
                            : ''
                    }
                    ${
                        returnPoint
                            ? `<span style="color:${
                                  returnPoint.color as string
                              };">\u25CF</span><b> Total Return:</b> ${formatUSD(
                                  returnPoint.y
                              )}<br><br>`
                            : ''
                    }
                    ${
                        volPoint
                            ? `<span style="color:${
                                  volPoint.color as string
                              };">\u25CF</span><b> Pool Volume:</b> ${formatUSD(
                                  volPoint.y
                              )}<br>`
                            : ''
                    }
                    ${
                        liqPoint
                            ? `<span style="color:${
                                  liqPoint.color as string
                              };">\u25CF</span><b> Pool Liquidity:</b> ${formatUSD(
                                  liqPoint.y
                              )}<br>`
                            : ''
                    }
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