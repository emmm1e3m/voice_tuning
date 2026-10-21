import { describe, expect, it } from 'vitest'
import { summarizeFrequencyWindow } from '../utils/windowSummary'

describe('窗口频率中位数', () => {
  it('仅统计当前时间窗口内各自有效的频率，忽略停顿与非有限数值', () => {
    const result = summarizeFrequencyWindow([
      { time: 0, f0: 800, f1: 1800, f2: 3200 },
      { time: 22, f0: 200, f1: 700, f2: null },
      { time: 23, f0: 210, f1: null, f2: 1300 },
      { time: 24, f0: 900, f1: 720, f2: 1400 },
      { time: 25, f0: null, f1: NaN, f2: Infinity },
    ], 5)
    expect(result).toEqual({ f0: 210, f1: 710, f2: 1350 })
  })
  it('空窗口与无效值显示空结果，不延用窗口外的旧声音', () => {
    expect(summarizeFrequencyWindow([], 20)).toEqual({ f0: null, f1: null, f2: null })
    expect(summarizeFrequencyWindow([{time: 1, f0: -1, f1: 0, f2: NaN}], 20)).toEqual({ f0: null, f1: null, f2: null })
  })
  it('保留时长改变后按新范围计算', () => {
    const frames = [{ time: 0, f0: 100, f1: 500, f2: 1000 }, { time: 10, f0: 200, f1: 700, f2: 1400 }]
    expect(summarizeFrequencyWindow(frames, 20)).toEqual({ f0: 150, f1: 600, f2: 1200 })
    expect(summarizeFrequencyWindow(frames, 5)).toEqual({ f0: 200, f1: 700, f2: 1400 })
  })
})
