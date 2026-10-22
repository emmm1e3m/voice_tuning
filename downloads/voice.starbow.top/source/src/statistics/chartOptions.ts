import type { EChartsOption } from 'echarts'
import type { PitchSummary } from './types'

const PITCH_COLOR = '#4f83bd'
const PITCH_HOVER_COLOR = '#3d6f9f'
const PITCH_RANGE_COLOR = 'rgba(79,131,189,.11)'

export function buildDistributionOption(summary: PitchSummary, showPercentiles = true): EChartsOption {
  const bins = Array.from({ length: 44 }, (_, index) => {
    const from = 60 + index * 10
    const bin = summary.histogram.find(item => item.from === from)
    return { from, to: from + 10, proportion: bin?.proportion ?? 0 }
  })
  const hasPercentiles = showPercentiles && summary.p10 !== null && summary.p90 !== null

  return {
    animation: false,
    color: [PITCH_COLOR],
    textStyle: {
      fontFamily: '"Segoe UI Variable Text", "Segoe UI", "Microsoft YaHei UI", sans-serif',
      fontSize: 12,
      color: '#5f6b7a',
    },
    grid: { left: 48, right: 20, top: 30, bottom: 46 },
    tooltip: {
      trigger: 'item',
      confine: true,
      backgroundColor: '#ffffff',
      borderColor: '#d8e1eb',
      textStyle: { color: '#24303a', fontSize: 13 },
      formatter: (params: unknown) => {
        const index = (params as { dataIndex: number }).dataIndex
        const bin = bins[index]
        const boundary = bin.to === 500 ? '（含 500）' : ''
        return `${bin.from}–${bin.to} Hz${boundary}<br>有效时长占比 ${(bin.proportion * 100).toFixed(1)}%`
      },
    },
    xAxis: {
      type: 'value',
      min: 60,
      max: 500,
      interval: 20,
      name: 'F0（Hz）',
      nameLocation: 'middle',
      nameGap: 30,
      axisLine: { lineStyle: { color: '#c8d6e7' } },
      axisTick: { show: false },
      axisLabel: {
        color: '#5f6b7a', hideOverlap: true,
        formatter: (value: number) => value === 60 || value % 100 === 0 ? String(value) : '',
      },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      min: 0,
      minInterval: 1,
      name: '有效时长占比',
      nameLocation: 'end',
      nameTextStyle: { align: 'left', color: '#5f6b7a', padding: [0, 0, 0, -38] },
      axisLabel: { formatter: '{value}%', color: '#5f6b7a' },
      splitLine: { lineStyle: { color: '#e8edf4' } },
    },
    series: [{
      name: '有效时长占比',
      type: 'bar',
      data: bins.map(bin => [(bin.from + bin.to) / 2, bin.proportion * 100]),
      barWidth: '88%',
      itemStyle: { color: PITCH_COLOR, borderRadius: [3, 3, 0, 0] },
      emphasis: { itemStyle: { color: PITCH_HOVER_COLOR } },
      markArea: hasPercentiles ? {
        silent: true,
        itemStyle: { color: PITCH_RANGE_COLOR },
        data: [[{ xAxis: summary.p10! }, { xAxis: summary.p90! }]],
      } : undefined,
      markLine: showPercentiles && summary.median !== null ? {
        silent: true,
        symbol: 'none',
        lineStyle: { color: PITCH_COLOR, type: 'dashed', width: 1.5 },
        label: { formatter: '中位数', color: PITCH_HOVER_COLOR, fontSize: 12, position: 'insideEndTop' },
        data: [{ xAxis: summary.median }],
      } : undefined,
    }],
  }
}
