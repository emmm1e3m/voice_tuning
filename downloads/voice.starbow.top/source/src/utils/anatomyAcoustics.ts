import { VOWEL_PRESETS } from '../types'

export type AnatomyPositionKey = 'larynx' | 'tongueFront' | 'tongueHeight' | 'lips' | 'jaw' | 'tension'
export type AnatomyPosition = Record<AnatomyPositionKey, number>
export type AnatomyFrequency = 'f0' | 'f1' | 'f2'
export type AnatomyFrequencies = Record<AnatomyFrequency, number>
export type FormantPoint = Pick<AnatomyFrequencies, 'f1' | 'f2'>

const RELATED_FREQUENCIES: Record<AnatomyPositionKey, readonly AnatomyFrequency[]> = {
  tension: ['f0'], larynx: ['f1', 'f2'], tongueFront: ['f2'],
  tongueHeight: ['f1'], lips: ['f1', 'f2'], jaw: ['f1'],
}

export function isAnatomyPartRelevant(part: AnatomyPositionKey, focus: 'all' | AnatomyFrequency): boolean {
  return focus === 'all' || RELATED_FREQUENCIES[part].includes(focus)
}

const clamp = (value: number, low = 0, high = 100) => Math.min(high, Math.max(low, value))
const LIP_F2 = Math.log(2750 / 2000) / 80
export const INITIAL_ANATOMY: AnatomyPosition = { larynx: 50, tongueFront: 50, tongueHeight: 45, lips: 15, jaw: 35, tension: 40 }

export function anatomyVowelReference(vowel: string): AnatomyFrequencies {
  const preset = VOWEL_PRESETS[vowel] ?? VOWEL_PRESETS['vowel-a']
  return { f0: (preset.f0[0] + preset.f0[1]) / 2, f1: (preset.f1[0] + preset.f1[1]) / 2, f2: (preset.f2[0] + preset.f2[1]) / 2 }
}

// 同一组动作始终产生同一组频率。系数表达典型方向，供交互教学使用，不拟合个人生理数据。
// 舌面与下颌共同形成开闭，圆唇延长声道；F0 只取决于独立的声源参数。
export function anatomyFrequencies(position: AnatomyPosition): AnatomyFrequencies {
  const p = Object.fromEntries(Object.entries(position).map(([key, value]) => [key, clamp(value)])) as AnatomyPosition
  const openness = .55 * (100 - p.tongueHeight) + .45 * p.jaw
  const f1 = Math.round(clamp(220 * Math.exp(1.68 * openness / 100 + .0025 * (p.larynx - 50) - .0012 * (p.lips - 10)), 150, 1400))
  return {
    f0: Math.round(clamp(240 * Math.exp((p.tension - 40) / 100), 80, 500)),
    f1,
    f2: Math.round(clamp(1250 * Math.exp(.02 * (p.tongueFront - 50) - LIP_F2 * (p.lips - 10) + .003 * (p.larynx - 50)), Math.max(400, f1 + 160), 3700)),
  }
}

// 拖动元音图时保留喉位、唇形与声源，优先以最小的舌高／下颌协同位移达到开闭目标。
// 到达动作边界后只显示实际可达频率，避免图中点与解剖图出现两套状态。
export function anatomyPositionForFormants(position: AnatomyPosition, point: FormantPoint): AnatomyPosition {
  const current = anatomyFrequencies(position)
  const unchangedF1 = Math.abs(point.f1 - current.f1) < .5
  const openness = clamp((Math.log(clamp(point.f1, 150, 1400) / 220) - .0025 * (position.larynx - 50) + .0012 * (position.lips - 10)) * 100 / 1.68)
  const previous = .55 * (100 - position.tongueHeight) + .45 * position.jaw
  const delta = openness - previous
  let tongueHeight = unchangedF1 ? position.tongueHeight : clamp(position.tongueHeight - delta * .55 / (.55 ** 2 + .45 ** 2))
  let jaw = unchangedF1 ? position.jaw : clamp(position.jaw + delta * .45 / (.55 ** 2 + .45 ** 2))
  if (!unchangedF1 && (tongueHeight === 0 || tongueHeight === 100)) jaw = clamp((openness - .55 * (100 - tongueHeight)) / .45)
  if (!unchangedF1 && (jaw === 0 || jaw === 100)) tongueHeight = clamp(100 - (openness - .45 * jaw) / .55)
  const tongueFront = Math.abs(point.f2 - current.f2) < .5 ? position.tongueFront : clamp(50 + (Math.log(clamp(point.f2, 400, 3700) / 1250) + LIP_F2 * (position.lips - 10) - .003 * (position.larynx - 50)) / .02)
  return { ...position, tongueHeight, jaw, tongueFront }
}

function referencePosition(vowel: string, lips: number): AnatomyPosition {
  const reference = anatomyVowelReference(vowel)
  const openness = (Math.log(reference.f1 / 220) + .0012 * (lips - 10)) * 100 / 1.68
  return {
    larynx: 50, lips,
    tongueFront: 50 + (Math.log(reference.f2 / 1250) + LIP_F2 * (lips - 10)) / .02,
    tongueHeight: 100 - openness, jaw: openness,
    tension: 40 + Math.log(reference.f0 / 240) * 100,
  }
}

export const ANATOMY_VOWELS: Record<string, { name: string; symbol: string; action: string; position: AnatomyPosition }> = {
  'vowel-a': { name: 'a', symbol: 'a', action: '舌面较低，开口较大，嘴唇自然展开。', position: referencePosition('vowel-a', 10) },
  'vowel-o': { name: 'o', symbol: 'o', action: '舌位靠后，嘴唇拢圆，开口比 a 小。', position: referencePosition('vowel-o', 75) },
  'vowel-e': { name: 'e', symbol: 'ɤ', action: '普通话 e /ɤ/ 是后部不圆唇元音；与 o 比较唇形。', position: referencePosition('vowel-e', 10) },
  'vowel-i': { name: 'i', symbol: 'i', action: '舌面较高、靠前，嘴唇展开，开口较小。', position: referencePosition('vowel-i', 5) },
  'vowel-u': { name: 'u', symbol: 'u', action: '舌面较高、靠后，嘴唇拢圆并前突。', position: referencePosition('vowel-u', 90) },
  'vowel-yu': { name: 'ü', symbol: 'y', action: '前高圆唇元音 /y/；保持靠前的舌位，比较与 i 的唇形。', position: referencePosition('vowel-yu', 85) },
}

// 两个钟形峰只演示滤波包络；宽度与强度是图示参数，不是声压级测量。
export function anatomyEnvelope(hz: number, f1: number, f2: number): number {
  const gap = f2 - f1
  return .08 + .82 * Math.exp(-(((hz - f1) / Math.min(110, gap / 4)) ** 2)) + .7 * Math.exp(-(((hz - f2) / Math.min(170, gap / 4)) ** 2))
}
