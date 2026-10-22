import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { buildRegisterCalibration, calibrationSample, registerOptionsForCalibration } from '../../dsp/register-calibration'
import { RegisterDetector } from '../../dsp/register-detector'
import { AnalysisPipeline } from '../../dsp/analysis-pipeline'
import { parseWav } from '../../dsp/wav-parser'

function stableSamples(count = 3) {
  return Array.from({ length: 120 }, (_, index) => ({ time: index * .01, f0: 250 + index % 3, harmonicCount: count }))
}

describe('个人声区边界校准', () => {
  it('只接受连续稳定的边界声，拒绝静音、短片段和滑音', () => {
    expect(buildRegisterCalibration([])).toBeNull()
    expect(buildRegisterCalibration(stableSamples().slice(0, 50))).toBeNull()
    expect(buildRegisterCalibration(stableSamples().map((sample, index) => ({ ...sample, f0: 200 + index * 2 })))).toBeNull()
    expect(buildRegisterCalibration(stableSamples().map((sample, index) => ({ ...sample, time: sample.time + (index > 50 ? .2 : 0) })))).toBeNull()
    expect(buildRegisterCalibration(stableSamples(0))).toBeNull()
    expect(buildRegisterCalibration(stableSamples(), 123)).toEqual({ boundaryCount: 3, f0: 251, calibratedAt: 123 })
    expect(calibrationSample({ time: 1, f0: 250, f1: null, f2: null, voiced: false, rms: 0 })).toBeNull()
    expect(calibrationSample({ time: 1, f0: 250, f1: null, f2: null, voiced: true, rms: 0, magnitudes: new Float32Array(1025) })).toBeNull()
  })

  it('个人标定实际改变同一谐波谱的声区边界', () => {
    const magnitudes = new Float32Array(1025).fill(-90)
    for (let harmonic = 1; harmonic <= 5; harmonic++) magnitudes[32 * harmonic] = harmonic === 1 ? 0 : -10
    const frame = { f0: 250, voiced: true, magnitudes, sampleRate: 16000 }
    const calibration = buildRegisterCalibration(stableSamples())
    expect(new RegisterDetector().push(frame).register).toBe('mixed')
    expect(new RegisterDetector(registerOptionsForCalibration(calibration)).push(frame).register).toBe('chest')
    expect(registerOptionsForCalibration(null)).toBeUndefined()
  })

  it('导入与分块实时分析采用相同校准与声区结果', () => {
    const bytes = readFileSync(new URL('../../../assets/a_mix_vocal.wav', import.meta.url))
    const wav = parseWav(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength))
    const options = registerOptionsForCalibration(buildRegisterCalibration(stableSamples(2)))
    const imported = AnalysisPipeline.analyze(wav.samples, wav.sampleRate, 'hybrid', true, 5, options)
    const streamed: typeof imported = []
    const pipeline = new AnalysisPipeline({ onFrame: frame => streamed.push(frame), registerOptions: options })
    for (let offset = 0; offset < wav.samples.length; offset += 1024) pipeline.pushChunk(wav.samples.subarray(offset, offset + 1024), wav.sampleRate)
    pipeline.flush()
    expect(streamed.map(frame => frame.register)).toEqual(imported.map(frame => frame.register))
    const defaults = AnalysisPipeline.analyze(wav.samples, wav.sampleRate, 'hybrid', true)
    expect(imported.some((frame, index) => frame.register !== defaults[index].register)).toBe(true)
  })
})
