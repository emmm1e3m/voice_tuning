import type { TargetBands } from '../types'
import { BAND_INPUT_LIMITS } from './analysisRanges'
import { VOWEL_PRESETS } from '../types'

export type TargetBandKey = 'f0' | 'f1' | 'f2'

// 固定的是练习参考窗口，不是对声音性别或健康状况的判定标准。
export const TARGET_HALF_WIDTH_HZ: Readonly<Record<TargetBandKey, number>> = { f0: 40, f1: 100, f2: 150 }

export function getBandCenter(range: readonly [number, number]): number {
  return range[0] / 2 + range[1] / 2
}

export function rangeFromCenter(key: TargetBandKey, center: number): [number, number] {
  const half = TARGET_HALF_WIDTH_HZ[key]
  return [center - half, center + half]
}

// F0 只提供音高目标；共振峰参考独立取自元音预设，不能由 F0 推算个人声道。
export function recommendVowelTargets(bands: TargetBands, presetName: string, f0Center = getBandCenter(bands.f0.range)): TargetBands {
  const preset = VOWEL_PRESETS[presetName] ?? VOWEL_PRESETS['vowel-a']
  const matches = (key: 'f1' | 'f2') => bands[key].range[0] === preset[key][0] && bands[key].range[1] === preset[key][1]
  const recommended = normalizeTargetBands({ ...bands, f1: matches('f1') ? bands.f1 : { ...bands.f1, range: preset.f1 }, f2: matches('f2') ? bands.f2 : { ...bands.f2, range: preset.f2 } })
  return updateTargetCenter(recommended, 'f0', f0Center)
}

export function getTargetCenterBounds(key: TargetBandKey, bands: TargetBands): [number, number] {
  const { min, max } = BAND_INPUT_LIMITS[key]
  const half = TARGET_HALF_WIDTH_HZ[key]
  return [
    key === 'f2' ? Math.max(min + half, bands.f1.range[1] + half) : min + half,
    key === 'f1' ? Math.min(max - half, bands.f2.range[0] - half) : max - half,
  ]
}

export function clampTargetCenter(key: TargetBandKey, center: number, bands: TargetBands): number {
  const [min, max] = getTargetCenterBounds(key, bands)
  return Math.max(min, Math.min(max, center))
}

// 只调整正在编辑的 F；另一条目标带不会为了让路而偷偷移动。
export function updateTargetCenter(bands: TargetBands, key: TargetBandKey, center: number): TargetBands {
  if (!Number.isFinite(center)) return bands
  const next = rangeFromCenter(key, clampTargetCenter(key, center, bands))
  if (next[0] === bands[key].range[0] && next[1] === bands[key].range[1]) return bands
  return { ...bands, [key]: { ...bands[key], range: next } }
}

// 旧数据只在读取边界统一迁移：保留原中点，补足固定宽度；冲突时取最近的有序中心组合。
export function normalizeTargetBands(bands: TargetBands): TargetBands {
  const defaults = { f0: 240, f1: 900, f2: 1250 }
  const centers = {} as Record<TargetBandKey, number>
  for (const key of ['f0', 'f1', 'f2'] as const) {
    const half = TARGET_HALF_WIDTH_HZ[key]
    const limits = BAND_INPUT_LIMITS[key]
    const center = getBandCenter(bands[key].range)
    centers[key] = Math.max(limits.min + half, Math.min(limits.max - half, Number.isFinite(center) ? center : defaults[key]))
  }
  const separation = TARGET_HALF_WIDTH_HZ.f1 + TARGET_HALF_WIDTH_HZ.f2
  if (centers.f2 - centers.f1 < separation) {
    const firstMin = BAND_INPUT_LIMITS.f1.min + TARGET_HALF_WIDTH_HZ.f1
    const firstMax = BAND_INPUT_LIMITS.f2.max - TARGET_HALF_WIDTH_HZ.f2 - separation
    centers.f1 = Math.max(firstMin, Math.min(firstMax, centers.f1 / 2 + centers.f2 / 2 - separation / 2))
    centers.f2 = centers.f1 + separation
  }
  const next = { ...bands }
  let changed = false
  for (const key of ['f0', 'f1', 'f2'] as const) {
    const range = rangeFromCenter(key, centers[key])
    if (range[0] !== bands[key].range[0] || range[1] !== bands[key].range[1]) {
      next[key] = { ...bands[key], range }
      changed = true
    }
  }
  return changed ? next : bands
}
