import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AudioEngine } from '../ts/AudioEngine'
import { getAudioEngine, resetAudioEngine } from '../ts'

// Mock AudioContext for createPlaybackSource tests
const MockAudioContext = vi.fn(() => ({
  sampleRate: 16000,
  resume: vi.fn(),
  close: vi.fn(),
  createBuffer: vi.fn((_channels: number, length: number, _rate: number) => ({
    getChannelData: vi.fn(() => new Float32Array(length)),
    length,
  })),
  createBufferSource: vi.fn(() => ({
    buffer: null as AudioBuffer | null,
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  })),
  createMediaStreamSource: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
  createScriptProcessor: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    onaudioprocess: null,
  })),
  createGain: vi.fn(() => ({ gain: { value: 1 }, connect: vi.fn(), disconnect: vi.fn() })),
  destination: {},
}))

describe('AudioEngine', () => {
  let engine: AudioEngine

  beforeEach(() => {
    vi.stubGlobal('AudioContext', MockAudioContext)
    engine = new AudioEngine({ sampleRate: 16000 })
  })

  afterEach(() => {
    engine.destroy()
    vi.unstubAllGlobals()
  })

  it('initializes with default sample rate', () => {
    expect(engine.sampleRate).toBe(16000)
  })

  it('isCapturing is false initially', () => {
    expect(engine.isCapturing).toBe(false)
  })

  it('startCapture rejects if no getUserMedia (server-side test)', async () => {
    await expect(engine.startCapture(() => {})).rejects.toThrow()
  })

  it('createPlaybackSource returns source and totalDuration', () => {
    const samples = new Float32Array(16000)  // 1 second at 16kHz
    samples.fill(0.5)
    const { source, totalDuration } = engine.createPlaybackSource(samples)
    expect(source).toBeDefined()
    expect(totalDuration).toBe(1)
  })

  it('createPlaybackSource duration scales with sample count', () => {
    const samples = new Float32Array(8000)  // 0.5 seconds
    const { totalDuration } = engine.createPlaybackSource(samples)
    expect(totalDuration).toBe(0.5)
  })

  it('releases a stream granted after the permission request was cancelled', async () => {
    let grant!: (stream: MediaStream) => void
    const getUserMedia = vi.fn(() => new Promise<MediaStream>(resolve => { grant = resolve }))
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } })
    const track = { stop: vi.fn() }
    const abort = new AbortController()
    const pending = engine.startCapture(() => {}, { signal: abort.signal })
    abort.abort()
    grant({ getTracks: () => [track] } as unknown as MediaStream)
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
    expect(track.stop).toHaveBeenCalled()
    expect(engine.isCapturing).toBe(false)
  })

  it('does not connect audio nodes if cancellation happens while the context resumes', async () => {
    let resume!: () => void
    const track = { stop: vi.fn() }
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: vi.fn(async () => ({ getTracks: () => [track] })) } })
    const context = engine.audioContext
    vi.mocked(context.resume).mockImplementationOnce(() => new Promise<void>(resolve => { resume = resolve }))
    const abort = new AbortController()
    const pending = engine.startCapture(() => {}, { signal: abort.signal })
    await Promise.resolve()
    abort.abort()
    resume()
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
    expect(context.createMediaStreamSource).not.toHaveBeenCalled()
    expect(track.stop).toHaveBeenCalled()
  })

  it('stops capture and notifies its owner when the microphone track ends', async () => {
    const track = Object.assign(new EventTarget(), { stop: vi.fn() })
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: vi.fn(async () => ({ getTracks: () => [track] })) } })
    const interrupted = vi.fn()
    await engine.startCapture(() => {}, { onInterrupted: interrupted })
    expect(engine.isCapturing).toBe(true)
    track.dispatchEvent(new Event('ended'))
    expect(engine.isCapturing).toBe(false)
    expect(interrupted).toHaveBeenCalledOnce()
  })
})

describe('AudioEngine singleton', () => {
  afterEach(() => {
    resetAudioEngine()
  })

  it('getAudioEngine returns the same instance', () => {
    const a = getAudioEngine()
    const b = getAudioEngine()
    expect(a).toBe(b)
  })

  it('resetAudioEngine destroys and nullifies instance', () => {
    const a = getAudioEngine()
    resetAudioEngine()
    const b = getAudioEngine()
    expect(a).not.toBe(b)
  })
})
