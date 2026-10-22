import type { AnalysisFrame } from '../types'
import { AUDIO_SAMPLE_RATE, ANALYSIS_HOP_SECONDS } from '../config/audioLimits'
import { extractHarmonics } from './harmonic-amplitudes'
import { DEFAULT_VAD_THRESHOLD } from './vad'
import type { RegisterOptions } from './register-detector'

export const REGISTER_CALIBRATION_SECONDS = 1.2

export interface RegisterCalibrationSample {
  time: number
  f0: number
  harmonicCount: number
}

export interface PersonalRegisterCalibration {
  boundaryCount: number
  f0: number
  calibratedAt: number
}

export function calibrationSample(frame: AnalysisFrame): RegisterCalibrationSample | null {
  if (!frame.voiced || frame.f0 == null || !Number.isFinite(frame.f0) || frame.f0 <= 0
    || !Number.isFinite(frame.rms) || frame.rms! < DEFAULT_VAD_THRESHOLD || !frame.magnitudes) return null
  const harmonics = extractHarmonics(frame.magnitudes, frame.f0, AUDIO_SAMPLE_RATE)
  return harmonics.valid ? { time: frame.time, f0: frame.f0, harmonicCount: harmonics.harmonicCount } : null
}

function quantile(values: number[], fraction: number): number {
  const sorted = [...values].sort((a, b) => a - b)
  const index = (sorted.length - 1) * fraction
  const lower = Math.floor(index)
  return sorted[lower] + (sorted[Math.ceil(index)] - sorted[lower]) * (index - lower)
}

export function buildRegisterCalibration(samples: RegisterCalibrationSample[], now = Date.now()): PersonalRegisterCalibration | null {
  if (samples.length < Math.round(REGISTER_CALIBRATION_SECONDS / ANALYSIS_HOP_SECONDS) - 1) return null
  if (samples.some((sample, index) => !Number.isFinite(sample.f0) || sample.f0 <= 0
    || !Number.isFinite(sample.harmonicCount) || sample.harmonicCount < 0 || sample.harmonicCount > 9
    || !Number.isFinite(sample.time) || (index > 0 && (sample.time <= samples[index - 1].time
      || sample.time - samples[index - 1].time > ANALYSIS_HOP_SECONDS * 3)))) return null
  const duration = samples[samples.length - 1].time - samples[0].time + ANALYSIS_HOP_SECONDS
  if (duration < REGISTER_CALIBRATION_SECONDS - ANALYSIS_HOP_SECONDS / 2) return null
  const pitches = samples.map(sample => sample.f0)
  const counts = samples.map(sample => sample.harmonicCount)
  const f0 = quantile(pitches, .5)
  // 固定音高与元音采样，避免把滑音或短暂失声当作个人换声边界。
  if ((quantile(pitches, .9) - quantile(pitches, .1)) / f0 > .08
    || quantile(counts, .75) - quantile(counts, .25) > 2) return null
  const boundaryCount = quantile(counts, .5)
  // 计数达到两端时，无法为边界两侧都留出可区分的范围。
  if (boundaryCount < 1 || boundaryCount > 8) return null
  return { boundaryCount, f0, calibratedAt: now }
}

export function registerOptionsForCalibration(calibration: PersonalRegisterCalibration | null): RegisterOptions | undefined {
  if (!calibration) return undefined
  return { chestCount: calibration.boundaryCount + .75, falsettoCount: calibration.boundaryCount - .75 }
}

export function isPersonalRegisterCalibration(value: unknown): value is PersonalRegisterCalibration {
  const data = value as Partial<PersonalRegisterCalibration> | null
  return !!data && Number.isFinite(data.boundaryCount) && data.boundaryCount! >= 1 && data.boundaryCount! <= 8
    && Number.isFinite(data.f0) && data.f0! > 0 && Number.isFinite(data.calibratedAt) && data.calibratedAt! > 0
}
