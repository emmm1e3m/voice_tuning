import { describe, expect, it } from 'vitest'
import { summarizePitch } from '../../statistics/statistics'
import { analyzeClip } from '../../statistics/analyzeClip'
import type { PitchFrame } from '../../statistics/types'

function frames(pitches: Array<number | null>): PitchFrame[] {
  return pitches.map((rawF0, index) => ({
    start: index * 0.01, duration: 0.01, time: index * 0.01 + 0.025,
    rawF0, f0: rawF0, voiced: rawF0 !== null, exclusion: null,
  }))
}

function tone(frequency: number, duration: number, sampleRate = 16000): Float32Array {
  return Float32Array.from({ length: Math.round(duration * sampleRate) }, (_, index) =>
    0.08 * Math.sin(2 * Math.PI * frequency * index / sampleRate)
    + 0.03 * Math.sin(4 * Math.PI * frequency * index / sampleRate))
}

describe('整段录音音高统计', () => {
  it('统计边界包含60与500Hz，将无声及无效检测排除而不作为零值', () => {
    const input = frames([null, 0, 59, 60, 200, 400, 500, 501, 1000, 1001, NaN])
    const { summary, frames: result } = summarizePitch(input, 0.11)
    expect(summary.median).toBe(300)
    expect(summary.p10).toBeCloseTo(102)
    expect(summary.p90).toBeCloseTo(470)
    expect(summary.validDuration).toBeCloseTo(0.04)
    expect(summary.coverage).toBeCloseTo(4 / 11)
    expect(summary.aboveLimitCount).toBe(2)
    expect(summary.aboveLimitDuration).toBeCloseTo(0.02)
    expect(summary.aboveLimitProportion).toBeCloseTo(1 / 3)
    expect(result[6].f0).toBe(500)
    expect(summary.histogram[summary.histogram.length - 1]).toMatchObject({ from: 490, to: 500, count: 1 })
    expect(result[7].exclusion).toBe('above-statistics-limit')
  })

  it('直方图使用真实时间，截短尾帧不使覆盖率或分布比例膨胀', () => {
    const { summary } = summarizePitch(frames([100, 200]), 0.015)
    expect(summary.validDuration).toBeCloseTo(0.015)
    expect(summary.coverage).toBeCloseTo(1)
    expect(summary.histogram[0].proportion).toBeCloseTo(2 / 3)
    expect(summary.histogram[1].proportion).toBeCloseTo(1 / 3)
  })

  it('仅移除两侧稳定连续的1–2帧短跳点，保留持续转音', () => {
    for (const length of [1, 2]) {
      const { summary } = summarizePitch(frames([200, 200, 200, ...Array(length).fill(400), 200, 200, 200]), 1)
      expect(summary.excludedCount).toBe(length)
      expect(summary.median).toBe(200)
    }
    const sustained = summarizePitch(frames([200, 200, 200, 400, 400, 400, 200, 200, 200]), 1)
    expect(sustained.summary.excludedCount).toBe(0)
    const turn = summarizePitch(frames([200, 200, 200, 400, 400, 400, 400, 400, 400]), 1)
    expect(turn.summary.excludedCount).toBe(0)
  })

  it('跨静音或缺帧不将音高变化当作孤立误检', () => {
    const interrupted = summarizePitch(frames([200, 200, null, 400, 200, 200, 200]), 1)
    expect(interrupted.summary.excludedCount).toBe(0)
    const gap = frames([200, 200, 200, 400, 200, 200, 200])
    gap.slice(4).forEach(frame => { frame.start += 0.01 })
    expect(summarizePitch(gap, 1).summary.excludedCount).toBe(0)
  })

  it('合成信号在16k与48k采样率下产生相近音高统计，完整音频不被修改', () => {
    for (const rate of [16000, 48000]) {
      const samples = tone(200, 1.02, rate)
      const original = samples.slice()
      const result = analyzeClip(samples, rate)
      expect(result.summary.median).toBeCloseTo(200, 0)
      expect(result.summary.validDuration).toBeGreaterThan(0.95)
      expect(result.frames.reduce((sum, frame) => sum + frame.duration, 0)).toBeCloseTo(1.02)
      expect(result.settings).toMatchObject({ sampleRate: 16000, frameSize: 800, hopSize: 160, statisticsRange: [60, 500] })
      expect(samples).toEqual(original)
    }
  })

  it('静音和不足半窗的片段不产生有效音高，尾部填充不增加统计时长', () => {
    const silence = analyzeClip(new Float32Array(3200), 16000)
    expect(silence.summary.median).toBeNull()
    expect(silence.summary.validDuration).toBe(0)
    expect(silence.summary.coverage).toBe(0)
    const short = analyzeClip(tone(200, 0.02), 16000)
    expect(short.summary.validDuration).toBe(0)
    expect(short.frames.reduce((sum, frame) => sum + frame.duration, 0)).toBeCloseTo(0.02)
    const tail = analyzeClip(tone(200, 0.025), 16000)
    expect(tail.frames[0].f0).toBeCloseTo(200, 0)
    expect(tail.frames[tail.frames.length - 1]?.f0).toBeNull()
  })

  it('接受完整60秒并拒绝多出的一个真实采样', () => {
    const input = new Float32Array(60 * 16000)
    const result = analyzeClip(input, 16000)
    expect(result.frames).toHaveLength(6000)
    expect(result.frames.reduce((sum, frame) => sum + frame.duration, 0)).toBeCloseTo(60)
    expect(() => analyzeClip(new Float32Array(input.length + 1), 16000)).toThrow('60 秒')
  })
})
