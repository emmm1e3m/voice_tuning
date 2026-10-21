import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TrainingGoalCard } from '../components/mobile/TrainingGoalCard'
import { useAppStore } from '../store/appStore'

describe('TrainingGoalCard', () => {
  beforeEach(() => useAppStore.getState().reset())
  it('shows one editable center and one slider per F on mobile', () => {
    render(<TrainingGoalCard />)
    expect(screen.getAllByRole('spinbutton')).toHaveLength(3)
    expect(screen.getAllByRole('slider')).toHaveLength(3)
    expect(screen.getByRole('button', { name: 'a' }).getAttribute('aria-pressed')).toBe('true')
  })
  it('opens the relevant learning material from each target', () => {
    const open = vi.fn()
    render(<TrainingGoalCard onOpenHelp={open} />)
    fireEvent.click(screen.getByLabelText('F2 目标原理与练习'))
    expect(open).toHaveBeenCalledWith('f2')
  })
  it('commits a focused decimal center on Enter and then blurs', () => {
    render(<TrainingGoalCard />)
    const input = screen.getByLabelText('F0目标中心') as HTMLInputElement
    input.focus()
    fireEvent.change(input, { target: { value: '260.5' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(useAppStore.getState().bands.f0.range).toEqual([220.5, 300.5])
    expect(document.activeElement).not.toBe(input)
  })
  it('associates its clamping explanation with the single edited field', () => {
    render(<TrainingGoalCard />)
    const input = screen.getByLabelText('F2目标中心')
    fireEvent.change(input, { target: { value: '800' } })
    fireEvent.blur(input)
    expect(useAppStore.getState().bands.f2.range).toEqual([1000, 1300])
    expect(screen.getByRole('status').textContent).toContain('1150 Hz')
    expect(input.getAttribute('aria-describedby')).toBe(screen.getByRole('status').id)
  })
})
