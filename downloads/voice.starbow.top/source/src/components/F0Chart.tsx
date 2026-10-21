import { useRef, useEffect } from 'react'
import { useECharts } from '../hooks/useECharts'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useAppStore } from '../store/appStore'
import { useChartDisplayStore } from '../store/chartDisplayStore'
import type { AnalysisFrame } from '../types'
import { F0_CHART_RANGE } from '../config/analysisRanges'
import { FREQUENCY_COLORS, frequencyAxis, frequencyColor, validFrequency, validFrequencyRange } from '../utils/frequencyChart'
import { chartTimeAxis } from '../utils/chartTimeline'
import { CHART_FONT_SCALE, formatFrequencyPreview, formatTimePreview } from '../utils/chartFormatting'
import { getBandCenter } from '../config/targetBandRules'

const COLOR = FREQUENCY_COLORS.f0

function findFrameAtTime(frames: AnalysisFrame[], time: number): AnalysisFrame | null {
  let best: AnalysisFrame | null = null
  let bestDist = Infinity
  for (const frame of frames) {
    const distance = Math.abs(frame.time - time)
    if (distance < bestDist) { bestDist = distance; best = frame }
  }
  return bestDist <= 0.005 ? best : null
}

export function formatF0Tooltip(params: any, frames: AnalysisFrame[]): string {
  if (!params || params.length === 0) return ''
  const time = params[0].value?.[0]
  const frame = typeof time === 'number' ? findFrameAtTime(frames, time) : null
  const f0 = validFrequency(frame ? frame.f0 : params[0].value?.[1])
  return `<div style="font-size:${11 * CHART_FONT_SCALE}px;color:#667085;margin-bottom:4px;">时间 ${formatTimePreview(time)}</div>
<div style="display:flex;align-items:center;gap:6px;font-size:${12 * CHART_FONT_SCALE}px;color:#1F2937;line-height:1.8;">
  <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${COLOR};"></span>
  <span style="flex:0 0 auto;color:#475467;">F0</span>
  <span style="margin-left:auto;font-variant-numeric:tabular-nums;font-weight:600;">${formatFrequencyPreview(f0)}</span>
</div>`
}

interface F0ChartProps { cursorTime?: number }

export function F0Chart({ cursorTime = -1 }: F0ChartProps) {
  const frames = useAppStore(s => s.frames)
  const band = useAppStore(s => s.bands.f0)
  const retentionSeconds = useAppStore(s => s.config.audioRetentionSeconds)
  const scale = useChartDisplayStore(s => s.frequencyScale)
  const { chartRef, setOption } = useECharts()
  const isPortrait = useMediaQuery('(max-width: 768px)')
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      renderChart()
      rafRef.current = null
    })
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current) }
  }, [frames, band, scale, isPortrait, retentionSeconds]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { renderChart() }, [cursorTime, band, scale, isPortrait, retentionSeconds]) // eslint-disable-line react-hooks/exhaustive-deps

  function renderChart() {
    const seriesData = frames.map(frame => [frame.time, validFrequency(frame.f0)])
    const lastDot = [...frames].reverse().find(frame => validFrequency(frame.f0) !== null)
    const hasTarget = validFrequencyRange(band.range, scale)

    setOption({
      animation: false,
      backgroundColor: 'transparent',
      textStyle: { fontSize: 12 * CHART_FONT_SCALE },
      grid: isPortrait ? { left: 54, right: 12, top: 16, bottom: 28 } : { left: 72, right: 32, top: 20, bottom: 30 },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross', label: { backgroundColor: '#475467', fontSize: 12 * CHART_FONT_SCALE } },
        formatter: (params: any) => formatF0Tooltip(params, frames),
      },
      xAxis: chartTimeAxis(frames, isPortrait, retentionSeconds),
      yAxis: frequencyAxis(scale, F0_CHART_RANGE.max, isPortrait, [...seriesData.map(point => point[1]), ...band.range]),
      color: [COLOR],
      series: [
        {
          name: 'F0', type: 'line', showSymbol: false, connectNulls: false,
          lineStyle: { color: COLOR, width: 2 }, itemStyle: { color: COLOR },
          markArea: hasTarget ? { silent: true, data: [[
            { yAxis: band.range[0], itemStyle: { color: frequencyColor(COLOR, 0.08) } },
            { yAxis: band.range[1] },
          ]] } : undefined,
          markLine: hasTarget ? {
            silent: true, symbol: 'none', data: [{
              yAxis: getBandCenter(band.range),
              lineStyle: { color: frequencyColor(COLOR, 0.5), type: 'dashed', width: 1 },
              label: { formatter: 'F0 目标', color: COLOR, fontSize: 11 * CHART_FONT_SCALE, position: 'insideEndTop' },
            }],
          } : undefined,
          markPoint: isPortrait && lastDot ? {
            silent: true, symbol: 'circle', symbolSize: 7,
            itemStyle: { color: COLOR, shadowBlur: 12, shadowColor: frequencyColor(COLOR, 0.25) },
            data: [{ coord: [lastDot.time, lastDot.f0], symbolSize: 7 }],
          } : undefined,
          data: seriesData,
        },
        {
          name: '__cursor', type: 'line', showSymbol: false, data: [],
          markLine: cursorTime >= 0 ? {
            silent: true, symbol: 'none', lineStyle: { color: '#a58bba', width: 2, type: 'solid' },
            label: { show: false }, data: [{ xAxis: cursorTime }],
          } : undefined,
        },
      ],
    } as any, { notMerge: true })
  }

  return <div id="f0Chart" ref={chartRef} />
}
