import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useAppStore } from '../store/appStore'
import { clampTargetCenter, getBandCenter, getTargetCenterBounds, TARGET_HALF_WIDTH_HZ, type TargetBandKey } from '../config/targetBandRules'
import type { TargetBands } from '../types'

export type BandKey = TargetBandKey

function makeLocalValues(bands: TargetBands): Record<BandKey, string> {
  return { f0: String(getBandCenter(bands.f0.range)), f1: String(getBandCenter(bands.f1.range)), f2: String(getBandCenter(bands.f2.range)) }
}

export interface PresetBandsApi {
  localValues: Record<BandKey, string>
  inputMessages: Partial<Record<BandKey, string>>
  showInputMessage: (key: BandKey, message: string) => void
  onInputChange: (key: BandKey, value: string) => void
  onSliderChange: (key: BandKey, value: number) => void
  onCommit: (key: BandKey) => void
  onInputKeyDown: (key: BandKey) => (event: KeyboardEvent<HTMLInputElement>) => void
  onReset: () => void
}

export function usePresetBands(): PresetBandsApi {
  const bands = useAppStore(s => s.bands)
  const resetPresets = useAppStore(s => s.resetPresets)
  const [localValues, setLocalValues] = useState(() => makeLocalValues(bands))
  const [inputMessages, setInputMessages] = useState<Partial<Record<BandKey, string>>>({})
  const ownBands = useRef<TargetBands | null>(null)

  useEffect(() => {
    setLocalValues(makeLocalValues(bands))
    if (ownBands.current !== bands) setInputMessages({})
    ownBands.current = null
  }, [bands])

  // 每次从 store 读取最新中心，避免输入失焦与滑杆交互互相覆盖。
  const applyValue = useCallback((key: BandKey, value: number) => {
    if (!Number.isFinite(value)) return '请输入有效中心频率，已恢复原值'
    const state = useAppStore.getState()
    const center = clampTargetCenter(key, value, state.bands)
    if (center !== getBandCenter(state.bands[key].range)) {
      state.setBandCenter(key, center)
      const updated = useAppStore.getState().bands
      ownBands.current = updated
      state.savePresetOverride(state.activePreset, updated.f0.range, updated.f1.range, updated.f2.range)
    }
    if (center !== value) {
      const [min, max] = getTargetCenterBounds(key, state.bands)
      return `中心已调整为 ${center} Hz（可选 ${min}–${max} Hz），保留 ±${TARGET_HALF_WIDTH_HZ[key]} Hz`
    }
  }, [])

  const onInputChange = useCallback((key: BandKey, value: string) => {
    setLocalValues(previous => ({ ...previous, [key]: value }))
    setInputMessages({})
  }, [])

  const onCommit = useCallback((key: BandKey) => {
    const draft = localValues[key].trim()
    const message = applyValue(key, draft === '' ? NaN : Number(draft))
    setInputMessages(message ? { [key]: message } : {})
    setLocalValues(previous => ({ ...previous, [key]: String(getBandCenter(useAppStore.getState().bands[key].range)) }))
  }, [localValues, applyValue])

  const onInputKeyDown = useCallback((_key: BandKey) => (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      const dialog = event.currentTarget.closest<HTMLElement>('[role="dialog"]')
      event.currentTarget.blur()
      dialog?.focus({ preventScroll: true })
    }
  }, [])

  const onSliderChange = useCallback((key: BandKey, value: number) => {
    const message = applyValue(key, value)
    setInputMessages(message ? { [key]: message } : {})
    setLocalValues(previous => ({ ...previous, [key]: String(getBandCenter(useAppStore.getState().bands[key].range)) }))
  }, [applyValue])

  const showInputMessage = useCallback((key: BandKey, message: string) => {
    setInputMessages(message ? { [key]: message } : {})
  }, [])

  const onReset = useCallback(() => {
    if (window.confirm('确定要恢复全部元音的默认中心吗？所有自定义目标将被清除，并切换到元音 a。')) {
      resetPresets()
      ownBands.current = null
      setInputMessages({})
      setLocalValues(makeLocalValues(useAppStore.getState().bands))
    }
  }, [resetPresets])

  return { localValues, inputMessages, showInputMessage, onInputChange, onSliderChange, onCommit, onInputKeyDown, onReset }
}
