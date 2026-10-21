import type { AnalysisFrame } from '../types'

export type FrequencySummary = Record<'f0' | 'f1' | 'f2', number | null>

export function summarizeFrequencyWindow(frames: AnalysisFrame[], seconds: number): FrequencySummary {
  let end = -Infinity
  for (const frame of frames) if (Number.isFinite(frame.time)) end = Math.max(end, frame.time)
  const values: Record<'f0' | 'f1' | 'f2', number[]> = { f0: [], f1: [], f2: [] }
  for (const frame of frames) {
    if (!Number.isFinite(frame.time) || frame.time < end - seconds || frame.time > end) continue
    for (const key of ['f0', 'f1', 'f2'] as const) {
      const value = frame[key]
      if (value != null && Number.isFinite(value) && value > 0) values[key].push(value)
    }
  }
  const median = (numbers: number[]): number | null => {
    if (!numbers.length) return null
    numbers.sort((a, b) => a - b)
    const middle = Math.floor(numbers.length / 2)
    return numbers.length % 2 ? numbers[middle] : (numbers[middle - 1] + numbers[middle]) / 2
  }
  return { f0: median(values.f0), f1: median(values.f1), f2: median(values.f2) }
}
