import { useRef, useEffect } from 'react'
import { useECharts } from '../hooks/useECharts'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useAppStore } from '../store/appStore'
import { useChartDisplayStore } from '../store/chartDisplayStore'
import type { AnalysisFrame } from '../types'
import { FORMANT_CHART_RANGE } from '../config/analysisRanges'
import { FREQUENCY_COLORS, frequencyAxis, frequencyColor, validFrequency, validFrequencyRange } from '../utils/frequencyChart'
import { chartTimeAxis } from '../utils/chartTimeline'
import { CHART_FONT_SCALE, formatFrequencyPreview, formatTimePreview } from '../utils/chartFormatting'
import { getBandCenter } from '../config/targetBandRules'
import { REGISTER_COLORS, registerSegments } from '../utils/registerSegments'
import { VOICE_REGISTER_LABELS } from '../feedback/register'

const KEYS = ['f0', 'f1', 'f2'] as const

interface FormantChartProps {
  cursorTime?: number
  onFrameClick?: (frame: AnalysisFrame) => void
}

export function FormantChart({ cursorTime = -1, onFrameClick }: FormantChartProps) {
  const frames = useAppStore(s => s.frames)
  const bands = useAppStore(s => s.bands)
  const visible = useAppStore(s => s.formantVisible)
  const retentionSeconds = useAppStore(s => s.config.audioRetentionSeconds)
  const scale = useChartDisplayStore(s => s.frequencyScale)
  const showRegister = useChartDisplayStore(s => s.showRegister)
  const { chartRef, setOption, getInstance } = useECharts()
  const isPortrait = useMediaQuery('(max-width: 768px)')
  const hasFrameClick = Boolean(onFrameClick)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      renderChart()
      rafRef.current = null
    })
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current) }
  }, [frames, bands, visible, scale, showRegister, isPortrait, hasFrameClick, retentionSeconds]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    renderChart()
  }, [cursorTime, bands, visible, scale, showRegister, isPortrait, hasFrameClick, retentionSeconds]) // eslint-disable-line react-hooks/exhaustive-deps

  // 点击仍按原始时间查找数据帧，切换坐标轴不影响回放或选帧。
  useEffect(() => {
    const instance = getInstance()
    if (!instance || !onFrameClick) return
    const handler = (params: any) => {
      const time = params.value?.[0]
      if (typeof time !== 'number') return
      let best: AnalysisFrame | null = null
      let distance = Infinity
      for (const frame of useAppStore.getState().frames) {
        const candidate = Math.abs(frame.time - time)
        if (candidate < distance) { distance = candidate; best = frame }
      }
      if (best) onFrameClick(best)
    }
    instance.on('click', handler)
    return () => { instance.off('click', handler) }
  }, [getInstance, onFrameClick])

  function renderChart() {
    const voiceSegments = showRegister ? registerSegments(frames) : []
    const seriesData = Object.fromEntries(KEYS.map(key => [
      key, visible[key] ? frames.map(frame => [frame.time, validFrequency(frame[key])]) : [],
    ])) as Record<typeof KEYS[number], Array<[number, number | null]>>
    const frequencies = KEYS.flatMap(key => visible[key]
      ? [...seriesData[key].map(point => point[1]), ...bands[key].range] : [])

    setOption({
      animation: false,
      backgroundColor: 'transparent',
      textStyle: { fontSize: 12 * CHART_FONT_SCALE },
      grid: isPortrait ? { left: 58, right: 12, top: 16, bottom: 28 } : { left: 72, right: 32, top: 20, bottom: 30 },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross', label: { backgroundColor: '#475467', fontSize: 12 * CHART_FONT_SCALE } },
        formatter: (params: any) => {
          if (!params || params.length === 0) return ''
          const time = params[0].value?.[0]
          const byName = Object.fromEntries(params.map((param: any) => [param.seriesName, param]))
          let html = `<div style="font-size:${11 * CHART_FONT_SCALE}px;color:#667085;margin-bottom:4px;">时间 ${formatTimePreview(time)}</div>`
          for (const key of [...KEYS].reverse()) {
            if (!visible[key]) continue
            const value = validFrequency(byName[key.toUpperCase()]?.value?.[1])
            html += `<div style="display:flex;align-items:center;gap:6px;font-size:${12 * CHART_FONT_SCALE}px;color:#1F2937;line-height:1.8;">
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${FREQUENCY_COLORS[key]};"></span>
              <span style="flex:0 0 auto;color:#475467;">${key.toUpperCase()}</span>
              <span style="margin-left:auto;font-variant-numeric:tabular-nums;font-weight:600;">${formatFrequencyPreview(value)}</span>
            </div>`
          }
          if (showRegister && typeof time === 'number') {
            const segment = voiceSegments.find(item => time >= item.start && time <= item.end)
            html += `<div style="color:#667085;margin-top:4px;">声区估计：${segment ? VOICE_REGISTER_LABELS[segment.register] : '暂无'}</div>`
          }
          return html
        },
      },
      xAxis: chartTimeAxis(frames, isPortrait, retentionSeconds),
      yAxis: frequencyAxis(scale, FORMANT_CHART_RANGE.max, isPortrait, frequencies),
      color: KEYS.map(key => FREQUENCY_COLORS[key]),
      series: [
        {
          name: '__register', type: 'line', data: [], silent: true, z: 0,
          markArea: { silent: true, label: { show: false }, data: voiceSegments.map(segment => [
            { name: VOICE_REGISTER_LABELS[segment.register], xAxis: segment.start, itemStyle: { color: REGISTER_COLORS[segment.register], opacity: 0.13 } },
            { xAxis: segment.end },
          ]) },
        },
        ...KEYS.map(key => {
          const color = FREQUENCY_COLORS[key]
          const range = bands[key].range
          const hasTarget = visible[key] && validFrequencyRange(range, scale)
          return {
            name: key.toUpperCase(), type: 'line', showSymbol: isPortrait,
            // 连续线段不堆叠圆点，孤立的有效帧仍然可见。
            symbol: isPortrait && !hasFrameClick
              ? (_value: unknown, { dataIndex }: { dataIndex: number }) => {
                const points = seriesData[key]
                if (!Number.isFinite(points[dataIndex]?.[1])) return 'none'
                return Number.isFinite(points[dataIndex - 1]?.[1]) || Number.isFinite(points[dataIndex + 1]?.[1])
                  ? 'none' : 'circle'
              } : 'circle',
            symbolSize: 2, connectNulls: false,
            lineStyle: { color, width: key === 'f0' ? 2 : 1.5 },
            itemStyle: { color, opacity: 1 },
            markArea: hasTarget ? { silent: true, data: [[
              { yAxis: range[0], itemStyle: { color: frequencyColor(color, 0.08) } },
              { yAxis: range[1] },
            ]] } : undefined,
            markLine: hasTarget ? {
              silent: true, symbol: 'none',
              lineStyle: { color: frequencyColor(color, 0.5), type: 'dashed', width: 1 },
              label: { formatter: `${key.toUpperCase()} 目标`, color, fontSize: 11 * CHART_FONT_SCALE, position: key === 'f1' ? 'insideEndBottom' : 'insideEndTop' },
              data: [{ yAxis: getBandCenter(range) }],
            } : undefined,
            data: seriesData[key],
          }
        }),
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

  return <div id="formantChart" ref={chartRef} />
}
