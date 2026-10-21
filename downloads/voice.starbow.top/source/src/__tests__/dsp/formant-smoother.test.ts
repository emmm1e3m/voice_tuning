import { describe, expect, it } from 'vitest'
import { FormantSmoother } from '../../dsp/formant-smoother'
import { AnalysisPipeline } from '../../dsp/analysis-pipeline'
import { parseWav } from '../../dsp/wav-parser'
import { readFileSync } from 'node:fs'
import type { SmootherFrame } from '../../dsp/formant-smoother'

function frame(f1: number | null, overrides: Partial<SmootherFrame> = {}): SmootherFrame {
  return { time: 1.23, f0: 200, f1, f2: 1500, register: 'chest', registerConfidence: 0.85, ...overrides }
}

describe('FormantSmoother window semantics', () => {
  it('uses the average of the middle pair in an even window', () => {
    const smoother = new FormantSmoother(10)
    const output = [...Array(5).fill(500), ...Array(5).fill(700)].map(value => smoother.push(frame(value)))
    expect(output[9].f1).toBe(600)
  })

  it.each([5, 10])('preserves timestamp, metadata and missing-frame gaps with %i frames', window => {
    const smoother = new FormantSmoother(window)
    for (let index = 0; index < 12; index++) smoother.push(frame(500))
    const gap = frame(null, { time: 9.87, f0: null, f2: null, voiced: false, register: 'unvoiced', registerConfidence: 1 })
    expect(smoother.push(gap)).toEqual(gap)
    expect(smoother.push(frame(850, { time: 9.88 }))).toEqual(frame(850, { time: 9.88 }))
  })

  it('keeps a missing frequency null when ordering protection holds another frequency', () => {
    const smoother = new FormantSmoother(10)
    smoother.push(frame(500))
    const output = smoother.push(frame(2000, { f0: null, f2: 1000 }))
    expect(output.f0).toBeNull()
    expect(output.time).toBe(1.23)
    expect(output.register).toBe('chest')
  })

  it('resets nonfinite measurements instead of carrying them across a gap', () => {
    const smoother = new FormantSmoother(10)
    smoother.push(frame(500))
    expect(smoother.push(frame(NaN)).f1).toBeNull()
    expect(smoother.push(frame(850)).f1).toBe(850)
    smoother.reset()
    expect(smoother.push(frame(600)).f1).toBe(600)
  })
})

describe('window option reaches live and imported DSP consistently', () => {
  const bytes = readFileSync(new URL('../../../assets/a.wav', import.meta.url))
  const wav = parseWav(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength))
  const summarize = (frames: SmootherFrame[]) => frames.map(({ time, f0, f1, f2, voiced, register, registerConfidence }) => ({ time, f0, f1, f2, voiced, register, registerConfidence }))

  it.each([5, 10] as const)('matches batch times, gaps and register results with a %i-frame window', window => {
    const live: SmootherFrame[] = []
    const pipeline = new AnalysisPipeline({ onFrame: result => live.push(result), formantSmoothingWindow: window })
    for (let index = 0; index < wav.samples.length; index += 1024) pipeline.pushChunk(wav.samples.subarray(index, index + 1024), wav.sampleRate)
    pipeline.flush()
    const batch = AnalysisPipeline.analyze(wav.samples, wav.sampleRate, 'hybrid', true, window)
    expect(summarize(live)).toEqual(summarize(batch))
  })

  it('keeps legacy calls equivalent to the five-frame default', () => {
    const legacy = AnalysisPipeline.analyze(wav.samples, wav.sampleRate, 'hybrid', true)
    const explicit = AnalysisPipeline.analyze(wav.samples, wav.sampleRate, 'hybrid', true, 5)
    expect(summarize(legacy)).toEqual(summarize(explicit))
    const rawFive = AnalysisPipeline.analyze(wav.samples, wav.sampleRate, 'hybrid', false, 5)
    const rawTen = AnalysisPipeline.analyze(wav.samples, wav.sampleRate, 'hybrid', false, 10)
    expect(summarize(rawFive)).toEqual(summarize(rawTen))
  })
})
