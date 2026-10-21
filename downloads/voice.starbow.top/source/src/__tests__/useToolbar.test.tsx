import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useToolbar } from '../hooks/useToolbar'
import { useAppStore } from '../store/appStore'
import { useToastStore } from '../store/toastStore'
import { recordingBuffer } from '../audio/recordingBuffer'
import { encodeWav } from '../audio/wavExport'

const mocks = vi.hoisted(() => ({
  record: vi.fn(), importAudio: vi.fn(), clear: vi.fn(), play: vi.fn(), stop: vi.fn(),
  capturing: false, requesting: false, playing: false,
  createObjectURL: vi.fn((_blob: Blob) => 'blob:voice-download'), revokeObjectURL: vi.fn(),
}))
vi.mock('../hooks/useAnalysis', () => ({ useAnalysis: () => ({
  onRecord: mocks.record, onImport: mocks.importAudio, onClear: mocks.clear,
  isCapturing: mocks.capturing, isRequesting: mocks.requesting, dataSource: 'mic',
  fileInputRef: { current: null }, handleFileChange: vi.fn(),
}) }))
vi.mock('../hooks/usePlayback', () => ({ usePlayback: () => ({
  play: mocks.play, stop: mocks.stop, isPlaying: mocks.playing, cursorTime: -1,
}) }))
vi.mock('../audio/wavExport', async importOriginal => {
  const actual = await importOriginal<typeof import('../audio/wavExport')>()
  return { ...actual, encodeWav: vi.fn(actual.encodeWav) }
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  mocks.capturing = false
  mocks.requesting = false
  mocks.playing = false
  mocks.record.mockResolvedValue(undefined)
  useAppStore.getState().reset()
  useToastStore.setState({ toasts: [] })
  recordingBuffer.clear()
  vi.stubGlobal('URL', { createObjectURL: mocks.createObjectURL, revokeObjectURL: mocks.revokeObjectURL })
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})
function setup() { return renderHook(() => useToolbar(vi.fn(), vi.fn(), vi.fn())) }
function addFrames() { useAppStore.getState().setFrames([{ time: 0, f0: 200, f1: 800, f2: 1600 }]) }

describe('WAV toolbar export', () => {
  it('provides the download tool and disables it without data or during microphone permission', () => {
    const { result, rerender } = setup()
    expect(result.current.toolItems.find(tool => tool.id === 'export')).toMatchObject({ icon: '↓', label: '下载 WAV', disabled: true })
    act(() => addFrames())
    expect(result.current.toolItems.find(tool => tool.id === 'export')?.disabled).toBe(false)
    mocks.requesting = true
    rerender()
    expect(result.current.toolItems.find(tool => tool.id === 'export')?.disabled).toBe(true)
  })

  it('downloads the real buffer with a safe timestamp and releases its URL after browser startup', async () => {
    addFrames()
    recordingBuffer.write(new Float32Array([0.25, -0.5]))
    const { result } = setup()
    let filename = ''
    let href = ''
    vi.mocked(HTMLAnchorElement.prototype.click).mockImplementation(function (this: HTMLAnchorElement) {
      filename = this.download
      href = this.href
      expect(document.body.contains(this)).toBe(true)
    })
    await act(async () => result.current.handleClickTool('export'))
    expect(encodeWav).toHaveBeenCalledExactlyOnceWith(new Float32Array([0.25, -0.5]))
    expect(mocks.createObjectURL).toHaveBeenCalledTimes(1)
    const blob = mocks.createObjectURL.mock.calls[0][0] as Blob
    expect(blob.type).toBe('audio/wav')
    expect(blob.size).toBe(48)
    expect(filename).toMatch(/^voice-\d{8}-\d{6}\.wav$/)
    expect(filename).not.toContain(':')
    expect(href).toBe('blob:voice-download')
    expect(document.querySelector('a[download]')).toBeNull()
    expect(mocks.revokeObjectURL).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(60000))
    expect(mocks.revokeObjectURL).toHaveBeenCalledExactlyOnceWith('blob:voice-download')
  })

  it('waits for recording to finish and stops playback before exporting the final samples', async () => {
    mocks.capturing = true
    mocks.playing = true
    recordingBuffer.write(new Float32Array([0.25]))
    let finish!: () => void
    mocks.record.mockImplementationOnce(() => new Promise<void>(resolve => {
      finish = () => { recordingBuffer.write(new Float32Array([-0.5])); resolve() }
    }))
    const { result } = setup()
    let pending!: Promise<void>
    act(() => { pending = result.current.handleClickTool('export') })
    expect(mocks.stop).toHaveBeenCalledTimes(1)
    expect(mocks.record).toHaveBeenCalledTimes(1)
    expect(mocks.createObjectURL).not.toHaveBeenCalled()
    await act(async () => { finish(); await pending })
    expect(encodeWav).toHaveBeenCalledExactlyOnceWith(new Float32Array([0.25, -0.5]))
    expect(mocks.play).not.toHaveBeenCalled()
  })

  it('does not manufacture a download when frames exist but no raw audio is retained', async () => {
    addFrames()
    const { result } = setup()
    await act(async () => result.current.handleClickTool('export'))
    expect(mocks.createObjectURL).not.toHaveBeenCalled()
    expect(encodeWav).not.toHaveBeenCalled()
    expect(useToastStore.getState().toasts[0]?.message).toContain('还没有可下载的音频')
  })

  it('exports the newest audio after the retention setting shrinks the buffer', async () => {
    addFrames()
    const audio = Float32Array.from({ length: 7 * 16000 }, (_, index) => index / (7 * 16000))
    recordingBuffer.write(audio)
    useAppStore.getState().setConfig({ audioRetentionSeconds: 5 })
    const { result } = setup()
    await act(async () => result.current.handleClickTool('export'))
    const samples = vi.mocked(encodeWav).mock.calls[0][0]
    expect(samples).toHaveLength(5 * 16000)
    expect(samples.slice(0, 16)).toEqual(audio.slice(-5 * 16000).slice(0, 16))
    expect(samples.slice(-16)).toEqual(audio.slice(-16))
    const view = new DataView(vi.mocked(encodeWav).mock.results[0].value)
    expect(view.getUint32(40, true) / view.getUint32(28, true)).toBe(5)
  })

  it('ignores export during microphone permission even when invoked directly', async () => {
    mocks.requesting = true
    recordingBuffer.write(new Float32Array([0.25]))
    const { result } = setup()
    await act(async () => result.current.handleClickTool('export'))
    expect(mocks.createObjectURL).not.toHaveBeenCalled()
    expect(mocks.record).not.toHaveBeenCalled()
  })
})
