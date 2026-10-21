import type { AnalysisFrame } from '../types'
import { AUDIO_WINDOW_SECONDS } from '../config/audioLimits'
import { CHART_FONT_SCALE, formatTimePreview } from './chartFormatting'

export function chartTimeWindow(frames: ReadonlyArray<Pick<AnalysisFrame, 'time'>>, retentionSeconds = AUDIO_WINDOW_SECONDS) {
  if (frames.length === 0) return { min: 0, max: retentionSeconds }
  const lastTime = Math.max(0, frames[frames.length - 1].time)
  // 短录音占满可用时间轴；长录音只显示保留窗口，数据时间本身不变。
  return { min: Math.max(0, lastTime - retentionSeconds), max: Math.max(lastTime, 1) }
}

export function chartTimeAxis(frames: ReadonlyArray<Pick<AnalysisFrame, 'time'>>, portrait: boolean, retentionSeconds = AUDIO_WINDOW_SECONDS) {
  return {
    type: 'value',
    ...chartTimeWindow(frames, retentionSeconds),
    splitNumber: portrait ? 3 : 4,
    axisLine: { show: portrait, onZero: false, lineStyle: { color: portrait ? '#B8C4D1' : '#D0D5DD' } },
    axisLabel: {
      show: true,
      color: '#7D8DA8',
      fontSize: (portrait ? 10 : 11) * CHART_FONT_SCALE,
      hideOverlap: true,
      formatter: (time: number) => `${time.toFixed(1)} s`,
    },
    axisPointer: {
      label: {
        show: true,
        fontSize: 12 * CHART_FONT_SCALE,
        formatter: ({ value }: { value: unknown }) => formatTimePreview(value),
      },
    },
    splitLine: { lineStyle: { color: portrait ? '#EDF2F7' : '#F2F4F7' } },
  }
}
