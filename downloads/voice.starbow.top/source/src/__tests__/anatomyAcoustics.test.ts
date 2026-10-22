import { describe, expect, it } from 'vitest'
import { anatomyEnvelope, anatomyFrequencies, anatomyPositionForFormants, anatomyVowelReference, ANATOMY_VOWELS, INITIAL_ANATOMY, type AnatomyPositionKey } from '../utils/anatomyAcoustics'

describe('统一发声动作与元音空间模型', () => {
  it('六个元音由同一个连续模型复现练习参考，普通话 e 采用后部不圆唇位置', () => {
    for (const [key, vowel] of Object.entries(ANATOMY_VOWELS)) expect(anatomyFrequencies(vowel.position)).toEqual(anatomyVowelReference(key))
    expect(ANATOMY_VOWELS['vowel-e'].position.tongueFront).toBeLessThan(50)
    expect(ANATOMY_VOWELS['vowel-e'].position.lips).toBeLessThan(30)
    expect(ANATOMY_VOWELS['vowel-yu'].position.tongueFront).toBeCloseTo(ANATOMY_VOWELS['vowel-i'].position.tongueFront)
  })

  it('声带张力只改变 F0，声道动作不改变 F0', () => {
    const reference = anatomyFrequencies(INITIAL_ANATOMY)
    const tense = anatomyFrequencies({ ...INITIAL_ANATOMY, tension: 100 })
    expect(tense.f0).toBeGreaterThan(reference.f0)
    expect(tense.f1).toBe(reference.f1)
    expect(tense.f2).toBe(reference.f2)
    for (const key of ['tongueFront', 'tongueHeight', 'jaw', 'lips', 'larynx'] as const) expect(anatomyFrequencies({ ...INITIAL_ANATOMY, [key]: 100 }).f0).toBe(reference.f0)
  })

  it.each([
    ['tongueHeight', 'f1', -1], ['tongueFront', 'f2', 1], ['jaw', 'f1', 1],
    ['larynx', 'f1', 1], ['larynx', 'f2', 1], ['lips', 'f1', -1], ['lips', 'f2', -1],
  ] as const)('%s 沿典型方向改变 %s', (key, frequency, direction) => {
    const low = anatomyFrequencies({ ...INITIAL_ANATOMY, [key]: 10 })
    const high = anatomyFrequencies({ ...INITIAL_ANATOMY, [key]: 90 })
    expect((high[frequency] - low[frequency]) * direction).toBeGreaterThan(0)
  })

  it('逆解能跨越元音区域，并保持声源、喉位和唇形', () => {
    const previous = { ...ANATOMY_VOWELS['vowel-a'].position, tension: 73, larynx: 45, lips: 25 }
    const target = { f1: 350, f2: 2500 }
    const next = anatomyPositionForFormants(previous, target)
    expect(anatomyFrequencies(next)).toMatchObject(target)
    for (const key of ['tension', 'larynx', 'lips'] as const) expect(next[key]).toBe(previous[key])
    expect(next.tongueHeight).toBeGreaterThan(previous.tongueHeight)
    expect(next.jaw).toBeLessThan(previous.jaw)
    expect(next.tongueFront).toBeGreaterThan(previous.tongueFront)
  })

  it('在频率边界点击当前点不跳动，单轴移动只调整对应的舌位动作', () => {
    const position = { tension: 40, larynx: 0, lips: 100, tongueFront: 0, tongueHeight: 100, jaw: 0 }
    const current = anatomyFrequencies(position)
    expect(anatomyPositionForFormants(position, current)).toEqual(position)
    const horizontal = anatomyPositionForFormants(position, { ...current, f2: 650 })
    expect(horizontal.tongueHeight).toBe(position.tongueHeight)
    expect(horizontal.jaw).toBe(position.jaw)
    const vertical = anatomyPositionForFormants(position, { ...current, f1: 250 })
    expect(vertical.tongueFront).toBe(position.tongueFront)
  })

  it('不可达目标停在动作边界，所有组合极值仍保留频率顺序和可逆性', () => {
    const limited = anatomyPositionForFormants({ ...INITIAL_ANATOMY, lips: 100, larynx: 0 }, { f1: 1400, f2: 3700 })
    expect(limited.tongueFront).toBe(100)
    expect(anatomyFrequencies(limited).f2).toBeLessThan(3700)
    const keys = Object.keys(INITIAL_ANATOMY) as AnatomyPositionKey[]
    for (let mask = 0; mask < 64; mask++) {
      const position = { ...INITIAL_ANATOMY }
      keys.forEach((key, index) => { position[key] = mask & (1 << index) ? 100 : 0 })
      const result = anatomyFrequencies(position)
      expect(result.f0).toBeGreaterThanOrEqual(80)
      expect(result.f0).toBeLessThanOrEqual(500)
      expect(result.f1).toBeLessThan(result.f2)
      expect(result.f2).toBeLessThan(4000)
      const solved = anatomyPositionForFormants({ ...position, tongueFront: 50, tongueHeight: 50, jaw: 50 }, result)
      const actual = anatomyFrequencies(solved)
      expect(Math.abs(actual.f1 - result.f1)).toBeLessThanOrEqual(1)
      expect(Math.abs(actual.f2 - result.f2)).toBeLessThanOrEqual(1)
      for (const value of Object.values(solved)) { expect(value).toBeGreaterThanOrEqual(0); expect(value).toBeLessThanOrEqual(100) }
      for (let hz = 0; hz <= 4000; hz += 50) {
        const intensity = anatomyEnvelope(hz, result.f1, result.f2)
        expect(intensity).toBeGreaterThanOrEqual(0)
        expect(intensity).toBeLessThanOrEqual(1)
      }
    }
  })
})
