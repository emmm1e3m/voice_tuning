import { DEFAULT_CONFIG, type AppConfig } from '../types'
import { ANALYSIS_HOP_SECONDS } from './audioLimits'

export const SMOOTHING_WINDOW_LIMITS = { min: 1, max: 30 } as const
export const AUDIO_RETENTION_LIMITS = { min: 5, max: 120 } as const

function boundedInteger(value: unknown, fallback: number, limits: { min: number; max: number }): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(limits.min, Math.min(limits.max, Math.round(value))) : fallback
}

export function normalizeAppConfig(value: unknown, fallback: AppConfig = DEFAULT_CONFIG): AppConfig {
  const input = value && typeof value === 'object' ? value as Partial<AppConfig> : {}
  return {
    formantMethod: ['hybrid', 'lpc', 'cepstral'].includes(input.formantMethod ?? '') ? input.formantMethod! : fallback.formantMethod,
    formantSmoothing: typeof input.formantSmoothing === 'boolean' ? input.formantSmoothing : fallback.formantSmoothing,
    formantSmoothingWindow: boundedInteger(input.formantSmoothingWindow, fallback.formantSmoothingWindow, SMOOTHING_WINDOW_LIMITS),
    audioRetentionSeconds: boundedInteger(input.audioRetentionSeconds, fallback.audioRetentionSeconds, AUDIO_RETENTION_LIMITS),
  }
}

export function retainedFrameCapacity(seconds: number): number {
  return Math.round(seconds / ANALYSIS_HOP_SECONDS)
}
