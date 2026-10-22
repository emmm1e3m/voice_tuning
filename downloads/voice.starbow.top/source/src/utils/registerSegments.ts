import type { AnalysisFrame, VoiceRegister } from '../types'

export const REGISTER_COLORS = { chest: '#db9c61', mixed: '#6ca891', falsetto: '#9790ce' } as const
export const REGISTER_EXPLANATION = '竖直背景色带按时间标示真声、混声、假声的估计，帮助定位换声点、观察过渡稳定性。可在“配置 → 声区校准”中标定个人边界；元音、响度与气声会影响谐波计数。'

type VoicedRegister = Exclude<VoiceRegister, 'unvoiced'>
export interface RegisterSegment { start: number; end: number; register: VoicedRegister }

// 相邻分析帧按中点分段；静音、未知帧和较长缺口均留白，避免跨缺口补画声区。
export function registerSegments(frames: readonly AnalysisFrame[]): RegisterSegment[] {
  const result: RegisterSegment[] = []
  for (let index = 0; index < frames.length; index++) {
    const frame = frames[index]
    const register = frame.register
    if (!register || register === 'unvoiced' || frame.voiced === false || !Number.isFinite(frame.time)
      || frame.f0 == null || !Number.isFinite(frame.f0) || frame.f0 <= 0) continue
    const previous = frames[index - 1]
    const next = frames[index + 1]
    const before = previous ? frame.time - previous.time : 0
    const after = next ? next.time - frame.time : 0
    const start = Math.max(0, frame.time - (before > 0 && before <= 0.100001 ? before / 2 : 0.005))
    const end = frame.time + (after > 0 && after <= 0.100001 ? after / 2 : 0.005)
    const last = result[result.length - 1]
    if (last && last.register === register && Math.abs(last.end - start) < 0.000001) last.end = end
    else result.push({ start, end, register })
  }
  return result
}
