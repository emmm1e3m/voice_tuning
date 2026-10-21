import { describe, expect, it } from 'vitest'
import { frequencyAxis } from '../utils/frequencyChart'
import { chartTimeAxis } from '../utils/chartTimeline'
import { formatFrequencyPreview, formatTimePreview } from '../utils/chartFormatting'

describe('integer chart hover labels', () => {
  it.each(['log', 'linear'] as const)('uses an integer frequency pointer on an empty %s chart', scale => {
    const axis = frequencyAxis(scale, 3500, false, [])
    expect(axis.axisPointer.label.formatter({ value: 451.924890466 })).toBe('452 Hz')
    expect(axis.axisPointer.label.formatter({ value: 300.49 })).toBe('300 Hz')
    expect(axis.axisPointer.label.fontSize).toBe(15)
    expect(axis.axisLabel.fontSize).toBe(13.75)
  })

  it('rounds the hover time independently from fine static ticks on short recordings', () => {
    const axis = chartTimeAxis([{ time: 0.5 }], true)
    expect(axis.axisPointer.label.formatter({ value: 8.21 })).toBe('8 s')
    expect(axis.axisPointer.label.formatter({ value: 8.8 })).toBe('9 s')
    expect(axis.axisLabel.formatter(0.2)).toBe('0.2 s')
    expect(axis.axisLabel.formatter(0.4)).toBe('0.4 s')
    expect(axis.axisLabel.fontSize).toBe(12.5)
  })

  it('uses placeholders for unavailable previews', () => {
    for (const value of [null, undefined, NaN, Infinity]) {
      expect(formatFrequencyPreview(value)).toBe('--')
      expect(formatTimePreview(value)).toBe('--')
    }
    expect(formatFrequencyPreview(0)).toBe('0 Hz')
  })
})
