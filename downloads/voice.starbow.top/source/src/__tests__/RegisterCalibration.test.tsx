import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RegisterCalibration } from '../components/RegisterCalibration'
import { useAppStore } from '../store/appStore'
import { useRegisterCalibrationStore } from '../store/registerCalibrationStore'

const recordingProps = { isRequesting: false, onRecord: () => {} }

beforeEach(() => {
  useAppStore.getState().reset()
  useRegisterCalibrationStore.getState().clearCalibration()
})
afterEach(() => { cleanup(); vi.useRealTimers() })

function sendFrames(voiced: boolean) {
  const magnitudes = new Float32Array(1025).fill(-90)
  for (let harmonic = 1; harmonic <= 4; harmonic++) magnitudes[32 * harmonic] = harmonic === 1 ? 0 : -10
  act(() => {
    for (let index = 1; index <= 125; index++) {
      useAppStore.getState().appendFrame({ time: index * .01, f0: voiced ? 250 : null, f1: null, f2: null, voiced, rms: voiced ? .1 : 0, magnitudes })
    }
  })
}

describe('声区校准控件', () => {
  it('未录音时禁用采样；静音超时不保存校准', () => {
    vi.useFakeTimers()
    const { rerender } = render(<RegisterCalibration {...recordingProps} isCapturing={false} />)
    expect((screen.getByRole('button', { name: '采集边界声', hidden: true }) as HTMLButtonElement).disabled).toBe(true)
    rerender(<RegisterCalibration {...recordingProps} isCapturing />)
    fireEvent.click(screen.getByRole('button', { name: '采集边界声', hidden: true }))
    sendFrames(false)
    act(() => vi.advanceTimersByTime(12000))
    expect(useRegisterCalibrationStore.getState().calibration).toBeNull()
    expect(screen.getByRole('status', { hidden: true }).textContent).toContain('未取得稳定')
  })

  it('保存稳定边界并允许恢复默认', () => {
    render(<RegisterCalibration {...recordingProps} isCapturing />)
    fireEvent.click(screen.getByRole('button', { name: '采集边界声', hidden: true }))
    sendFrames(true)
    expect(useRegisterCalibrationStore.getState().calibration).toMatchObject({ boundaryCount: 3, f0: 250 })
    expect(screen.getByRole('status', { hidden: true }).textContent).toContain('校准已保存')
    fireEvent.click(screen.getByRole('button', { name: '恢复默认', hidden: true }))
    expect(useRegisterCalibrationStore.getState().calibration).toBeNull()
  })

  it('无效样本不能覆盖已有校准', () => {
    const samples = Array.from({ length: 120 }, (_, index) => ({ time: index * .01, f0: 250, harmonicCount: 3 }))
    expect(useRegisterCalibrationStore.getState().saveSamples(samples)).toBe(true)
    const calibration = useRegisterCalibrationStore.getState().calibration
    expect(useRegisterCalibrationStore.getState().saveSamples([])).toBe(false)
    expect(useRegisterCalibrationStore.getState().calibration).toBe(calibration)
  })
})
