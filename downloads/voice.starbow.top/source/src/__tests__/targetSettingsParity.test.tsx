import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { TrainingGoalCard } from '../components/mobile/TrainingGoalCard'
import { TargetPresetBar } from '../components/TargetPresetBar'
import { useAppStore } from '../store/appStore'
import { getBandCenter, TARGET_HALF_WIDTH_HZ } from '../config/targetBandRules'
import { VOWEL_PRESETS } from '../types'

beforeEach(() => useAppStore.getState().reset())
afterEach(() => { cleanup(); vi.restoreAllMocks() })

describe.each([['portrait', TrainingGoalCard], ['desktop', TargetPresetBar]] as const)('%s center parity', (_name, Component) => {
  it('resets every vowel after the same confirmation, and preserves everything if cancelled', () => {
    const state = useAppStore.getState()
    state.savePresetOverride('vowel-a', [200, 280], [600, 800], [1100, 1400])
    state.savePresetOverride('vowel-o', [200, 280], [400, 600], [700, 1000])
    state.switchPreset('vowel-o')
    const previous = useAppStore.getState().presetOverrides
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<Component />)
    if (_name === 'desktop') fireEvent.click(screen.getByText('本次练习 · 目标中心'))
    fireEvent.click(screen.getByLabelText('重置所有预设'))
    expect(useAppStore.getState().presetOverrides).toEqual(previous)
    expect(useAppStore.getState().activePreset).toBe('vowel-o')
    confirm.mockReturnValue(true)
    fireEvent.click(screen.getByLabelText('重置所有预设'))
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('全部元音的默认中心'))
    expect(useAppStore.getState().presetOverrides).toEqual([])
    expect(useAppStore.getState().activePreset).toBe('vowel-a')
    expect(useAppStore.getState().bands.f1.range).toEqual(VOWEL_PRESETS['vowel-a'].f1)
  })
  it.each([
    ['f0', '-20', 40], ['f0', '1100', 460],
    ['f1', '-20', 100], ['f1', '3400', 1000],
    ['f2', '100', 1150], ['f2', '4000', 3350],
  ] as const)('clamps %s center %s identically and keeps all fixed widths', (key, entered, expected) => {
    render(<Component />)
    if (_name === 'desktop') fireEvent.click(screen.getByText('本次练习 · 目标中心'))
    const input = screen.getByLabelText(`${key.toUpperCase()}目标中心`) as HTMLInputElement
    const before = useAppStore.getState().bands
    fireEvent.change(input, { target: { value: entered } })
    expect(useAppStore.getState().bands).toBe(before)
    fireEvent.blur(input)
    const updated = useAppStore.getState().bands
    expect(getBandCenter(updated[key].range)).toBe(expected)
    expect(input.value).toBe(String(expected))
    expect(screen.getByRole('status')).toBeTruthy()
    for (const other of ['f0', 'f1', 'f2'] as const) {
      expect(updated[other].range[1] - updated[other].range[0]).toBe(TARGET_HALF_WIDTH_HZ[other] * 2)
      if (other !== key) expect(updated[other]).toBe(before[other])
    }
  })
  it('moves the center with keyboard arrows and retains its override across vowel switches', () => {
    render(<Component />)
    if (_name === 'desktop') fireEvent.click(screen.getByText('本次练习 · 目标中心'))
    fireEvent.keyDown(screen.getByLabelText('F1中心滑杆'), { key: 'ArrowLeft' })
    expect(useAppStore.getState().bands.f1.range).toEqual([790, 990])
    fireEvent.click(screen.getByRole('button', { name: 'i' }))
    fireEvent.click(screen.getByRole('button', { name: 'a' }))
    expect((screen.getByLabelText('F1目标中心') as HTMLInputElement).value).toBe('890')
  })
})
