import { VOWEL_PRESETS } from '../types'

export type AnatomyPositionKey = 'larynx' | 'tongueFront' | 'tongueHeight' | 'lips' | 'jaw' | 'tension'
export type AnatomyPosition = Record<AnatomyPositionKey, number>
export type AnatomyFrequency = 'f0' | 'f1' | 'f2'

export const INITIAL_ANATOMY: AnatomyPosition = { larynx: 50, tongueFront: 50, tongueHeight: 45, lips: 15, jaw: 35, tension: 40 }

export const ANATOMY_VOWELS: Record<string, { name: string; position: AnatomyPosition }> = {
  'vowel-a': { name: 'a（啊）', position: { ...INITIAL_ANATOMY, tongueHeight: 15, jaw: 80, lips: 10 } },
  'vowel-o': { name: 'o（喔）', position: { ...INITIAL_ANATOMY, tongueFront: 25, tongueHeight: 45, jaw: 45, lips: 75 } },
  'vowel-e': { name: 'e（鹅）', position: { ...INITIAL_ANATOMY, tongueFront: 30, tongueHeight: 45, jaw: 45, lips: 10 } },
  'vowel-i': { name: 'i（衣）', position: { ...INITIAL_ANATOMY, tongueFront: 85, tongueHeight: 85, jaw: 20, lips: 5 } },
  'vowel-u': { name: 'u（乌）', position: { ...INITIAL_ANATOMY, tongueFront: 20, tongueHeight: 80, jaw: 20, lips: 90 } },
  'vowel-yu': { name: 'ü（迂）', position: { ...INITIAL_ANATOMY, tongueFront: 85, tongueHeight: 85, jaw: 20, lips: 85 } },
}

// 这些权重只安排教学指示点的位移，不是生理参数、百分比或频率预测。
// 方向依据 USC 元音声学课程及 UNSW 声源—滤波器资料；真实动作存在耦合。
const EFFECTS: Record<AnatomyPositionKey, Record<AnatomyFrequency, number>> = {
  tension: { f0: 1, f1: 0, f2: 0 },
  larynx: { f0: 0, f1: .3, f2: .4 },
  tongueFront: { f0: 0, f1: 0, f2: .8 },
  tongueHeight: { f0: 0, f1: -.75, f2: 0 },
  lips: { f0: 0, f1: -.2, f2: -.5 },
  jaw: { f0: 0, f1: .6, f2: 0 },
}

export function anatomyFrequencyShift(position: AnatomyPosition, baseline: AnatomyPosition = INITIAL_ANATOMY): Record<AnatomyFrequency, number> {
  const result = { f0: 0, f1: 0, f2: 0 }
  for (const key of Object.keys(EFFECTS) as AnatomyPositionKey[]) {
    const delta = (Math.min(100, Math.max(0, position[key])) - baseline[key]) / 100
    for (const frequency of ['f0', 'f1', 'f2'] as const) result[frequency] += delta * EFFECTS[key][frequency]
  }
  return result
}

export function anatomyVowelReference(vowel: string): Record<AnatomyFrequency, number> {
  const preset = VOWEL_PRESETS[vowel] ?? VOWEL_PRESETS['vowel-a']
  return { f0: (preset.f0[0] + preset.f0[1]) / 2, f1: (preset.f1[0] + preset.f1[1]) / 2, f2: (preset.f2[0] + preset.f2[1]) / 2 }
}

// 以所选元音的练习参考中心为零点；指数只让典型升降方向平滑可见，不拟合个人生理数据。
export function anatomyFrequencies(position: AnatomyPosition, vowel: string): Record<AnatomyFrequency, number> {
  const reference = anatomyVowelReference(vowel)
  const shifts = anatomyFrequencyShift(position, (ANATOMY_VOWELS[vowel] ?? ANATOMY_VOWELS['vowel-a']).position)
  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
  const f1 = Math.round(clamp(reference.f1 * Math.exp(shifts.f1 * .55), 150, 1400))
  return {
    f0: Math.round(clamp(reference.f0 * Math.exp(shifts.f0), 80, 500)),
    f1,
    f2: Math.round(clamp(reference.f2 * Math.exp(shifts.f2 * .55), f1 + 160, 3700)),
  }
}

// 两个钟形峰只演示滤波包络；宽度与强度是图示参数，不是声压级测量。
export function anatomyEnvelope(hz: number, f1: number, f2: number): number {
  const gap = f2 - f1
  return .08 + .82 * Math.exp(-(((hz - f1) / Math.min(110, gap / 4)) ** 2)) + .7 * Math.exp(-(((hz - f2) / Math.min(170, gap / 4)) ** 2))
}

export function anatomyShiftLabel(shift: number): string {
  return Math.abs(shift) < .015 ? '接近复位' : shift > 0 ? '向高频移动' : '向低频移动'
}
