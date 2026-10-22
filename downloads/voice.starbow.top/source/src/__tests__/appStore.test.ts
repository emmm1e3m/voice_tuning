import { describe, it, expect, beforeEach } from 'vitest'
import { PRESET_MIGRATION_BACKUP_KEY, useAppStore } from '../store/appStore'
import { VOWEL_PRESETS } from '../types'
import { AUDIO_WINDOW_FRAMES } from '../config/audioLimits'

function resetStore() {
  useAppStore.getState().reset()
}

function makeFrame(overrides: Record<string, number | boolean | null> = {}) {
  return {
    time: overrides.time as number ?? 0,
    f0: overrides.f0 as number | null ?? null,
    f1: overrides.f1 as number | null ?? null,
    f2: overrides.f2 as number | null ?? null,
    f3: (overrides.f3 as number | null) ?? null,
    f4: (overrides.f4 as number | null) ?? null,
    voiced: (overrides.voiced as boolean) ?? true,
  }
}

describe('appStore', () => {
  beforeEach(() => resetStore())

  describe('config', () => {
    it('has default config', () => {
      const { config } = useAppStore.getState()
      expect(config.formantMethod).toBe('hybrid')
      expect(config.formantSmoothing).toBe(true)
      expect(config.formantSmoothingWindow).toBe(5)
    })

    it('merges partial config', () => {
      useAppStore.getState().setConfig({ formantSmoothing: false })
      const { config } = useAppStore.getState()
      expect(config.formantSmoothing).toBe(false)
      expect(config.formantMethod).toBe('hybrid')
    })
  })

  describe('bands', () => {
    it('backs up the original stored targets before normalizing an old override', () => {
      const backupKey = PRESET_MIGRATION_BACKUP_KEY
      localStorage.removeItem(backupKey)
      const raw = JSON.stringify({ state: { presetOverrides: [{ key: 'vowel-a', f0: [600, 900], f1: [800, 1200], f2: [900, 1000] }] }, version: 0 })
      localStorage.setItem('voicebuilder-presets', raw)
      useAppStore.persist.rehydrate()
      expect(localStorage.getItem(backupKey)).toBe(raw)
      expect(useAppStore.getState().bands.f0.range).toEqual([420, 500])
      expect(useAppStore.getState().bands.f2.range).toEqual([950, 1250])
      localStorage.setItem('voicebuilder-presets', raw.replace('900', '950'))
      useAppStore.persist.rehydrate()
      expect(localStorage.getItem(backupKey)).toBe(raw)
      useAppStore.getState().reset()
      expect(localStorage.getItem(backupKey)).toBe(raw)
      localStorage.removeItem(backupKey)
    })

    it('defaults to vowel-a bands', () => {
      const vowelA = VOWEL_PRESETS['vowel-a']
      const { bands } = useAppStore.getState()
      expect(bands.f0.range).toEqual(vowelA.f0)
      expect(bands.f1.range).toEqual([815, 1015])
    })

    it('merges partial bands', () => {
      useAppStore.getState().setBands({ f1: [500, 700] })
      expect(useAppStore.getState().bands.f1.range).toEqual([500, 700])
    })

    it('rejects invalid range', () => {
      const original = useAppStore.getState().bands.f1.range
      useAppStore.getState().setBands({ f1: [800, 500] })
      expect(useAppStore.getState().bands.f1.range).toEqual(original)
    })

    it('moves only the selected center and keeps its fixed width at an ordering boundary', () => {
      const f2 = useAppStore.getState().bands.f2
      useAppStore.getState().setBandCenter('f1', 3400)
      expect(useAppStore.getState().bands.f1.range).toEqual([1100, 1300])
      expect(useAppStore.getState().bands.f2).toBe(f2)
      const f1 = useAppStore.getState().bands.f1
      useAppStore.getState().setBandCenter('f2', 0)
      expect(useAppStore.getState().bands.f2.range).toEqual([1300, 1600])
      expect(useAppStore.getState().bands.f1).toBe(f1)
    })

    it('preserves legacy formant centers while keeping the active F0 across vowels', () => {
      localStorage.setItem('voicebuilder-presets', JSON.stringify({ state: { presetOverrides: [
        { key: 'vowel-i', f0: [220, 300], f1: [280, 380], f2: [2500, 3000] },
      ] }, version: 0 }))
      useAppStore.persist.rehydrate()
      useAppStore.getState().switchPreset('vowel-i')
      expect(useAppStore.getState().bands.f0.range).toEqual([200, 280])
      expect(useAppStore.getState().bands.f1.range).toEqual([230, 430])
      expect(useAppStore.getState().bands.f2.range).toEqual([2600, 2900])
    })

    it('falls back safely for malformed override fields and ignores unknown presets', () => {
      localStorage.setItem('voicebuilder-presets', JSON.stringify({ state: { presetOverrides: [
        null, { key: '__proto__' }, { key: 'vowel-a', f0: 'bad', f1: [null, 4], f2: [0, 9999] },
      ] }, version: 0 }))
      useAppStore.persist.rehydrate()
      expect(useAppStore.getState().presetOverrides).toHaveLength(1)
      expect(useAppStore.getState().bands.f0.range).toEqual([200, 280])
      expect(useAppStore.getState().bands.f1.range).toEqual([800, 1000])
      expect(useAppStore.getState().bands.f2.range).toEqual([3200, 3500])
      useAppStore.getState().switchPreset('__proto__')
      expect(useAppStore.getState().activePreset).toBe('vowel-a')
    })
  })

  describe('frames', () => {
    it('starts empty', () => {
      expect(useAppStore.getState().frames).toEqual([])
      expect(useAppStore.getState().latestFrame).toBeNull()
    })

    it('appendFrame adds frames', () => {
      useAppStore.getState().appendFrame(makeFrame({ time: 0.01, f0: 220 }))
      useAppStore.getState().appendFrame(makeFrame({ time: 0.02, f0: 225 }))
      expect(useAppStore.getState().frames).toHaveLength(2)
      expect(useAppStore.getState().latestFrame?.time).toBe(0.02)
    })

    it('enforces the shared retained frame window', () => {
      for (let i = 0; i < AUDIO_WINDOW_FRAMES + 50; i++) {
        useAppStore.getState().appendFrame(makeFrame({ time: i * 0.01, f0: 220 }))
      }
      expect(useAppStore.getState().frames.length).toBe(AUDIO_WINDOW_FRAMES)
      expect(useAppStore.getState().frames[0].time).toBe(0.5)
    })

    it('setFrames batch replaces', () => {
      const frames = [
        makeFrame({ time: 0.01, f0: 220 }),
        makeFrame({ time: 0.02, f0: 225 }),
      ]
      useAppStore.getState().setFrames(frames)
      expect(useAppStore.getState().frames).toHaveLength(2)
    })

    it('caps batch frames to the same duration as live capture', () => {
      const frames = Array.from({ length: AUDIO_WINDOW_FRAMES + 5 }, (_, index) => makeFrame({ time: index * 0.01 }))
      useAppStore.getState().setFrames(frames)
      expect(useAppStore.getState().frames).toEqual(frames.slice(5))
      expect(useAppStore.getState().latestFrame).toBe(frames[frames.length - 1])
    })

    it('setLatestFrame updates latestFrame without touching frames', () => {
      const f1 = makeFrame({ time: 0.01, f0: 220 })
      const f2 = makeFrame({ time: 0.02, f0: 225 })
      useAppStore.getState().appendFrame(f1)
      useAppStore.getState().appendFrame(f2)
      useAppStore.getState().setLatestFrame(f1)
      expect(useAppStore.getState().latestFrame).toBe(f1)
      expect(useAppStore.getState().frames).toEqual([f1, f2])
    })
  })

  describe('clearFrames', () => {
    it('clears only frames, preserves config and bands', () => {
      useAppStore.getState().setConfig({ formantMethod: 'cepstral' })
      useAppStore.getState().setBands({ f0: [100, 200] })
      useAppStore.getState().appendFrame(makeFrame({ time: 0.01, f0: 220 }))
      useAppStore.getState().clearFrames()

      expect(useAppStore.getState().frames).toEqual([])
      expect(useAppStore.getState().latestFrame).toBeNull()
      // 配置与目标中心保持不变。
      expect(useAppStore.getState().config.formantMethod).toBe('cepstral')
      expect(useAppStore.getState().bands.f0.range).toEqual([110, 190])
    })
  })

  describe('reset', () => {
    it('restores initial state', () => {
      useAppStore.getState().setConfig({ formantMethod: 'cepstral' })
      useAppStore.getState().appendFrame(makeFrame({ time: 0.01, f0: 220 }))
      useAppStore.getState().reset()

      const state = useAppStore.getState()
      expect(state.config.formantMethod).toBe('hybrid')
      expect(state.frames).toEqual([])
      expect(state.latestFrame).toBeNull()
    })
  })

  describe('formantVisible', () => {
    it('defaults to all visible', () => {
      const { formantVisible } = useAppStore.getState()
      expect(formantVisible).toEqual({ f0: true, f1: true, f2: true })
    })

    it('toggleFormantVisible flips a single key', () => {
      useAppStore.getState().toggleFormantVisible('f1')
      const { formantVisible } = useAppStore.getState()
      expect(formantVisible.f0).toBe(true)
      expect(formantVisible.f1).toBe(false)
      expect(formantVisible.f2).toBe(true)
    })

    it('toggleFormantVisible flips back', () => {
      useAppStore.getState().toggleFormantVisible('f0')
      useAppStore.getState().toggleFormantVisible('f0')
      expect(useAppStore.getState().formantVisible.f0).toBe(true)
    })
  })

  describe('clearFrames preserves formantVisible', () => {
    it('keeps hidden state across clear', () => {
      useAppStore.getState().toggleFormantVisible('f1')
      useAppStore.getState().appendFrame(makeFrame({ time: 0.01, f0: 220 }))
      useAppStore.getState().clearFrames()
      expect(useAppStore.getState().formantVisible.f1).toBe(false)
      expect(useAppStore.getState().frames).toEqual([])
    })
  })

  describe('reset restores formantVisible', () => {
    it('restores all visible', () => {
      useAppStore.getState().toggleFormantVisible('f2')
      useAppStore.getState().reset()
      expect(useAppStore.getState().formantVisible).toEqual({ f0: true, f1: true, f2: true })
    })
  })
})
