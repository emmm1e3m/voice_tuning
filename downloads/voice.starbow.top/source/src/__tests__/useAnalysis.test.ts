/// <reference types="node" />
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAnalysis } from '../hooks/useAnalysis'
import { useAppStore } from '../store/appStore'
import { useToastStore } from '../store/toastStore'
import { recordingBuffer } from '../audio/recordingBuffer'
import { AUDIO_WINDOW_SECONDS, AUDIO_WINDOW_SAMPLES } from '../config/audioLimits'
import { useRegisterCalibrationStore } from '../store/registerCalibrationStore'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

if (typeof Blob.prototype.arrayBuffer !== 'function') {
  Blob.prototype.arrayBuffer = function () {
    return new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.onerror = () => reject(reader.error)
      reader.readAsArrayBuffer(this)
    })
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ASSETS = path.resolve(__dirname, '../../assets')

function loadAsset(name: string): Buffer {
  return readFileSync(path.join(ASSETS, name))
}

const mocks = vi.hoisted(() => ({
  isWavFile: vi.fn(),
  parseWav: vi.fn(),
  analyze: vi.fn(),
  probeAudioDuration: vi.fn(),
  probeWavDuration: vi.fn(),
  decodeAudioFile: vi.fn(),
  startCapture: vi.fn(),
  stopCapture: vi.fn(),
  pipelineOptions: vi.fn(),
  setRegisterOptions: vi.fn(),
}))

vi.mock('../dsp', () => ({
  isWavFile: mocks.isWavFile,
  parseWav: mocks.parseWav,
  Resampler: class { process(x: Float32Array) { return x } },
  AnalysisPipeline: class {
    frameCount = 0
    constructor(options: unknown) { mocks.pipelineOptions(options) }
    pushChunk() {}
    flush() {}
    reset() {}
    setRegisterOptions(options: unknown) { mocks.setRegisterOptions(options) }
    static analyze(...a: unknown[]) { return mocks.analyze(...a) }
  },
}))

vi.mock('../audio/audioDecoder', () => ({
  AudioTooLongError: class AudioTooLongError extends Error {},
  probeAudioDuration: mocks.probeAudioDuration,
  probeWavDuration: mocks.probeWavDuration,
  decodeAudioFile: mocks.decodeAudioFile,
}))

vi.mock('../ts', () => ({
  getAudioEngine: () => ({
    startCapture: mocks.startCapture,
    stopCapture: mocks.stopCapture,
  }),
  resetAudioEngine: () => {},
}))

function wavFile() {
  return {
    slice: vi.fn(() => ({ arrayBuffer: async () => new ArrayBuffer(12) })),
    arrayBuffer: async () => new ArrayBuffer(1024),
  }
}

function nonWavFile() {
  return {
    slice: vi.fn(() => ({ arrayBuffer: async () => new ArrayBuffer(12) })),
    arrayBuffer: async () => new ArrayBuffer(1024),
  }
}

function toastMessages() {
  return useToastStore.getState().toasts.map((t) => t.message)
}

beforeEach(() => {
  useAppStore.getState().reset()
  useRegisterCalibrationStore.getState().clearCalibration()
  useToastStore.setState({ toasts: [] })
  recordingBuffer.clear()
  vi.clearAllMocks()
})

describe('handleFileChange', () => {
  it('routes WAV files through parseWav', async () => {
    mocks.isWavFile.mockReturnValue(true)
    mocks.probeWavDuration.mockResolvedValue(3)
    mocks.parseWav.mockReturnValue({ samples: new Float32Array([0.1, 0.2]), sampleRate: 16000, numChannels: 1 })
    mocks.analyze.mockReturnValue([{ time: 0, f0: 220 }])

    const { result } = renderHook(() => useAnalysis())
    await act(async () => {
      await result.current.handleFileChange({ target: { files: [wavFile()] } } as never)
    })

    expect(mocks.probeWavDuration).toHaveBeenCalled()
    expect(mocks.parseWav).toHaveBeenCalled()
    expect(mocks.probeAudioDuration).not.toHaveBeenCalled()
    expect(mocks.analyze).toHaveBeenCalled()
    expect(useAppStore.getState().frames).toHaveLength(1)
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('shows a stereo notice when numChannels > 1', async () => {
    mocks.isWavFile.mockReturnValue(true)
    mocks.probeWavDuration.mockResolvedValue(3)
    mocks.parseWav.mockReturnValue({ samples: new Float32Array([0.1]), sampleRate: 16000, numChannels: 2 })
    mocks.analyze.mockReturnValue([])

    const { result } = renderHook(() => useAnalysis())
    await act(async () => {
      await result.current.handleFileChange({ target: { files: [wavFile()] } } as never)
    })

    expect(toastMessages()).toContain('该音频为双声道，仅使用第 0 声道进行分析')
  })

  it('rejects >20s WAV before reading the full file or parsing', async () => {
    mocks.isWavFile.mockReturnValue(true)
    mocks.probeWavDuration.mockResolvedValue(AUDIO_WINDOW_SECONDS + 5)

    const { result } = renderHook(() => useAnalysis())
    await act(async () => {
      await result.current.handleFileChange({ target: { files: [wavFile()] } } as never)
    })

    expect(mocks.probeWavDuration).toHaveBeenCalled()
    expect(mocks.parseWav).not.toHaveBeenCalled()
    expect(mocks.decodeAudioFile).not.toHaveBeenCalled()
    expect(useAppStore.getState().frames).toHaveLength(0)
    expect(toastMessages()).toContain(`音频不能超过 ${AUDIO_WINDOW_SECONDS} 秒，请裁剪后重试。`)
  })

  it('falls back to full parse when the WAV header probe is unresolvable', async () => {
    mocks.isWavFile.mockReturnValue(true)
    mocks.probeWavDuration.mockResolvedValue(null)
    mocks.parseWav.mockReturnValue({ samples: new Float32Array([0.1, 0.2]), sampleRate: 16000, numChannels: 1 })
    mocks.analyze.mockReturnValue([{ time: 0, f0: 220 }])

    const { result } = renderHook(() => useAnalysis())
    await act(async () => {
      await result.current.handleFileChange({ target: { files: [wavFile()] } } as never)
    })

    expect(mocks.parseWav).toHaveBeenCalled()
    expect(useAppStore.getState().frames).toHaveLength(1)
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('routes non-WAV files through probeAudioDuration then decodeAudioFile', async () => {
    mocks.isWavFile.mockReturnValue(false)
    mocks.probeAudioDuration.mockResolvedValue(5)
    mocks.decodeAudioFile.mockResolvedValue({ samples: new Float32Array([0.1, 0.2]), sampleRate: 16000, numChannels: 1 })
    mocks.analyze.mockReturnValue([])

    const { result } = renderHook(() => useAnalysis())
    await act(async () => {
      await result.current.handleFileChange({ target: { files: [nonWavFile()] } } as never)
    })

    expect(mocks.probeAudioDuration).toHaveBeenCalled()
    expect(mocks.decodeAudioFile).toHaveBeenCalled()
    expect(mocks.analyze).toHaveBeenCalled()
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('rejects >20s audio before decoding or analyzing', async () => {
    mocks.isWavFile.mockReturnValue(false)
    mocks.probeAudioDuration.mockResolvedValue(AUDIO_WINDOW_SECONDS + 5)

    const { result } = renderHook(() => useAnalysis())
    await act(async () => {
      await result.current.handleFileChange({ target: { files: [nonWavFile()] } } as never)
    })

    expect(mocks.decodeAudioFile).not.toHaveBeenCalled()
    expect(mocks.analyze).not.toHaveBeenCalled()
    expect(useAppStore.getState().frames).toHaveLength(0)
    expect(toastMessages()).toContain(`音频不能超过 ${AUDIO_WINDOW_SECONDS} 秒，请裁剪后重试。`)
  })

  it('shows browser-unsupported toast when decodeAudioData fails', async () => {
    mocks.isWavFile.mockReturnValue(false)
    mocks.probeAudioDuration.mockResolvedValue(5)
    mocks.decodeAudioFile.mockRejectedValue(new DOMException('Failed to decode audio data', 'EncodingError'))

    const { result } = renderHook(() => useAnalysis())
    await act(async () => {
      await result.current.handleFileChange({ target: { files: [nonWavFile()] } } as never)
    })

    expect(toastMessages()).toContain('浏览器不支持该音频格式或文件已损坏，请尝试 wav/mp3/m4a。')
  })
})

describe('real mp3/m4a file routing', () => {
  const SAMPLES = new Float32Array([0.1, 0.2, 0.3])

  beforeEach(() => {
    useAppStore.getState().reset()
    useToastStore.setState({ toasts: [] })
    recordingBuffer.clear()
    vi.resetAllMocks()
  })

  it('mp3 file goes through probeAudioDuration then decodeAudioFile', async () => {
    mocks.probeAudioDuration.mockResolvedValue(3)
    mocks.decodeAudioFile.mockResolvedValue({ samples: SAMPLES, sampleRate: 16000, numChannels: 1 })
    mocks.analyze.mockReturnValue([{ time: 0, f0: 220 }])

    const mp3Buf = new Uint8Array(loadAsset('a.mp3'))
    const file = new File([mp3Buf], 'a.mp3', { type: 'audio/mpeg' })

    const { result } = renderHook(() => useAnalysis())
    await act(async () => {
      await result.current.handleFileChange({ target: { files: [file] } } as never)
    })

    expect(mocks.parseWav).not.toHaveBeenCalled()
    expect(mocks.probeAudioDuration).toHaveBeenCalled()
    expect(mocks.decodeAudioFile).toHaveBeenCalled()
    expect(mocks.analyze).toHaveBeenCalled()
    expect(useAppStore.getState().frames).toHaveLength(1)
  })

  it('m4a file goes through probeAudioDuration then decodeAudioFile', async () => {
    mocks.probeAudioDuration.mockResolvedValue(3)
    mocks.decodeAudioFile.mockResolvedValue({ samples: SAMPLES, sampleRate: 16000, numChannels: 1 })
    mocks.analyze.mockReturnValue([{ time: 0, f0: 220 }])

    const m4aBuf = new Uint8Array(loadAsset('a.m4a'))
    const file = new File([m4aBuf], 'a.m4a', { type: 'audio/mp4' })

    const { result } = renderHook(() => useAnalysis())
    await act(async () => {
      await result.current.handleFileChange({ target: { files: [file] } } as never)
    })

    expect(mocks.parseWav).not.toHaveBeenCalled()
    expect(mocks.probeAudioDuration).toHaveBeenCalled()
    expect(mocks.decodeAudioFile).toHaveBeenCalled()
    expect(mocks.analyze).toHaveBeenCalled()
    expect(useAppStore.getState().frames).toHaveLength(1)
  })

  it('mp3 >20s is rejected before decoding', async () => {
    mocks.probeAudioDuration.mockResolvedValue(AUDIO_WINDOW_SECONDS + 5)

    const mp3Buf = new Uint8Array(loadAsset('a.mp3'))
    const file = new File([mp3Buf], 'a.mp3', { type: 'audio/mpeg' })

    const { result } = renderHook(() => useAnalysis())
    await act(async () => {
      await result.current.handleFileChange({ target: { files: [file] } } as never)
    })

    expect(mocks.decodeAudioFile).not.toHaveBeenCalled()
    expect(mocks.analyze).not.toHaveBeenCalled()
    expect(toastMessages()).toContain(`音频不能超过 ${AUDIO_WINDOW_SECONDS} 秒，请裁剪后重试。`)
  })

  it('mp3 decode failure shows browser-unsupported toast', async () => {
    mocks.probeAudioDuration.mockResolvedValue(3)
    mocks.decodeAudioFile.mockRejectedValue(new DOMException('Failed to decode audio data', 'EncodingError'))

    const mp3Buf = new Uint8Array(loadAsset('a.mp3'))
    const file = new File([mp3Buf], 'a.mp3', { type: 'audio/mpeg' })

    const { result } = renderHook(() => useAnalysis())
    await act(async () => {
      await result.current.handleFileChange({ target: { files: [file] } } as never)
    })

    expect(toastMessages()).toContain('浏览器不支持该音频格式或文件已损坏，请尝试 wav/mp3/m4a。')
  })
})

describe('onRecord mic failure toasts', () => {
  it('shows upgrade guidance on the Firefox cross-rate sample rate error', async () => {
    mocks.startCapture.mockRejectedValue(new DOMException(
      'Connecting AudioNodes from AudioContexts with different sample-rate is currently not supported.',
      'NotSupportedError',
    ))

    const { result } = renderHook(() => useAnalysis())
    await act(async () => {
      await result.current.onRecord()
    })

    expect(result.current.isRequesting).toBe(false)
    expect(toastMessages()).toContain('当前 Firefox 无法以所需采样率连接麦克风，请升级 Firefox（≥148）或改用 Chrome/Edge。')
    expect(toastMessages()).not.toContain('无法启动录音,请检查麦克风权限。')
  })

  it('keeps the generic permission toast for other capture errors', async () => {
    mocks.startCapture.mockRejectedValue(new DOMException('Permission denied', 'NotAllowedError'))

    const { result } = renderHook(() => useAnalysis())
    await act(async () => {
      await result.current.onRecord()
    })

    expect(toastMessages()).toContain('无法启动录音,请检查麦克风权限。')
  })
})

describe('retained duration and smoothing options', () => {
  it('将个人校准应用到当前实时管线、已显示帧和后续导入', async () => {
    mocks.startCapture.mockResolvedValue(undefined)
    const { result } = renderHook(() => useAnalysis())
    await act(async () => result.current.onRecord())
    const magnitudes = new Float32Array(1025).fill(-90)
    for (let harmonic = 1; harmonic <= 5; harmonic++) magnitudes[32 * harmonic] = harmonic === 1 ? 0 : -10
    act(() => useAppStore.getState().appendFrame({ time: 1, f0: 250, f1: null, f2: null, voiced: true, magnitudes, register: 'mixed' }))
    const samples = Array.from({ length: 120 }, (_, index) => ({ time: index * .01, f0: 250, harmonicCount: 3 }))
    act(() => { useRegisterCalibrationStore.getState().saveSamples(samples) })
    const options = { chestCount: 3.75, falsettoCount: 2.25 }
    expect(mocks.setRegisterOptions).toHaveBeenCalledWith(options)
    expect(useAppStore.getState().latestFrame?.register).toBe('chest')
    mocks.isWavFile.mockReturnValue(true)
    mocks.probeWavDuration.mockResolvedValue(1)
    const audio = new Float32Array(16000)
    mocks.parseWav.mockReturnValue({ samples: audio, sampleRate: 16000, numChannels: 1 })
    mocks.analyze.mockReturnValue([])
    await act(async () => result.current.handleFileChange({ target: { files: [wavFile()] } } as never))
    expect(mocks.analyze).toHaveBeenCalledWith(audio, 16000, 'hybrid', true, 5, options)
  })

  it.each([AUDIO_WINDOW_SECONDS - 5, AUDIO_WINDOW_SECONDS])('accepts a %s-second import and passes the selected smoothing window', async duration => {
    mocks.isWavFile.mockReturnValue(true)
    mocks.probeWavDuration.mockResolvedValue(duration)
    const samples = new Float32Array(duration * 16000)
    mocks.parseWav.mockReturnValue({ samples, sampleRate: 16000, numChannels: 1 })
    mocks.analyze.mockReturnValue([])
    useAppStore.getState().setConfig({ formantSmoothingWindow: 10 })
    const { result } = renderHook(() => useAnalysis())
    await act(async () => result.current.handleFileChange({ target: { files: [wavFile()] } } as never))
    expect(mocks.analyze).toHaveBeenCalledWith(samples, 16000, 'hybrid', true, 10, undefined)
    expect(recordingBuffer.read().length).toBe(samples.length)
    expect(toastMessages()).toEqual([])
  })

  it('rejects one excess real sample when a duration header is unavailable', async () => {
    mocks.isWavFile.mockReturnValue(true)
    mocks.probeWavDuration.mockResolvedValue(null)
    mocks.parseWav.mockReturnValue({ samples: new Float32Array(AUDIO_WINDOW_SAMPLES + 1), sampleRate: 16000, numChannels: 1 })
    const { result } = renderHook(() => useAnalysis())
    await act(async () => result.current.handleFileChange({ target: { files: [wavFile()] } } as never))
    expect(mocks.analyze).not.toHaveBeenCalled()
    expect(recordingBuffer.read()).toHaveLength(0)
    expect(toastMessages()).toContain(`音频不能超过 ${AUDIO_WINDOW_SECONDS} 秒，请裁剪后重试。`)
  })

  it('snapshots the selected window for a live run and applies changes on the next recording', async () => {
    mocks.startCapture.mockResolvedValue(undefined)
    useAppStore.getState().setConfig({ formantSmoothingWindow: 10 })
    const { result } = renderHook(() => useAnalysis())
    await act(async () => result.current.onRecord())
    expect(mocks.pipelineOptions).toHaveBeenLastCalledWith(expect.objectContaining({ formantSmoothingWindow: 10 }))
    act(() => useAppStore.getState().setConfig({ formantSmoothingWindow: 5 }))
    expect(mocks.pipelineOptions).toHaveBeenCalledTimes(1)
    await act(async () => result.current.onRecord())
    await act(async () => result.current.onRecord())
    expect(mocks.pipelineOptions).toHaveBeenLastCalledWith(expect.objectContaining({ formantSmoothingWindow: 5 }))
  })
})

describe('dynamic retention during import and recording', () => {
  it('uses the current setting for an import, including changes while duration is being read', async () => {
    useAppStore.getState().setConfig({ audioRetentionSeconds: 5 })
    mocks.isWavFile.mockReturnValue(true)
    let release!: (duration: number) => void
    mocks.probeWavDuration.mockReturnValueOnce(new Promise<number>(resolve => { release = resolve }))
    const samples = new Float32Array(15 * 16000)
    mocks.parseWav.mockReturnValue({ samples, sampleRate: 16000, numChannels: 1 })
    mocks.analyze.mockReturnValue([])
    const { result } = renderHook(() => useAnalysis())
    let pending!: Promise<void>
    await act(async () => { pending = result.current.handleFileChange({ target: { files: [wavFile()] } } as never) })
    act(() => useAppStore.getState().setConfig({ audioRetentionSeconds: 30 }))
    await act(async () => { release(15); await pending })
    expect(mocks.analyze).toHaveBeenCalled()
    expect(recordingBuffer.size).toBe(samples.length)
    expect(toastMessages()).toEqual([])
  })

  it('rejects a file above the current retention limit before parsing', async () => {
    useAppStore.getState().setConfig({ audioRetentionSeconds: 5 })
    mocks.isWavFile.mockReturnValue(true)
    mocks.probeWavDuration.mockResolvedValue(6)
    const { result } = renderHook(() => useAnalysis())
    await act(async () => result.current.handleFileChange({ target: { files: [wavFile()] } } as never))
    expect(mocks.parseWav).not.toHaveBeenCalled()
    expect(toastMessages()).toContain('音频不能超过 5 秒，请裁剪后重试。')
  })

  it('continues a recording after shrinking capacity and keeps its newest real tail', async () => {
    mocks.startCapture.mockResolvedValue(undefined)
    const { result } = renderHook(() => useAnalysis())
    await act(async () => result.current.onRecord())
    const capture = mocks.startCapture.mock.calls[0][0] as (samples: Float32Array, rate: number) => void
    const first = Float32Array.from({ length: 12 * 16000 }, (_, index) => index / (12 * 16000))
    act(() => capture(first, 16000))
    act(() => useAppStore.getState().setConfig({ audioRetentionSeconds: 5 }))
    expect(result.current.isCapturing).toBe(true)
    const tail = new Float32Array([0.11, 0.22, 0.33, 0.44])
    act(() => capture(tail, 16000))
    const retained = recordingBuffer.read()
    expect(retained).toHaveLength(5 * 16000)
    expect(retained.slice(-4)).toEqual(tail)
    expect(retained.slice(0, 16)).toEqual(first.slice(-(5 * 16000 - 4)).slice(0, 16))
    expect(mocks.pipelineOptions).toHaveBeenCalledTimes(1)
  })
})
