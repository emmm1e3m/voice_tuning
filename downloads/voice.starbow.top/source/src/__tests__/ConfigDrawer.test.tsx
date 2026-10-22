import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { ConfigDrawer } from '../components/ConfigDrawer'
import { useAppStore } from '../store/appStore'
import { recordingBuffer } from '../audio/recordingBuffer'
import { useRegisterCalibrationStore } from '../store/registerCalibrationStore'

const audioProps = { isCapturing: false, isRequesting: false, onRecord: () => {} }
beforeEach(() => {
  useAppStore.getState().reset()
  useRegisterCalibrationStore.getState().clearCalibration()
})

describe('configuration modal', () => {
  it('uses the shared modal and allows arbitrary valid smoothing and retention integers', () => {
    render(<ConfigDrawer {...audioProps} open onClose={() => {}} />)
    expect(screen.getByRole('dialog', { name: '配置' })).toBeDefined()
    const smoothing = screen.getByRole('spinbutton', { name: /平滑窗口/ }) as HTMLInputElement
    const retention = screen.getByRole('spinbutton', { name: /保留时长/ }) as HTMLInputElement
    expect(smoothing.value).toBe('5')
    expect(retention.value).toBe('10')
    fireEvent.change(smoothing, { target: { value: '12' } })
    expect(useAppStore.getState().config.formantSmoothingWindow).toBe(5)
    fireEvent.keyDown(smoothing, { key: 'Enter' })
    fireEvent.change(retention, { target: { value: '35' } })
    fireEvent.blur(retention)
    expect(useAppStore.getState().config).toMatchObject({ formantSmoothingWindow: 12, audioRetentionSeconds: 35 })
  })

  it('keeps the window choice when smoothing is disabled and enabled again', () => {
    useAppStore.getState().setConfig({ formantSmoothingWindow: 10 })
    render(<ConfigDrawer {...audioProps} open onClose={() => {}} />)
    fireEvent.click(screen.getByRole('checkbox', { name: '启用平滑' }))
    const smoothing = screen.getByRole('spinbutton', { name: /平滑窗口/ }) as HTMLInputElement
    expect(smoothing.disabled).toBe(true)
    expect(smoothing.value).toBe('10')
    fireEvent.click(screen.getByRole('checkbox', { name: '启用平滑' }))
    expect(smoothing.disabled).toBe(false)
    expect(useAppStore.getState().config.formantSmoothingWindow).toBe(10)
  })

  it('allows typing an empty draft without committing invalid config and restores it on blur', () => {
    render(<ConfigDrawer {...audioProps} open onClose={() => {}} />)
    const retention = screen.getByRole('spinbutton', { name: /保留时长/ }) as HTMLInputElement
    for (const value of ['', '2', '121', '20.5']) {
      fireEvent.change(retention, { target: { value } })
      expect(retention.getAttribute('aria-invalid')).toBe('true')
      expect(useAppStore.getState().config.audioRetentionSeconds).toBe(10)
      fireEvent.blur(retention)
      expect(retention.value).toBe('10')
    }
  })

  it('does not resize at an intermediate 12 while typing 120, then expands without dropping recorded samples', () => {
    recordingBuffer.clear()
    const audio = Float32Array.from({ length: 8 * 16000 }, (_, index) => index / (8 * 16000))
    recordingBuffer.write(audio)
    render(<ConfigDrawer {...audioProps} open onClose={() => {}} />)
    const retention = screen.getByRole('spinbutton', { name: /保留时长/ }) as HTMLInputElement
    for (const value of ['', '1', '12', '120']) {
      fireEvent.change(retention, { target: { value } })
      expect(useAppStore.getState().config.audioRetentionSeconds).toBe(10)
      expect(recordingBuffer.capacity).toBe(10 * 16000)
      expect(recordingBuffer.size).toBe(audio.length)
    }
    fireEvent.keyDown(retention, { key: 'Enter' })
    expect(useAppStore.getState().config.audioRetentionSeconds).toBe(120)
    expect(recordingBuffer.capacity).toBe(120 * 16000)
    expect(recordingBuffer.size).toBe(audio.length)
    expect(recordingBuffer.read().slice(0, 16)).toEqual(audio.slice(0, 16))
    expect(recordingBuffer.read().slice(-16)).toEqual(audio.slice(-16))
  })

  it('commits a focused valid draft when the modal closes with Escape', () => {
    render(<ConfigDrawer {...audioProps} open onClose={() => {}} />)
    const retention = screen.getByRole('spinbutton', { name: /保留时长/ }) as HTMLInputElement
    retention.focus()
    fireEvent.change(retention, { target: { value: '30' } })
    expect(useAppStore.getState().config.audioRetentionSeconds).toBe(10)
    fireEvent.keyDown(retention, { key: 'Escape' })
    expect(useAppStore.getState().config.audioRetentionSeconds).toBe(30)
  })

  it('supports recording and boundary sampling inside configuration without closing the modal', () => {
    const onRecord = vi.fn()
    const props = { ...audioProps, open: true, onClose: vi.fn(), onRecord }
    const { rerender } = render(<ConfigDrawer {...props} />)
    expect(screen.getByRole('heading', { name: '声区校准' })).toBeDefined()
    expect(document.querySelector('details')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '开始录音' }))
    expect(onRecord).toHaveBeenCalledTimes(1)
    expect(props.onClose).not.toHaveBeenCalled()
    rerender(<ConfigDrawer {...props} isRequesting />)
    expect((screen.getByRole('button', { name: '麦克风授权中…' }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: '采集边界声' }) as HTMLButtonElement).disabled).toBe(true)
    rerender(<ConfigDrawer {...props} isCapturing />)
    fireEvent.click(screen.getByRole('button', { name: '采集边界声' }))
    const magnitudes = new Float32Array(1025).fill(-90)
    for (let harmonic = 1; harmonic <= 4; harmonic++) magnitudes[32 * harmonic] = harmonic === 1 ? 0 : -10
    act(() => {
      for (let index = 1; index <= 125; index++) useAppStore.getState().appendFrame({ time: index * .01, f0: 250, f1: null, f2: null, voiced: true, rms: .1, magnitudes })
    })
    expect(useRegisterCalibrationStore.getState().calibration).toMatchObject({ boundaryCount: 3, f0: 250 })
    expect(screen.getByRole('dialog', { name: '配置' })).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: '停止录音' }))
    expect(onRecord).toHaveBeenCalledTimes(2)
  })

  it('unsubscribes unfinished sampling when configuration closes', () => {
    const props = { ...audioProps, isCapturing: true, onClose: () => {} }
    const { rerender } = render(<ConfigDrawer {...props} open />)
    fireEvent.click(screen.getByRole('button', { name: '采集边界声' }))
    rerender(<ConfigDrawer {...props} open={false} />)
    expect(screen.queryByRole('dialog')).toBeNull()
    rerender(<ConfigDrawer {...props} open />)
    expect(screen.queryByRole('progressbar')).toBeNull()
    expect(useRegisterCalibrationStore.getState().calibration).toBeNull()
  })
})
