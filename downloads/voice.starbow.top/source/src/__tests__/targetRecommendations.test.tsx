import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { useAppStore } from '../store/appStore'
import { TargetPresetBar } from '../components/TargetPresetBar'
import { VOWEL_PRESETS } from '../types'
import { getBandCenter } from '../config/targetBandRules'

beforeEach(() => useAppStore.getState().reset())

describe('按元音推荐练习目标', () => {
  it('默认展开，设置音高并切换元音时保留 F0，采用独立元音参考', () => {
    render(<TargetPresetBar />)
    expect(screen.getByLabelText('练习目标中心').hasAttribute('open')).toBe(true)
    const f0 = screen.getByLabelText('F0目标中心')
    fireEvent.change(f0, { target: { value: '300' } })
    fireEvent.blur(f0)
    fireEvent.click(screen.getByRole('button', { name: 'i' }))
    const { bands } = useAppStore.getState()
    expect(getBandCenter(bands.f0.range)).toBe(300)
    expect(bands.f1.range).toEqual(VOWEL_PRESETS['vowel-i'].f1)
    expect(bands.f2.range).toEqual(VOWEL_PRESETS['vowel-i'].f2)
    expect(screen.getByText(/F0 不决定共振峰/)).toBeTruthy()
  })
  it('手调共振峰进入手动，后续音高修改不覆盖，推荐按钮可重新计算', () => {
    render(<TargetPresetBar />)
    const f1 = screen.getByLabelText('F1目标中心')
    fireEvent.change(f1, { target: { value: '700' } })
    fireEvent.blur(f1)
    expect(useAppStore.getState().targetMode).toBe('manual')
    const f0 = screen.getByLabelText('F0目标中心')
    fireEvent.change(f0, { target: { value: '300' } })
    fireEvent.blur(f0)
    expect(getBandCenter(useAppStore.getState().bands.f1.range)).toBe(700)
    fireEvent.click(screen.getByRole('button', { name: '按元音推荐' }))
    expect(useAppStore.getState().bands.f1.range).toEqual(VOWEL_PRESETS['vowel-a'].f1)
    expect(getBandCenter(useAppStore.getState().bands.f0.range)).toBe(300)
  })
})
