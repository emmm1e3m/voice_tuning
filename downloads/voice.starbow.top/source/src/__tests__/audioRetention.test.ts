import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from '../store/appStore'
import { recordingBuffer } from '../audio/recordingBuffer'
import { AUDIO_SAMPLE_RATE } from '../config/audioLimits'
import { retainedFrameCapacity } from '../config/appConfig'
import { DEFAULT_CONFIG } from '../types'

beforeEach(() => { useAppStore.getState().reset(); recordingBuffer.clear() })

describe('config persistence and audio retention', () => {
  it('persists settings and restores them with the matching buffer capacity', async () => {
    useAppStore.getState().setConfig({ formantSmoothingWindow: 12, audioRetentionSeconds: 35, formantSmoothing: false })
    const saved = localStorage.getItem('voicebuilder-presets')!
    expect(JSON.parse(saved).state.config).toMatchObject({ formantSmoothingWindow: 12, audioRetentionSeconds: 35, formantSmoothing: false })
    useAppStore.getState().reset()
    localStorage.setItem('voicebuilder-presets', saved)
    await useAppStore.persist.rehydrate()
    expect(useAppStore.getState().config).toMatchObject({ formantSmoothingWindow: 12, audioRetentionSeconds: 35, formantSmoothing: false })
    expect(recordingBuffer.capacity).toBe(35 * AUDIO_SAMPLE_RATE)
  })

  it('clamps finite out-of-range persisted numbers and restores missing or corrupt fields', async () => {
    localStorage.setItem('voicebuilder-presets', JSON.stringify({ state: { config: { formantMethod: 'broken', formantSmoothingWindow: 200, audioRetentionSeconds: -10 } }, version: 0 }))
    await useAppStore.persist.rehydrate()
    expect(useAppStore.getState().config).toEqual({ ...DEFAULT_CONFIG, formantSmoothingWindow: 30, audioRetentionSeconds: 5 })
    localStorage.setItem('voicebuilder-presets', JSON.stringify({ state: { config: { formantSmoothingWindow: 'bad', audioRetentionSeconds: null } }, version: 0 }))
    await useAppStore.persist.rehydrate()
    expect(useAppStore.getState().config).toEqual(DEFAULT_CONFIG)
  })

  it('supports legacy storage without a config section', async () => {
    localStorage.setItem('voicebuilder-presets', JSON.stringify({ state: { presetOverrides: [] }, version: 0 }))
    await useAppStore.persist.rehydrate()
    expect(useAppStore.getState().config).toEqual(DEFAULT_CONFIG)
    expect(recordingBuffer.capacity).toBe(20 * AUDIO_SAMPLE_RATE)
  })

  it('shrinks audio and frames together, then expands without inventing discarded data', () => {
    const originalBuffer = recordingBuffer
    const samples = Float32Array.from({ length: 12 * AUDIO_SAMPLE_RATE }, (_, index) => index / AUDIO_SAMPLE_RATE)
    recordingBuffer.write(samples)
    const frames = Array.from({ length: 1200 }, (_, index) => ({ time: index * 0.01, f0: 200, f1: 500, f2: 1500 }))
    useAppStore.getState().setFrames(frames)
    useAppStore.getState().setConfig({ audioRetentionSeconds: 5 })
    expect(recordingBuffer).toBe(originalBuffer)
    expect(recordingBuffer.size).toBe(5 * AUDIO_SAMPLE_RATE)
    expect(recordingBuffer.read().slice(0, 16)).toEqual(samples.slice(-5 * AUDIO_SAMPLE_RATE).slice(0, 16))
    expect(recordingBuffer.read().slice(-16)).toEqual(samples.slice(-16))
    expect(useAppStore.getState().frames).toEqual(frames.slice(-retainedFrameCapacity(5)))
    const retained = recordingBuffer.read()
    useAppStore.getState().setConfig({ audioRetentionSeconds: 40 })
    expect(recordingBuffer.size).toBe(5 * AUDIO_SAMPLE_RATE)
    expect(recordingBuffer.read()).toEqual(retained)
    expect(useAppStore.getState().frames).toHaveLength(retainedFrameCapacity(5))
  })
})
