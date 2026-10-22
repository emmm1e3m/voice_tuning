import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TargetPresetBar } from '../components/TargetPresetBar'
import { useAppStore } from '../store/appStore'

describe('TargetPresetBar', () => {
  beforeEach(() => useAppStore.getState().reset())
  it('starts expanded with a native summary and retains the selection after closing', () => {
    const { container } = render(<TargetPresetBar />)
    const details = container.querySelector('details')!
    const summary = container.querySelector('summary')!
    expect(details.open).toBe(true)
    expect(summary.textContent).toContain('目标频率设置')
    expect(summary.textContent).toContain('元音 a')
    expect(summary.querySelector('button')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'i' }))
    fireEvent.click(summary)
    expect(details.open).toBe(false)
    expect(summary.textContent).toContain('元音 i')
    expect(useAppStore.getState().activePreset).toBe('vowel-i')
  })
  it('shows six vowels, three center inputs and exactly three single sliders', () => {
    render(<TargetPresetBar />)
    fireEvent.click(screen.getByText('目标频率设置'))
    for (const label of ['a', 'o', 'e', 'i', 'u', 'ü']) expect(screen.getByRole('button', { name: label })).toBeTruthy()
    expect(screen.getAllByRole('spinbutton')).toHaveLength(3)
    expect(screen.getAllByRole('slider')).toHaveLength(3)
    expect((screen.getByLabelText('F0目标中心') as HTMLInputElement).value).toBe('240')
    for (const text of ['±40 Hz', '±100 Hz', '±150 Hz']) expect(screen.getByText(text)).toBeTruthy()
  })
  it('retains the principle and practice entry for each F', () => {
    const open = vi.fn()
    render(<TargetPresetBar onOpenHelp={open} />)
    fireEvent.click(screen.getByText('目标频率设置'))
    for (const key of ['f0', 'f1', 'f2']) {
      fireEvent.click(screen.getByLabelText(`${key.toUpperCase()} 目标说明`))
      expect(open).toHaveBeenLastCalledWith(key)
    }
  })
  it('switches vowel centers and commits one numeric target', () => {
    render(<TargetPresetBar />)
    fireEvent.click(screen.getByText('目标频率设置'))
    fireEvent.click(screen.getByRole('button', { name: 'i' }))
    const input = screen.getByLabelText('F1目标中心') as HTMLInputElement
    expect(input.value).toBe('386')
    fireEvent.change(input, { target: { value: '400' } })
    fireEvent.blur(input)
    expect(useAppStore.getState().bands.f1.range).toEqual([300, 500])
    expect(useAppStore.getState().bands.f2.range).toEqual([2293, 2593])
  })
})
