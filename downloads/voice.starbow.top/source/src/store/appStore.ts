import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AppConfig, TargetBands, AnalysisFrame, AnalysisStats, FormantSeries, FormantVisibility, PresetOverride } from '../types'
import { DEFAULT_CONFIG, VOWEL_PRESETS } from '../types'
import { getBandCenter, normalizeTargetBands, recommendVowelTargets, updateTargetCenter, type TargetBandKey } from '../config/targetBandRules'
import { AUDIO_SAMPLE_RATE } from '../config/audioLimits'
import { normalizeAppConfig, retainedFrameCapacity } from '../config/appConfig'
import { recordingBuffer } from '../audio/recordingBuffer'
export const PRESET_MIGRATION_BACKUP_KEY = 'voicebuilder-presets-before-center-targets-v2'

interface AppState {
  config: AppConfig
  bands: TargetBands
  activePreset: string
  presetOverrides: PresetOverride[]
  targetMode: 'vowel' | 'manual'
  frames: AnalysisFrame[]
  latestFrame: AnalysisFrame | null
  stats: AnalysisStats
  formantVisible: FormantVisibility
}

interface AppActions {
  setConfig: (config: Partial<AppConfig>) => void
  setBands: (bands: Partial<Record<'f0' | 'f1' | 'f2', [number, number]>>) => void
  setBandCenter: (key: TargetBandKey, center: number) => void
  setTargetMode: (mode: 'vowel' | 'manual') => void
  setActivePreset: (name: string) => void
  switchPreset: (name: string) => void
  savePresetOverride: (key: string, f0: [number, number], f1: [number, number], f2: [number, number]) => void
  resetPresets: () => void
  appendFrame: (frame: AnalysisFrame) => void
  setFrames: (frames: AnalysisFrame[]) => void
  setLatestFrame: (frame: AnalysisFrame | null) => void
  clearFrames: () => void
  toggleFormantVisible: (key: FormantSeries) => void
  reset: () => void
}

type AppStore = AppState & AppActions

const vowelA = VOWEL_PRESETS['vowel-a']
const DEFAULT_BANDS: TargetBands = {
  f0: { range: vowelA.f0, color: '#8b67c5' },
  f1: { range: vowelA.f1, color: '#d76e97' },
  f2: { range: vowelA.f2, color: '#5c92c7' },
}

function resolveBands(name: string, overrides: PresetOverride[]): TargetBands {
  const preset = VOWEL_PRESETS[name]
  if (!preset) return DEFAULT_BANDS
  const o = overrides.find(x => x.key === name)
  const rangeOrDefault = (range: unknown, fallback: [number, number]): [number, number] =>
    Array.isArray(range) && range.length === 2 && range.every(value => typeof value === 'number' && Number.isFinite(value))
      ? range as [number, number] : fallback
  return normalizeTargetBands({
    f0: { range: rangeOrDefault(o?.f0, preset.f0), color: DEFAULT_BANDS.f0.color },
    f1: { range: rangeOrDefault(o?.f1, preset.f1), color: DEFAULT_BANDS.f1.color },
    f2: { range: rangeOrDefault(o?.f2, preset.f2), color: DEFAULT_BANDS.f2.color },
  })
}

function normalizeOverrides(value: unknown): PresetOverride[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is PresetOverride =>
    item != null && typeof item.key === 'string' && Object.prototype.hasOwnProperty.call(VOWEL_PRESETS, item.key),
  ).map(override => {
    const bands = resolveBands(override.key, [override])
    return { key: override.key, f0: bands.f0.range, f1: bands.f1.range, f2: bands.f2.range }
  })
}

function preserveMigrationBackup(original: unknown, normalized: PresetOverride[]) {
  if (JSON.stringify(original) === JSON.stringify(normalized)) return
  try {
    const raw = localStorage.getItem('voicebuilder-presets')
    if (raw && localStorage.getItem(PRESET_MIGRATION_BACKUP_KEY) === null) {
      localStorage.setItem(PRESET_MIGRATION_BACKUP_KEY, raw)
    }
  } catch {
    // 存储配额或隐私限制不能阻止练习器加载。
  }
}

function loadStoredOverrides(): PresetOverride[] {
  try {
    const raw = localStorage.getItem('voicebuilder-presets')
    if (!raw) return []
    const data = JSON.parse(raw)
    const original = data?.state?.presetOverrides
    const normalized = normalizeOverrides(original)
    preserveMigrationBackup(original, normalized)
    return normalized
  } catch {
    preserveMigrationBackup(null, [])
    return []
  }
}

const storedOverrides = loadStoredOverrides()

const initialState: AppState = {
  config: DEFAULT_CONFIG,
  bands: resolveBands('vowel-a', storedOverrides),
  activePreset: 'vowel-a',
  presetOverrides: storedOverrides,
  targetMode: storedOverrides.length ? 'manual' : 'vowel',
  frames: [],
  latestFrame: null,
  stats: { f0Mean: null, hitRate: null, duration: 0 },
  formantVisible: { f0: true, f1: true, f2: true },
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      ...initialState,

      setConfig: (partial) => set((state) => {
        const config = normalizeAppConfig({ ...state.config, ...partial }, state.config)
        recordingBuffer.resize(config.audioRetentionSeconds * AUDIO_SAMPLE_RATE)
        return { config, frames: state.frames.slice(-retainedFrameCapacity(config.audioRetentionSeconds)) }
      }),

      setBands: (bands) => set((state) => {
        let next = state.bands
        for (const k of ['f0', 'f1', 'f2'] as const) {
          const r = bands[k]
          if (r && r.length === 2 && r.every(Number.isFinite) && r[0] < r[1]) {
            next = updateTargetCenter(next, k, getBandCenter(r))
          }
        }
        return { bands: next }
      }),

      setBandCenter: (key, center) => set(state => {
        if (!Number.isFinite(center)) return {}
        const bands = updateTargetCenter(state.bands, key, center)
        return {
          bands: key === 'f0' && state.targetMode === 'vowel' ? recommendVowelTargets(bands, state.activePreset) : bands,
          targetMode: key === 'f0' ? state.targetMode : 'manual',
        }
      }),

      setTargetMode: (targetMode) => set(state => ({ targetMode, bands: targetMode === 'vowel' ? recommendVowelTargets(state.bands, state.activePreset) : state.bands })),

      setActivePreset: (name) => set({ activePreset: name }),

      switchPreset: (name) => set((state) => Object.prototype.hasOwnProperty.call(VOWEL_PRESETS, name)
        ? { activePreset: name, bands: state.targetMode === 'vowel'
          ? recommendVowelTargets(resolveBands(name, state.presetOverrides), name, getBandCenter(state.bands.f0.range))
          : resolveBands(name, state.presetOverrides) }
        : {}),

      savePresetOverride: (key, f0, f1, f2) => set((state) => {
        const idx = state.presetOverrides.findIndex(o => o.key === key)
        const normalized = resolveBands(key, [{ key, f0, f1, f2 }])
        const override: PresetOverride = { key, f0: normalized.f0.range, f1: normalized.f1.range, f2: normalized.f2.range }
        const next = [...state.presetOverrides]
        if (idx >= 0) next[idx] = override
        else next.push(override)
        return { presetOverrides: next }
      }),

      resetPresets: () => set({
        presetOverrides: [],
        activePreset: 'vowel-a',
        bands: DEFAULT_BANDS,
        targetMode: 'vowel',
      }),

      appendFrame: (frame) => set((state) => {
        const capacity = retainedFrameCapacity(state.config.audioRetentionSeconds)
        const frames = state.frames.length >= capacity
          ? [...state.frames.slice(-(capacity - 1)), frame]
          : [...state.frames, frame]
        return { frames, latestFrame: frame }
      }),

      setFrames: (frames) => set(state => ({
        frames: frames.slice(-retainedFrameCapacity(state.config.audioRetentionSeconds)),
        latestFrame: frames.length > 0 ? frames[frames.length - 1] : null,
      })),

      setLatestFrame: (frame) => set({ latestFrame: frame }),

      clearFrames: () => set({
        frames: [],
        latestFrame: null,
        stats: { f0Mean: null, hitRate: null, duration: 0 },
      }),

      toggleFormantVisible: (key) => set((state) => ({
        formantVisible: { ...state.formantVisible, [key]: !state.formantVisible[key] },
      })),

      reset: () => {
        recordingBuffer.resize(DEFAULT_CONFIG.audioRetentionSeconds * AUDIO_SAMPLE_RATE)
        return set({
          config: DEFAULT_CONFIG,
          bands: DEFAULT_BANDS,
          activePreset: 'vowel-a',
          presetOverrides: [],
          targetMode: 'vowel',
          frames: [],
          latestFrame: null,
          stats: { f0Mean: null, hitRate: null, duration: 0 },
          formantVisible: { f0: true, f1: true, f2: true },
        })
      },
    }),
    {
      name: 'voicebuilder-presets',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        presetOverrides: state.presetOverrides,
        config: state.config,
        targetMode: state.targetMode,
        activePreset: state.activePreset,
        bands: state.bands,
      }),
      merge: (persisted, current) => {
        const stored = persisted as Partial<AppState> | undefined
        const original = stored?.presetOverrides
        const presetOverrides = normalizeOverrides(original)
        preserveMigrationBackup(original, presetOverrides)
        const config = normalizeAppConfig(stored?.config)
        recordingBuffer.resize(config.audioRetentionSeconds * AUDIO_SAMPLE_RATE)
        const storedMode = stored?.targetMode
        const targetMode = storedMode === 'manual' || (storedMode == null && presetOverrides.length > 0) ? 'manual' : 'vowel'
        const activePreset = typeof stored?.activePreset === 'string' && Object.prototype.hasOwnProperty.call(VOWEL_PRESETS, stored.activePreset)
          ? stored.activePreset : 'vowel-a'
        const fallback = resolveBands(activePreset, presetOverrides)
        // 当前目标独立于逐元音覆盖保存：推荐模式切换元音时也必须保留当前 F0。
        const restored = { ...fallback }
        for (const key of ['f0', 'f1', 'f2'] as const) {
          const range = stored?.bands?.[key]?.range
          if (Array.isArray(range) && range.length === 2 && range.every(value => typeof value === 'number' && Number.isFinite(value)) && range[0] < range[1]) {
            restored[key] = { ...fallback[key], range: [range[0], range[1]] }
          }
        }
        const resolved = normalizeTargetBands(restored)
        return { ...current, config, targetMode, activePreset, frames: current.frames.slice(-retainedFrameCapacity(config.audioRetentionSeconds)), presetOverrides, bands: targetMode === 'vowel' ? recommendVowelTargets(resolved, activePreset) : resolved }
      },
    }
  )
)
