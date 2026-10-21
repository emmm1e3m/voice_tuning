import { useRef, useEffect } from 'react'
import { useECharts } from '../hooks/useECharts'
import { useAppStore } from '../store/appStore'
import { validFrequency } from '../utils/frequencyChart'
import { chartTimeAxis } from '../utils/chartTimeline'
import { CHART_FONT_SCALE, formatFrequencyPreview, formatTimePreview } from '../utils/chartFormatting'
import type { AnalysisFrame } from '../types'
import {
  freqToMidi,
  midiToFreq,
  midiToName,
  isNaturalMidi,
  MIDI_C2,
  MIDI_C4,
  MIDI_B5,
  MIDI_G2,
  MIDI_E5,
} from '../utils/pitch'

const GRID_MIDI: number[] = (() => {
  const out: number[] = []
  for (let m = MIDI_G2; m <= MIDI_E5; m++) {
    if (m !== MIDI_C4 && isNaturalMidi(m)) out.push(m)
  }
  return out
})()

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function findFrameAtTime(frames: AnalysisFrame[], time: number): AnalysisFrame | null {
  let best: AnalysisFrame | null = null
  let bestDist = Infinity
  for (const f of frames) {
    const d = Math.abs(f.time - time)
    if (d < bestDist) {
      bestDist = d
      best = f
    }
  }
  return bestDist <= 0.005 ? best : null
}

export function formatPitchTooltip(params: any, frames: AnalysisFrame[], layout: 'landscape' | 'portrait' = 'landscape'): string {
  if (!params || params.length === 0) return ''
  const p = params[0]
  const time = p.value?.[0]
  const frame = typeof time === 'number' ? findFrameAtTime(frames, time) : null
  let pitchText = '--'
  let frequency: number | null = null
  const compact = layout === 'portrait'
  if (frame && validFrequency(frame.f0) !== null) {
    pitchText = midiToName(freqToMidi(frame.f0!))
    frequency = frame.f0
  } else if (!frame) {
    const value = p.value?.[1]
    if (value != null && Number.isFinite(value)) {
      pitchText = midiToName(value)
      frequency = midiToFreq(value)
    }
  }
  return `<div style="font-size:${(compact ? 10 : 11) * CHART_FONT_SCALE}px;color:#667085;margin-bottom:4px;">时间 ${formatTimePreview(time)}</div>
<div style="display:flex;align-items:center;gap:6px;font-size:${(compact ? 11 : 12) * CHART_FONT_SCALE}px;color:#1F2937;line-height:${compact ? 1.6 : 1.8};">
  <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#8b67c5;"></span>
  <span style="flex:0 0 auto;color:#475467;">音高</span>
  <span style="margin-left:auto;font-variant-numeric:tabular-nums;font-weight:600;">♬ ${pitchText}${frequency === null ? '' : ` · ${formatFrequencyPreview(frequency)}`}</span>
</div>`
}

interface PitchChartProps {
  cursorTime?: number
  layout?: 'landscape' | 'portrait'
}

export function PitchChart({ cursorTime = -1, layout = 'landscape' }: PitchChartProps) {
  const frames = useAppStore(s => s.frames)
  const retentionSeconds = useAppStore(s => s.config.audioRetentionSeconds)
  const { chartRef, setOption } = useECharts()
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      renderChart(frames, cursorTime)
      rafRef.current = null
    })
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [frames, layout, retentionSeconds]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    renderChart(frames, cursorTime)
  }, [cursorTime, layout, retentionSeconds]) // eslint-disable-line react-hooks/exhaustive-deps

  function renderChart(data: AnalysisFrame[], cursor: number) {
    const seriesData = data.map(f => validFrequency(f.f0) !== null
      ? [f.time, freqToMidi(f.f0!)]
      : [f.time, null])
    const compact = layout === 'portrait'

    setOption({
      animation: false,
      backgroundColor: 'transparent',
      textStyle: { fontSize: 12 * CHART_FONT_SCALE },
      grid: compact
        ? { left: 24, right: 12, top: 16, bottom: 28 }
        : { left: 60, right: 32, top: 20, bottom: 30 },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross', label: { backgroundColor: '#475467', fontSize: 12 * CHART_FONT_SCALE } },
        formatter: (params: any) => formatPitchTooltip(params, data, layout),
      },
      xAxis: chartTimeAxis(data, compact, retentionSeconds),
      yAxis: {
        type: 'value',
        min: MIDI_G2,
        max: MIDI_E5,
        minInterval: 1,
        maxInterval: 1,
        axisLine: { lineStyle: { color: '#D0D5DD' } },
        axisTick: { show: false },
        axisLabel: {
          color: '#667085',
          fontSize: (compact ? 10 : 11) * CHART_FONT_SCALE,
          formatter: (v: number) => isNaturalMidi(v) ? midiToName(v) : '',
        },
        axisPointer: {
          label: {
            show: true,
            fontSize: 12 * CHART_FONT_SCALE,
            formatter: ({ value }: { value: unknown }) => typeof value === 'number' && Number.isFinite(value)
              ? formatFrequencyPreview(midiToFreq(value)) : '--',
          },
        },
        splitLine: { show: false },
      },
      color: ['#8b67c5'],
      series: [
        {
          name: 'PITCH',
          type: 'line' as const,
          showSymbol: false,
          connectNulls: false,
          lineStyle: { color: '#8b67c5', width: 2 },
          itemStyle: { color: '#8b67c5' },
          markArea: {
            silent: true,
            data: [[{
              yAxis: MIDI_C2,
              itemStyle: { color: hexToRgba('#8b67c5', 0.05) },
            }, { yAxis: MIDI_B5 }]],
          },
          markLine: {
            silent: true,
            symbol: 'none',
            data: [
              ...GRID_MIDI.map(m => ({
                yAxis: m,
                lineStyle: { color: '#E4E7EC', width: 1 },
                label: { show: false },
              })),
              {
                yAxis: MIDI_C4,
                lineStyle: { color: hexToRgba('#8b67c5', 0.45), type: 'dashed' as const, width: 1 },
                label: { formatter: 'C4', color: '#667085', fontSize: (compact ? 10 : 11) * CHART_FONT_SCALE, position: 'insideEndTop' },
              },
            ],
          },
          data: seriesData,
        },
        {
          name: '__cursor',
          type: 'line' as const,
          showSymbol: false,
          data: [],
          markLine: cursor >= 0 ? {
            silent: true,
            symbol: 'none',
            lineStyle: { color: '#8b67c5', width: 2, type: 'solid' as const },
            label: { show: false },
            data: [{ xAxis: cursor }],
          } : undefined,
        },
      ],
    } as any)
  }

  useEffect(() => {
    renderChart(frames, cursorTime)
  }, [layout]) // eslint-disable-line react-hooks/exhaustive-deps

  return <div id="pitchChart" ref={chartRef} />
}
