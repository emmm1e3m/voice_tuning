import { describe, expect, it } from 'vitest'
import { registerSegments } from '../utils/registerSegments'
import type { AnalysisFrame } from '../types'

const frame = (time: number, register: AnalysisFrame['register'], f0: number | null = 220): AnalysisFrame => ({ time, f0, f1: 900, f2: 1250, register })

describe('声区时间分段', () => {
  it('合并相邻同声区，声区边界位于采样中点', () => {
    expect(registerSegments([frame(0, 'chest'), frame(.01, 'chest'), frame(.02, 'mixed')])).toEqual([
      { start: 0, end: .015, register: 'chest' }, { start: .015, end: .025, register: 'mixed' },
    ])
  })
  it('未知声区、静音与长数据缺口留白，不按 F1/F2 频率划声区', () => {
    const segments = registerSegments([frame(0, 'chest'), frame(.01, null), frame(.02, 'falsetto', null), frame(1, 'chest'), { ...frame(1.01, 'mixed'), voiced: false }])
    expect(segments).toHaveLength(2)
    expect(segments[0].end).toBe(.005)
    expect(segments[1].start).toBe(.995)
  })
})
