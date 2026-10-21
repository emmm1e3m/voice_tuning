import { describe, it, expect } from 'vitest'
import { formatF0Tooltip } from '../components/F0Chart'
import type { AnalysisFrame } from '../types'

function mk(time: number, f0: number | null): AnalysisFrame {
  return { time, f0, f1: 0, f2: 0 }
}

describe('formatF0Tooltip', () => {
  it('shows the true frame f0 when the axis clamps the tooltip value', () => {
    const frames = [mk(1.23, 600)]
    const html = formatF0Tooltip([{ value: [1.23, 500] }], frames)
    expect(html).toContain('600 Hz')
    expect(html).not.toContain('500 Hz')
  })

  it('shows frame f0 for an in-range value', () => {
    const frames = [mk(0.5, 240)]
    const html = formatF0Tooltip([{ value: [0.5, 240] }], frames)
    expect(html).toContain('240 Hz')
  })

  it('falls back to the param value when no frame matches the time', () => {
    const frames = [mk(1.23, 600)]
    const html = formatF0Tooltip([{ value: [9.9, 450] }], frames)
    expect(html).toContain('450 Hz')
  })

  it('renders a placeholder when the frame f0 is null', () => {
    const frames = [mk(1.23, null)]
    const html = formatF0Tooltip([{ value: [1.23, 300] }], frames)
    expect(html).toContain('--')
  })

  it('returns empty html for empty params', () => {
    expect(formatF0Tooltip([], [])).toBe('')
  })

  it('previews integer Hz and seconds at 125 percent text size without rounding the frame itself', () => {
    const frames = [mk(8.21, 451.924890466)]
    const html = formatF0Tooltip([{ value: [8.21, 451.924890466] }], frames)
    expect(html).toContain('时间 8 s')
    expect(html).toContain('452 Hz')
    expect(html).toContain('font-size:13.75px')
    expect(html).toContain('font-size:15px')
    expect(frames[0]).toMatchObject({ time: 8.21, f0: 451.924890466 })
  })
})
