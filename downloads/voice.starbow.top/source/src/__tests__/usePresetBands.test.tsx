import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, act } from '@testing-library/react'
import { usePresetBands } from '../hooks/usePresetBands'
import { useAppStore } from '../store/appStore'
import { VOWEL_PRESETS } from '../types'

let api: ReturnType<typeof usePresetBands>
function Probe() { api = usePresetBands(); return null }
function commit(key: 'f0' | 'f1' | 'f2', text: string) {
  act(() => api.onInputChange(key, text))
  act(() => api.onCommit(key))
}
beforeEach(() => useAppStore.getState().reset())
afterEach(() => vi.restoreAllMocks())

describe('usePresetBands centers', () => {
  it('seeds one center draft per frequency', () => {
    render(<Probe />)
    expect(api.localValues).toEqual({ f0: '240', f1: '900', f2: '1250' })
  })
  it('commits only after blur and saves the fixed-width override', () => {
    render(<Probe />)
    act(() => api.onInputChange('f0', '250'))
    expect(useAppStore.getState().bands.f0.range).toEqual([200, 280])
    act(() => api.onCommit('f0'))
    expect(useAppStore.getState().bands.f0.range).toEqual([210, 290])
    expect(useAppStore.getState().presetOverrides[0].f0).toEqual([210, 290])
  })
  it.each(['', 'abc', 'Infinity', '250Hz'])('restores invalid draft %s', draft => {
    render(<Probe />)
    commit('f0', draft)
    expect(api.localValues.f0).toBe('240')
    expect(useAppStore.getState().presetOverrides).toEqual([])
    expect(api.inputMessages.f0).toContain('有效中心')
  })
  it('clamps centers at both F0 endpoints without changing its 80 Hz width', () => {
    render(<Probe />)
    commit('f0', '1100')
    expect(useAppStore.getState().bands.f0.range).toEqual([420, 500])
    expect(api.inputMessages.f0).toContain('±40 Hz')
    commit('f0', '-100')
    expect(useAppStore.getState().bands.f0.range).toEqual([0, 80])
  })
  it('leaves the other F unchanged when a center reaches the ordering boundary', () => {
    render(<Probe />)
    const f2 = useAppStore.getState().bands.f2
    commit('f1', '3000')
    expect(useAppStore.getState().bands.f1.range).toEqual([900, 1100])
    expect(useAppStore.getState().bands.f2).toBe(f2)
    expect(api.inputMessages.f1).toContain('中心已调整为 1000 Hz')
  })
  it('keeps decimal centers and persists them across preset switches', () => {
    render(<Probe />)
    commit('f1', '700.25')
    act(() => useAppStore.getState().switchPreset('vowel-i'))
    expect(api.localValues.f1).toBe('330')
    act(() => useAppStore.getState().switchPreset('vowel-a'))
    expect(api.localValues.f1).toBe('700.25')
    expect(useAppStore.getState().bands.f1.range).toEqual([600.25, 800.25])
  })
  it('uses current store values when a stale draft commits after another center changes', () => {
    render(<Probe />)
    act(() => api.onInputChange('f1', '1000'))
    act(() => api.onSliderChange('f2', 1150))
    act(() => api.onInputChange('f1', '1000'))
    act(() => api.onCommit('f1'))
    expect(useAppStore.getState().bands.f1.range).toEqual([800, 1000])
    expect(useAppStore.getState().bands.f2.range).toEqual([1000, 1300])
  })
  it('updates immediately via the slider and saves the active vowel', () => {
    render(<Probe />)
    act(() => api.onSliderChange('f2', 1500))
    expect(api.localValues.f2).toBe('1500')
    expect(useAppStore.getState().presetOverrides[0].f2).toEqual([1350, 1650])
  })
  it('resets every vowel only after confirmation', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<Probe />)
    commit('f1', '700')
    act(() => api.onReset())
    expect(useAppStore.getState().presetOverrides).toHaveLength(1)
    confirm.mockReturnValue(true)
    act(() => api.onReset())
    expect(useAppStore.getState().presetOverrides).toEqual([])
    expect(useAppStore.getState().bands.f1.range).toEqual(VOWEL_PRESETS['vowel-a'].f1)
    expect(api.localValues.f1).toBe('900')
  })
})
