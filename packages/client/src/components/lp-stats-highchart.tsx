import { Card } from 'react-bootstrap';
import BigNumber from 'bignumber.js';
import { format } from 'date-fns';

import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import HCMore from 'highcharts/highcharts-more';
HCMore(Highcharts);

import { LPStats as ILPStats } from '@sommelier/shared-types';
import { LPStats } from 'constants/prop-types';
import { formatUSD } from 'util/formats';

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

        const date = new Date(
            lpStats.fullDates?.[i] as Date | number
        ).getTime();

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
            height: 500,
            backgroundColor: 'var(--bgContainer)',
            margin: [0, 50, 100, 50],
            className: 'chart-base-styles',
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
            labels: {
                style: {
                    color: 'var(--faceSecondary)',
                },
            },
        },
        rangeSelector: {
            // selected: 5,
            inputEnabled: false,
            enabled: false,
        },
        navigator: {
            enabled: false,
        },
        scrollbar: {
            enabled: false,
        },
        plotOptions: {
            areasplinerange: {
                fillColor: {
                    linearGradient: {
                        x1: 0,
                        y1: 0,
                        x2: 0,
                        y2: 1,
                    },
                    stops: [
                        [0, 'var(--bgSecondary)'],
                        [
                            1,
                            Highcharts.color(
                                Highcharts.getOptions().colors?.[0] as string
                            )
                                .setOpacity(0)
                                .get('rgba') as string,
                        ],
                    ],
                },
            },
        },
        yAxis: [
            {
                title: {
                    text: null,
                },
                height: '80%',
                labels: {
                    style: {
                        color: 'var(--faceSecondary)',
                    },
                    formatter: function () {
                        return formatUSD(this.value);
                    },
                },
                tickPosition: 'outside',
                gridLineColor: 'var(--bgMain)',
            },
            {
                visible: false,
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
                color: 'var(--faceMoon)',
            },
            {
                name: 'Total Return',
                type: 'spline',
                data: chartData.map((c) => [c[0], c[2]]),
                color: 'var(--faceAccentAlt)',
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
                color: 'var(--faceAccentAlt)',
                name: 'Total Pool Liquidity',
                type: 'column',
                data: liqChartData,
                yAxis: 1,
            },
        ],
        legend: {
            enabled: true,
            itemStyle: {
                color: 'var(--faceSecondary)',
            },
        },
        tooltip: {
            split: false,
            shared: true,
            backgroundColor: 'var(--bgDeep)',
            borderColor: 'var(--borderMain)',
            borderRadius: 0,
            style: {
                color: 'var(--faceSecondary)',
            },
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
                    <strong>${date}</strong><br><br>
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
                        chart: {
                            margin: [0, 5, 150, 5],
                        },
                        rangeSelector: {
                            inputEnabled: false,
                        },
                    },
                },
            ],
        },
    };

    return (
        <HighchartsReact
            constructorType='stockChart'
            highcharts={Highcharts}
            options={options}
        />
    );
}

LPStatsChart.propTypes = { lpStats: LPStats };

export default LPStatsChart;
