import { F0_RANGE } from '../config/analysisRanges'
import { STATISTICS_MAX_F0, STATISTICS_MIN_F0 } from './constants'
import type { HistogramBin, PitchFrame, PitchSummary } from './types'

function percentile(sorted: readonly number[], position: number): number | null {
  if (sorted.length === 0) return null
  const index = (sorted.length - 1) * position
  const lower = Math.floor(index)
  return sorted[lower] + (sorted[Math.ceil(index)] - sorted[lower]) * (index - lower)
}

function midpoint(values: number[]): number {
  return percentile(values.sort((left, right) => left - right), 0.5)!
}

function semitoneDistance(value: number, reference: number): number {
  return 12 * Math.log2(value / reference)
}

export function summarizePitch(input: readonly PitchFrame[], duration: number): { frames: PitchFrame[]; summary: PitchSummary } {
  const frameWeight = (frame: PitchFrame) => Math.max(0, Math.min(frame.duration, duration - frame.start))
  let candidateDuration = 0
  let aboveLimitDuration = 0
  let aboveLimitCount = 0

  const frames = input.map((frame): PitchFrame => {
    const candidate = frame.voiced && frame.rawF0 !== null && Number.isFinite(frame.rawF0)
      && frame.rawF0 >= Math.max(F0_RANGE.min, STATISTICS_MIN_F0) && frame.rawF0 <= F0_RANGE.max
      && frame.start >= 0 && frameWeight(frame) > 0
    const aboveLimit = candidate && frame.rawF0! > STATISTICS_MAX_F0
    if (candidate) candidateDuration += frameWeight(frame)
    if (aboveLimit) {
      aboveLimitCount++
      aboveLimitDuration += frameWeight(frame)
    }
    return {
      ...frame,
      f0: candidate && !aboveLimit ? frame.rawF0 : null,
      exclusion: aboveLimit ? 'above-statistics-limit' : candidate ? null : 'invalid',
    }
  })

  // 两侧须各有三帧连续有效音高；持续转音和跨静音的变化不按短跳点处理。
  const pitches = frames.map(frame => frame.f0)
  const excluded = new Set<number>()
  for (let first = 3; first + 3 < frames.length; first++) {
    for (const length of [1, 2]) {
      const end = first + length
      if (end + 3 > frames.length) continue
      const context = frames.slice(first - 3, end + 3)
      if (context.some((frame, index) => frame.f0 === null
        || (index > 0 && Math.abs(frame.start - context[index - 1].start - 0.01) > 1e-6))) continue
      const left = midpoint(pitches.slice(first - 3, first) as number[])
      const right = midpoint(pitches.slice(end, end + 3) as number[])
      if (Math.abs(semitoneDistance(left, right)) > 2) continue
      const direction = Math.sign(semitoneDistance(pitches[first]!, left))
      const isJump = (value: number) => {
        const before = semitoneDistance(value, left)
        const after = semitoneDistance(value, right)
        return Math.abs(before) >= 8 && Math.abs(after) >= 8
          && Math.sign(before) === direction && Math.sign(after) === direction
      }
      if (isJump(pitches[first - 1]!) || isJump(pitches[end]!)) continue
      if (pitches.slice(first, end).every(value => isJump(value!))) {
        for (let index = first; index < end; index++) excluded.add(index)
      }
    }
  }
  for (const index of excluded) {
    frames[index].f0 = null
    frames[index].exclusion = 'isolated-jump'
  }

  const validFrames = frames.filter(frame => frame.f0 !== null)
  const sorted = validFrames.map(frame => frame.f0!).sort((left, right) => left - right)
  const validDuration = validFrames.reduce((sum, frame) => sum + frameWeight(frame), 0)
  const histogram = new Map<number, HistogramBin>()
  for (const frame of validFrames) {
    // 500 Hz 归入最后的 490–500 Hz 箱，避免产生超出统计范围的新箱。
    const from = Math.min(STATISTICS_MAX_F0 - 10, Math.floor(frame.f0! / 10) * 10)
    const bin = histogram.get(from) ?? { from, to: from + 10, count: 0, proportion: 0 }
    bin.count++
    bin.proportion += frameWeight(frame)
    histogram.set(from, bin)
  }
  for (const bin of histogram.values()) bin.proportion /= validDuration

  return {
    frames,
    summary: {
      median: percentile(sorted, 0.5),
      p10: percentile(sorted, 0.1),
      p90: percentile(sorted, 0.9),
      validDuration,
      coverage: duration > 0 ? Math.min(1, validDuration / duration) : 0,
      excludedCount: excluded.size,
      histogram: [...histogram.values()].sort((left, right) => left.from - right.from),
      aboveLimitCount,
      aboveLimitDuration,
      aboveLimitProportion: candidateDuration > 0 ? aboveLimitDuration / candidateDuration : null,
      candidateDuration,
    },
  }
}
