import { describe, expect, it } from 'vitest'
import { anatomyEnvelope, anatomyFrequencies, anatomyVowelReference, ANATOMY_VOWELS, anatomyFrequencyShift, anatomyShiftLabel, INITIAL_ANATOMY, type AnatomyPositionKey } from '../utils/anatomyAcoustics'
import { VOWEL_PRESETS } from '../types'

describe('发声部位教学频率方向', () => {
  it('以复位形状为零点，明确区分基频和声道共振', () => {
    expect(anatomyFrequencyShift(INITIAL_ANATOMY)).toEqual({ f0: 0, f1: 0, f2: 0 })
    const tense = anatomyFrequencyShift({ ...INITIAL_ANATOMY, tension: 100 })
    expect(tense.f0).toBeGreaterThan(0)
    expect(tense.f1).toBe(0)
    expect(tense.f2).toBe(0)
  })

  it.each([
    ['tongueHeight', 'f1', -1],
    ['tongueFront', 'f2', 1],
    ['jaw', 'f1', 1],
    ['larynx', 'f1', 1],
    ['larynx', 'f2', 1],
    ['lips', 'f1', -1],
    ['lips', 'f2', -1],
  ] as const)('%s 向右改变 %s 的典型方向，不改变简化模型的 F0', (key, frequency, direction) => {
    const low = anatomyFrequencyShift({ ...INITIAL_ANATOMY, [key]: 10 })
    const high = anatomyFrequencyShift({ ...INITIAL_ANATOMY, [key]: 90 })
    expect((high[frequency] - low[frequency]) * direction).toBeGreaterThan(0)
    expect(low.f0).toBe(0)
    expect(high.f0).toBe(0)
  })

  it('组合元音保持 i 的 F1 低、F2 高，u 的 F1 与 F2 均低', () => {
    const i = anatomyFrequencyShift({ ...INITIAL_ANATOMY, tongueFront: 85, tongueHeight: 85, jaw: 20, lips: 5 })
    const u = anatomyFrequencyShift({ ...INITIAL_ANATOMY, tongueFront: 20, tongueHeight: 80, jaw: 20, lips: 90 })
    expect(i.f1).toBeLessThan(0)
    expect(i.f2).toBeGreaterThan(0)
    expect(u.f1).toBeLessThan(0)
    expect(u.f2).toBeLessThan(0)
  })

  it('组合极值始终留在可见的教学轨道内', () => {
    const keys = Object.keys(INITIAL_ANATOMY) as AnatomyPositionKey[]
    for (let mask = 0; mask < 64; mask++) {
      const position = { ...INITIAL_ANATOMY }
      keys.forEach((key, index) => { position[key] = (mask & (1 << index)) ? 100 : 0 })
      for (const shift of Object.values(anatomyFrequencyShift(position))) {
        const percent = 50 + shift * 44
        expect(percent).toBeGreaterThan(2)
        expect(percent).toBeLessThan(98)
      }
    }
    expect(anatomyShiftLabel(0)).toBe('接近复位')
    expect(anatomyShiftLabel(.1)).toBe('向高频移动')
    expect(anatomyShiftLabel(-.1)).toBe('向低频移动')
  })
  it('六元音的三项参考频率与项目练习区间中心一致，基准动作不产生额外偏移', () => {
    for (const [key, vowel] of Object.entries(ANATOMY_VOWELS)) {
      const reference = anatomyVowelReference(key)
      for (const frequency of ['f0', 'f1', 'f2'] as const) expect(reference[frequency]).toBe((VOWEL_PRESETS[key][frequency][0] + VOWEL_PRESETS[key][frequency][1]) / 2)
      expect(anatomyFrequencies(vowel.position, key)).toEqual(reference)
    }
    expect(ANATOMY_VOWELS['vowel-e'].position.tongueFront).toBeLessThan(50)
    expect(ANATOMY_VOWELS['vowel-e'].position.lips).toBeLessThan(30)
    expect(ANATOMY_VOWELS['vowel-yu'].position.tongueFront).toBe(ANATOMY_VOWELS['vowel-i'].position.tongueFront)
  })

  it('声带张力只改变参考 F0，舌前移使当前 F2 高于所选元音基准', () => {
    for (const [key, vowel] of Object.entries(ANATOMY_VOWELS)) {
      const reference = anatomyVowelReference(key)
      const tense = anatomyFrequencies({ ...vowel.position, tension: 100 }, key)
      expect(tense.f0).toBeGreaterThan(reference.f0)
      expect(tense.f1).toBe(reference.f1)
      expect(tense.f2).toBe(reference.f2)
      expect(anatomyFrequencies({ ...vowel.position, tongueFront: 100 }, key).f2).toBeGreaterThan(reference.f2)
    }
  })

  it('所有元音和动作极值保留峰顺序，处于绘图区间且包络为有效相对强度', () => {
    const keys = Object.keys(INITIAL_ANATOMY) as AnatomyPositionKey[]
    for (const [vowel, item] of Object.entries(ANATOMY_VOWELS)) for (let mask = 0; mask < 64; mask++) {
      const position = { ...item.position }
      keys.forEach((key, index) => { position[key] = (mask & (1 << index)) ? 100 : 0 })
      const result = anatomyFrequencies(position, vowel)
      expect(result.f0).toBeGreaterThanOrEqual(80)
      expect(result.f0).toBeLessThanOrEqual(500)
      expect(result.f1).toBeLessThan(result.f2)
      expect(result.f2).toBeLessThan(4000)
      for (let hz = 0; hz <= 4000; hz += 50) {
        const intensity = anatomyEnvelope(hz, result.f1, result.f2)
        expect(intensity).toBeGreaterThanOrEqual(0)
        expect(intensity).toBeLessThanOrEqual(1)
      }
    }
  })
})
