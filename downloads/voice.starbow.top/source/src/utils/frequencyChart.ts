import type { FrequencyScale } from '../store/chartDisplayStore'
import { CHART_FONT_SCALE, formatFrequencyPreview } from './chartFormatting'

export const FREQUENCY_COLORS = {
  f0: '#8b67c5',
  f1: '#d76e97',
  f2: '#5c92c7',
} as const

// 缺失或无效频率保留为断点，不能为了对数轴将它们夹到任意正数。
export function validFrequency(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
}

export function frequencyColor(hex: string, alpha: number): string {
  const rgb = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16))
  return `rgba(${rgb.join(', ')}, ${alpha})`
}

export function validFrequencyRange(range: readonly number[], scale: FrequencyScale = 'log'): boolean {
  return range.length === 2 && Number.isFinite(range[0])
    && (scale === 'log' ? range[0] > 0 : range[0] >= 0)
    && validFrequency(range[1]) !== null && range[0] < range[1]
}

export function frequencyAxis(
  scale: FrequencyScale,
  defaultMax: number,
  portrait: boolean,
  frequencies: Array<number | null>,
) {
  let min = 50
  let max = defaultMax
  for (const value of frequencies) {
    if (validFrequency(value) === null) continue
    min = Math.min(min, value!)
    max = Math.max(max, value!)
  }
  return {
    type: scale === 'log' ? 'log' : 'value',
    logBase: 2,
    min: scale === 'log' ? min : 0,
    max: Math.ceil(max / 100) * 100,
    // logBase=2 使每次频率翻倍占据相同高度；数据始终是 Hz。
    ...(scale === 'log' ? { interval: 1 } : { splitNumber: portrait ? 4 : 6 }),
    axisLine: { show: portrait, onZero: false, lineStyle: { color: portrait ? '#B8C4D1' : '#D0D5DD' } },
    axisTick: { show: false },
    axisLabel: {
      color: portrait ? '#7D8DA8' : '#667085',
      fontSize: (portrait ? 10 : 11) * CHART_FONT_SCALE,
      hideOverlap: true,
      showMinLabel: scale !== 'log',
      formatter: (value: number) => `${Math.round(value)} Hz`,
    },
    axisPointer: {
      label: {
        show: true,
        fontSize: 12 * CHART_FONT_SCALE,
        formatter: ({ value }: { value: unknown }) => formatFrequencyPreview(value),
      },
    },
    splitLine: { lineStyle: { color: portrait ? '#EDF2F7' : '#F2F4F7' } },
    minorTick: { show: false },
  }
}
