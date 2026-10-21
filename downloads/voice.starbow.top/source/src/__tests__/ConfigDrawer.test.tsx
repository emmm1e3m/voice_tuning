import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ConfigDrawer } from '../components/ConfigDrawer'
import { useAppStore } from '../store/appStore'
import { recordingBuffer } from '../audio/recordingBuffer'

beforeEach(() => useAppStore.getState().reset())

describe('configuration modal', () => {
  it('uses the shared modal and allows arbitrary valid smoothing and retention integers', () => {
    render(<ConfigDrawer open onClose={() => {}} />)
    expect(screen.getByRole('dialog', { name: '配置' })).toBeDefined()
    const smoothing = screen.getByRole('spinbutton', { name: /平滑窗口/ }) as HTMLInputElement
    const retention = screen.getByRole('spinbutton', { name: /保留时长/ }) as HTMLInputElement
    expect(smoothing.value).toBe('5')
    expect(retention.value).toBe('20')
    fireEvent.change(smoothing, { target: { value: '12' } })
    expect(useAppStore.getState().config.formantSmoothingWindow).toBe(5)
    fireEvent.keyDown(smoothing, { key: 'Enter' })
    fireEvent.change(retention, { target: { value: '35' } })
    fireEvent.blur(retention)
    expect(useAppStore.getState().config).toMatchObject({ formantSmoothingWindow: 12, audioRetentionSeconds: 35 })
  })

  it('keeps the window choice when smoothing is disabled and enabled again', () => {
    useAppStore.getState().setConfig({ formantSmoothingWindow: 10 })
    render(<ConfigDrawer open onClose={() => {}} />)
    fireEvent.click(screen.getByRole('checkbox', { name: '启用平滑' }))
    const smoothing = screen.getByRole('spinbutton', { name: /平滑窗口/ }) as HTMLInputElement
    expect(smoothing.disabled).toBe(true)
    expect(smoothing.value).toBe('10')
    fireEvent.click(screen.getByRole('checkbox', { name: '启用平滑' }))
    expect(smoothing.disabled).toBe(false)
    expect(useAppStore.getState().config.formantSmoothingWindow).toBe(10)
  })

  it('allows typing an empty draft without committing invalid config and restores it on blur', () => {
    render(<ConfigDrawer open onClose={() => {}} />)
    const retention = screen.getByRole('spinbutton', { name: /保留时长/ }) as HTMLInputElement
    for (const value of ['', '2', '121', '20.5']) {
      fireEvent.change(retention, { target: { value } })
      expect(retention.getAttribute('aria-invalid')).toBe('true')
      expect(useAppStore.getState().config.audioRetentionSeconds).toBe(20)
      fireEvent.blur(retention)
      expect(retention.value).toBe('20')
    }
  })

  it('does not resize at an intermediate 12 while typing 120, then expands without dropping recorded samples', () => {
    recordingBuffer.clear()
    const audio = Float32Array.from({ length: 15 * 16000 }, (_, index) => index / (15 * 16000))
    recordingBuffer.write(audio)
    render(<ConfigDrawer open onClose={() => {}} />)
    const retention = screen.getByRole('spinbutton', { name: /保留时长/ }) as HTMLInputElement
    for (const value of ['', '1', '12', '120']) {
      fireEvent.change(retention, { target: { value } })
      expect(useAppStore.getState().config.audioRetentionSeconds).toBe(20)
      expect(recordingBuffer.capacity).toBe(20 * 16000)
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
    render(<ConfigDrawer open onClose={() => {}} />)
    const retention = screen.getByRole('spinbutton', { name: /保留时长/ }) as HTMLInputElement
    retention.focus()
    fireEvent.change(retention, { target: { value: '30' } })
    expect(useAppStore.getState().config.audioRetentionSeconds).toBe(20)
    fireEvent.keyDown(retention, { key: 'Escape' })
    expect(useAppStore.getState().config.audioRetentionSeconds).toBe(30)
  })
})
