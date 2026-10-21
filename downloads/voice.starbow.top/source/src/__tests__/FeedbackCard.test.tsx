import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FeedbackCard } from '../components/FeedbackCard'
import { useAppStore } from '../store/appStore'
import { VOWEL_PRESETS } from '../types'

const vowelA = VOWEL_PRESETS['vowel-a']

function setFrame(f0: number | null, f1: number | null, f2: number | null) {
  useAppStore.getState().setFrames([{ time: 0.1, f0, f1, f2 }])
}

const mid = (lo: number, hi: number) => Math.round((lo + hi) / 2)

describe('FeedbackCard', () => {
  beforeEach(() => {
    useAppStore.getState().reset()
  })

  it('renders header even with no data', () => {
    render(<FeedbackCard />)
    expect(screen.getByText('实时反馈')).toBeTruthy()
  })

  it('shows -- placeholders for values when no data', () => {
    render(<FeedbackCard />)
    expect(screen.getAllByText('--')).toHaveLength(3)
  })

  it('shows idle summary row with — when no data', () => {
    render(<FeedbackCard />)
    expect(screen.getByText('目标区间')).toBeTruthy()
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1)
  })

  it('leaves register presentation in the frequency chart', () => {
    render(<FeedbackCard />)
    expect(screen.queryByText('声区')).toBeNull()
  })

  it('shows real-time F0/F1/F2 values in Hz', () => {
    setFrame(mid(vowelA.f0[0], vowelA.f0[1]), mid(vowelA.f1[0], vowelA.f1[1]), mid(vowelA.f2[0], vowelA.f2[1]))
    render(<FeedbackCard />)
    expect(screen.getByText(`${mid(vowelA.f0[0], vowelA.f0[1])} Hz`)).toBeTruthy()
    expect(screen.getByText(`${mid(vowelA.f1[0], vowelA.f1[1])} Hz`)).toBeTruthy()
    expect(screen.getByText(`${mid(vowelA.f2[0], vowelA.f2[1])} Hz`)).toBeTruthy()
  })

  it('marks value rows with correct data-status', () => {
    const midF0 = mid(vowelA.f0[0], vowelA.f0[1])
    setFrame(midF0, vowelA.f1[0] - 50, vowelA.f2[1] + 100)
    render(<FeedbackCard />)
    const container = document.querySelector('aside')!
    const rows = Array.from(container.querySelectorAll('[data-status]'))
    const rowByLabel = (label: string) =>
      rows.find(r => r.firstChild?.textContent === label) as HTMLElement
    expect(rowByLabel('F0').dataset.status).toBe('hit')
    expect(rowByLabel('F1').dataset.status).toBe('low')
    expect(rowByLabel('F2').dataset.status).toBe('high')
  })

  it('renders summary row with 完美 when all hit', () => {
    setFrame(mid(vowelA.f0[0], vowelA.f0[1]), mid(vowelA.f1[0], vowelA.f1[1]), mid(vowelA.f2[0], vowelA.f2[1]))
    render(<FeedbackCard />)
    expect(screen.getByText('目标区间')).toBeTruthy()
    expect(screen.getByText('完美')).toBeTruthy()
  })

  it('renders summary row with deviation hints when miss', () => {
    setFrame(mid(vowelA.f0[0], vowelA.f0[1]), mid(vowelA.f1[0], vowelA.f1[1]), vowelA.f2[1] + 100)
    render(<FeedbackCard />)
    expect(screen.getByText('F2偏高')).toBeTruthy()
  })

  it('keeps value rows visible when the matching chart series is hidden', () => {
    useAppStore.getState().toggleFormantVisible('f1')
    setFrame(mid(vowelA.f0[0], vowelA.f0[1]), mid(vowelA.f1[0], vowelA.f1[1]), mid(vowelA.f2[0], vowelA.f2[1]))
    render(<FeedbackCard />)
    expect(screen.getByText('F1')).toBeTruthy()
    expect(screen.getByText(`${mid(vowelA.f1[0], vowelA.f1[1])} Hz`)).toBeTruthy()
    expect(screen.getByText('F0')).toBeTruthy()
    expect(screen.getByText('F2')).toBeTruthy()
  })

  it('keeps all live frequencies when every chart curve is hidden', () => {
    for (const key of ['f0', 'f1', 'f2'] as const) useAppStore.getState().toggleFormantVisible(key)
    useAppStore.getState().setFrames([{ time: 1, f0: 220, f1: 900, f2: 1250, register: 'mixed' }])
    render(<FeedbackCard />)
    expect(screen.queryByText('混声')).toBeNull()
    for (const value of ['220 Hz', '900 Hz', '1250 Hz']) expect(screen.getByText(value)).toBeTruthy()
  })
})
