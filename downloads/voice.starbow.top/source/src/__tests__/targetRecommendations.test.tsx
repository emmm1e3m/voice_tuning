import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { useAppStore } from '../store/appStore'
import { TargetPresetBar } from '../components/TargetPresetBar'
import { TrainingGoalCard } from '../components/mobile/TrainingGoalCard'
import { getBandCenter } from '../config/targetBandRules'

beforeEach(() => useAppStore.getState().reset())

describe('随 F0 推荐练习目标', () => {
  it('默认展开，设置音高会重算两条共振峰，切换元音保留 F0', () => {
    render(<TargetPresetBar />)
    expect(screen.getByLabelText('目标频率设置').hasAttribute('open')).toBe(true)
    const f0 = screen.getByLabelText('F0目标中心')
    fireEvent.change(f0, { target: { value: '300' } })
    fireEvent.blur(f0)
    expect(useAppStore.getState().bands.f1.range).toEqual([908, 1108])
    expect(useAppStore.getState().bands.f2.range).toEqual([1388, 1688])
    fireEvent.click(screen.getByRole('button', { name: 'i' }))
    const { bands } = useAppStore.getState()
    expect(getBandCenter(bands.f0.range)).toBe(300)
    expect(bands.f1.range).toEqual([314, 514])
    expect(bands.f2.range).toEqual([2539, 2839])
    expect(within(screen.getByRole('group', { name: '元音预设' })).getAllByRole('button').map(button => button.textContent)).toEqual(['a', 'o', 'e', 'i', 'u', 'ü'])
  })
  it.each([TargetPresetBar, TrainingGoalCard])('桌面与手机的 F0 滑杆都会同步更新 F1/F2', Component => {
    render(<Component />)
    const before = useAppStore.getState().bands
    fireEvent.keyDown(screen.getByLabelText('F0中心滑杆'), { key: 'ArrowRight' })
    const after = useAppStore.getState().bands
    expect(getBandCenter(after.f0.range)).toBe(245)
    expect(getBandCenter(after.f1.range)).toBeGreaterThan(getBandCenter(before.f1.range))
    expect(getBandCenter(after.f2.range)).toBeGreaterThan(getBandCenter(before.f2.range))
    expect((screen.getByLabelText('F1目标中心') as HTMLInputElement).value).toBe(String(getBandCenter(after.f1.range)))
    expect((screen.getByLabelText('F2目标中心') as HTMLInputElement).value).toBe(String(getBandCenter(after.f2.range)))
  })
  it('手调共振峰进入手动，后续音高修改不覆盖，推荐按钮可重新计算', () => {
    render(<TargetPresetBar />)
    const f1 = screen.getByLabelText('F1目标中心')
    fireEvent.change(f1, { target: { value: '700' } })
    fireEvent.blur(f1)
    expect(useAppStore.getState().targetMode).toBe('manual')
    const manualF2 = useAppStore.getState().bands.f2.range
    const f0 = screen.getByLabelText('F0目标中心')
    fireEvent.change(f0, { target: { value: '300' } })
    fireEvent.blur(f0)
    expect(getBandCenter(useAppStore.getState().bands.f1.range)).toBe(700)
    expect(useAppStore.getState().bands.f2.range).toEqual(manualF2)
    fireEvent.click(screen.getByRole('button', { name: '随F0推荐' }))
    expect(useAppStore.getState().bands.f1.range).toEqual([908, 1108])
    expect(getBandCenter(useAppStore.getState().bands.f0.range)).toBe(300)
  })
  it('手动模式切换元音仍保留当前 F0，保留各元音自定共振峰', () => {
    useAppStore.getState().setBandCenter('f1', 700)
    useAppStore.getState().savePresetOverride('vowel-a', [200, 280], [600, 800], [1300, 1600])
    useAppStore.getState().setBandCenter('f0', 300)
    useAppStore.getState().switchPreset('vowel-i')
    expect(getBandCenter(useAppStore.getState().bands.f0.range)).toBe(300)
    useAppStore.getState().switchPreset('vowel-a')
    expect(getBandCenter(useAppStore.getState().bands.f0.range)).toBe(300)
    expect(useAppStore.getState().bands.f1.range).toEqual([600, 800])
  })
})
