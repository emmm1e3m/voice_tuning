import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { AnalysisPipeline } from '../../dsp/analysis-pipeline'
import { parseWav } from '../../dsp/wav-parser'
import { FormantSmoother } from '../../dsp/formant-smoother'
import { Resampler } from '../../dsp/resampler'
import type { SmootherFrame } from '../../dsp/formant-smoother'

const VOWELS = ['a', 'o', 'e', 'i', 'u', 'yu'] as const
function load(name: string) {
  const bytes = readFileSync(fileURLToPath(new URL(`../../../assets/${name}.wav`, import.meta.url)))
  return parseWav(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength))
}
function smooth(frames: SmootherFrame[], window: 5 | 10) {
  const smoother = new FormantSmoother(window)
  return frames.map(frame => smoother.push(frame))
}
function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}
function stableIndices(frames: SmootherFrame[]) {
  const voiced = frames.flatMap((frame, index) => frame.f0 && frame.f1 && frame.f2 ? [index] : [])
  return voiced.slice(Math.floor(voiced.length * 0.2), Math.floor(voiced.length * 0.9))
}
function metrics(frames: SmootherFrame[], indices: number[], reference: Array<{ t: number; f1: number; f2: number }>) {
  let jitter = 0, pairs = 0, bigSteps = 0, relativeError = 0, observations = 0
  for (const index of indices) {
    const frame = frames[index]
    const nearest = reference.reduce((best, candidate) => Math.abs(candidate.t - frame.time) < Math.abs(best.t - frame.time) ? candidate : best)
    for (const key of ['f1', 'f2'] as const) {
      const value = frame[key]
      if (value == null) continue
      relativeError += Math.abs(value - nearest[key]) / nearest[key]
      observations++
      const previous = frames[index - 1]?.[key]
      if (previous == null) continue
      const difference = Math.abs(value - previous)
      jitter += difference
      pairs++
      if (difference > (key === 'f1' ? 100 : 200)) bigSteps++
    }
  }
  return { meanStepHz: +(jitter / pairs).toFixed(2), bigSteps, praatMeanRelativeErrorPct: +(relativeError / observations * 100).toFixed(2) }
}

describe('reproducible five-versus-ten-frame smoothing experiment', () => {
  it('compares repository vowels, injected tracker bursts, and a real vowel change', () => {
    const raw = Object.fromEntries(VOWELS.map(vowel => {
      const wav = load(vowel)
      return [vowel, AnalysisPipeline.analyze(wav.samples, wav.sampleRate, 'hybrid', false)]
    })) as Record<typeof VOWELS[number], SmootherFrame[]>
    const stable = VOWELS.map(vowel => {
      const reference = readFileSync(fileURLToPath(new URL(`../../../assets/info_${vowel}.txt`, import.meta.url)), 'utf8')
        .trim().split('\n').slice(1).map(line => {
          const values = line.trim().split(/\s+/).map(Number)
          return { t: values[0], f1: values[1], f2: values[2] }
        }).filter(frame => frame.f1 > 20 && frame.f2 > 20)
      const indices = stableIndices(raw[vowel])
      expect(indices.length).toBeGreaterThan(3)
      return { vowel, five: metrics(smooth(raw[vowel], 5), indices, reference), ten: metrics(smooth(raw[vowel], 10), indices, reference) }
    })
    const anchor = (vowel: typeof VOWELS[number]): SmootherFrame => {
      const indices = stableIndices(raw[vowel])
      return { time: 0, f0: median(indices.map(index => raw[vowel][index].f0!)), f1: median(indices.map(index => raw[vowel][index].f1!)), f2: median(indices.map(index => raw[vowel][index].f2!)) }
    }
    const a = anchor('a'), i = anchor('i')
    // 仅向真实元音的分析帧注入跟踪错误，不生成或替换任何音频文件。
    const bursts = [1, 2, 4].map(length => {
      const frames = Array.from({ length: 40 }, (_, index) => ({
        ...a, time: index * 0.01,
        ...(index >= 15 && index < 15 + length ? { f1: a.f1! + 400, f2: a.f2! + 800 } : {}),
      }))
      const count = (window: 5 | 10) => smooth(frames, window).filter(frame => Math.abs(frame.f1! - a.f1!) > 100 || Math.abs(frame.f2! - a.f2!) > 200).length
      return { injectedFrames: length, fiveAffectedFrames: count(5), tenAffectedFrames: count(10) }
    })
    const transition = Array.from({ length: 45 }, (_, index) => ({ ...(index < 15 ? a : i), time: index * 0.01 }))
    const response = (window: 5 | 10) => {
      const outputs = smooth(transition, window)
      return 10 * (outputs.findIndex((frame, index) => index >= 15 && Math.abs(frame.f1! - i.f1!) < 50 && Math.abs(frame.f2! - i.f2!) < 50) - 15)
    }
    const transitionDelayMs = { five: response(5), ten: response(10) }
    const extractRealSegment = (vowel: typeof VOWELS[number]) => {
      const wav = load(vowel)
      const samples = wav.sampleRate === 16000 ? wav.samples : new Resampler(wav.sampleRate, 16000).process(wav.samples)
      const length = Math.min(9600, samples.length)
      const start = Math.floor((samples.length - length) / 2)
      return samples.slice(start, start + length)
    }
    const firstSegment = extractRealSegment('a'), secondSegment = extractRealSegment('i')
    const actualChange = new Float32Array(firstSegment.length + secondSegment.length)
    actualChange.set(firstSegment)
    actualChange.set(secondSegment, firstSegment.length)
    const boundary = firstSegment.length / 16000
    const realResponse = (window: 5 | 10) => {
      const frames = AnalysisPipeline.analyze(actualChange, 16000, 'hybrid', true, window)
      const matches = (frame: SmootherFrame) => frame.f1 !== null && frame.f2 !== null
        && Math.abs(frame.f1 - i.f1!) < 100 && Math.abs(frame.f2 - i.f2!) < 250
      const reached = frames.find((frame, index) => frame.time >= boundary && matches(frame)
        && frames.slice(index, index + 3).length === 3 && frames.slice(index, index + 3).every(matches))
      expect(reached).toBeDefined()
      return Math.round((reached!.time - boundary) * 1000)
    }
    const realAudioChangeDelayMs = { five: realResponse(5), ten: realResponse(10) }
    expect(bursts[0].fiveAffectedFrames).toBe(0)
    expect(bursts[0].tenAffectedFrames).toBe(0)
    expect(bursts[2].tenAffectedFrames).toBeLessThan(bursts[2].fiveAffectedFrames)
    expect(transitionDelayMs.ten).toBeGreaterThan(transitionDelayMs.five)
    expect(realAudioChangeDelayMs.ten).toBeGreaterThanOrEqual(realAudioChangeDelayMs.five)
    const average = (window: 'five' | 'ten', key: 'meanStepHz' | 'praatMeanRelativeErrorPct') =>
      +(stable.reduce((sum, item) => sum + item[window][key], 0) / stable.length).toFixed(2)
    const equalVowelAverages = {
      five: { meanStepHz: average('five', 'meanStepHz'), praatMeanRelativeErrorPct: average('five', 'praatMeanRelativeErrorPct') },
      ten: { meanStepHz: average('ten', 'meanStepHz'), praatMeanRelativeErrorPct: average('ten', 'praatMeanRelativeErrorPct') },
    }
    console.log(JSON.stringify({ stable, equalVowelAverages, bursts, transitionDelayMs, realAudioChangeDelayMs, anchorsHz: { a, i } }, null, 2))
  })
})
