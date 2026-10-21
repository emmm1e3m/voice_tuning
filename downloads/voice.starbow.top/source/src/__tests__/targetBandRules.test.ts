import { expect, it } from 'vitest'
import { getBandCenter, getTargetCenterBounds, normalizeTargetBands, TARGET_HALF_WIDTH_HZ, updateTargetCenter } from '../config/targetBandRules'
import { VOWEL_PRESETS, type TargetBands } from '../types'

function makeBands(f0: [number, number], f1: [number, number], f2: [number, number]): TargetBands {
  return { f0: { range: f0, color: '' }, f1: { range: f1, color: '' }, f2: { range: f2, color: '' } }
}

it('uses identical fixed widths for all vowels and retains their original centers', () => {
  const originalCenters = [[240, 900, 1250], [240, 550, 850], [240, 580, 1150], [260, 330, 2750], [240, 350, 750], [260, 330, 2000]]
  Object.values(VOWEL_PRESETS).forEach((preset, index) => {
    const bands = makeBands(preset.f0, preset.f1, preset.f2)
    expect(normalizeTargetBands(bands)).toBe(bands)
    for (const [i, key] of (['f0', 'f1', 'f2'] as const).entries()) {
      expect(getBandCenter(bands[key].range)).toBe(originalCenters[index][i])
      expect(bands[key].range[1] - bands[key].range[0]).toBe(TARGET_HALF_WIDTH_HZ[key] * 2)
    }
  })
})

it('reserves fixed half widths at frequency and relative-formant boundaries', () => {
  const bands = makeBands([200, 280], [800, 1000], [1100, 1400])
  expect(getTargetCenterBounds('f0', bands)).toEqual([40, 460])
  expect(getTargetCenterBounds('f1', bands)).toEqual([100, 1000])
  expect(getTargetCenterBounds('f2', bands)).toEqual([1150, 3350])
  const changed = updateTargetCenter(bands, 'f1', 2000)
  expect(changed.f1.range).toEqual([900, 1100])
  expect(changed.f2).toBe(bands.f2)
  expect(changed.f0).toBe(bands.f0)
})

it('migrates narrow and wide legacy ranges by their centers', () => {
  const bands = normalizeTargetBands(makeBands([100, 200], [280, 380], [2500, 3000]))
  expect(bands.f0.range).toEqual([110, 190])
  expect(bands.f1.range).toEqual([230, 430])
  expect(bands.f2.range).toEqual([2600, 2900])
})

it('projects overlapping legacy centers to the nearest ordered combination', () => {
  const normalized = normalizeTargetBands(makeBands([200, 280], [800, 1200], [900, 1000]))
  expect(normalized.f1.range).toEqual([750, 950])
  expect(normalized.f2.range).toEqual([950, 1250])
})

it('normalizes malformed numeric ranges without squeezing any fixed width', () => {
  const values = [-100, 0, 20, 50, 100, 3490, 3500, 5000, NaN, Infinity]
  for (const lo of values) for (const hi of values) {
    const normalized = normalizeTargetBands(makeBands([lo, hi], [hi, lo], [lo, hi]))
    expect(normalized.f0.range[0]).toBeGreaterThanOrEqual(0)
    expect(normalized.f0.range[1]).toBeLessThanOrEqual(500)
    expect(normalized.f1.range[0]).toBeGreaterThanOrEqual(0)
    expect(normalized.f1.range[1]).toBeLessThanOrEqual(normalized.f2.range[0])
    expect(normalized.f2.range[1]).toBeLessThanOrEqual(3500)
    for (const key of ['f0', 'f1', 'f2'] as const) expect(normalized[key].range[1] - normalized[key].range[0]).toBe(TARGET_HALF_WIDTH_HZ[key] * 2)
    expect(normalizeTargetBands(normalized)).toBe(normalized)
  }
})
