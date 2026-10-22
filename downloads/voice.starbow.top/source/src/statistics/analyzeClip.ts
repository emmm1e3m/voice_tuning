import { F0_RANGE } from '../config/analysisRanges'
import { FrameProcessor } from '../dsp/frame-processor'
import { Resampler } from '../dsp/resampler'
import { fftMagnitudes } from '../dsp/fft'
import { detectPitch } from '../dsp/lpc'
import { VoiceActivityDetector, DEFAULT_VAD_OPTIONS } from '../dsp/vad'
import { hasSpeechSpectrum } from '../dsp/speech-spectrum'
import { summarizePitch } from './statistics'
import {
  MAX_STATISTICS_SECONDS,
  STATISTICS_MAX_F0, STATISTICS_MIN_F0,
  STATISTICS_SAMPLE_RATE as SAMPLE_RATE,
  STATISTICS_FRAME_SIZE as FRAME_SIZE,
  STATISTICS_HOP_SIZE as HOP_SIZE,
} from './constants'
import type { PitchFrame, StatisticsAnalysis } from './types'

export { MAX_STATISTICS_SECONDS } from './constants'

export function analyzeClip(input: Float32Array, sampleRate: number, onProgress?: (progress: number) => void): StatisticsAnalysis {
  if (!Number.isFinite(sampleRate) || sampleRate <= 0) throw new Error('无法分析：音频采样率无效。')
  const duration = input.length / sampleRate
  if (duration > MAX_STATISTICS_SECONDS) throw new Error('音频不能超过 60 秒，请裁剪后重试。')
  const samples = sampleRate === SAMPLE_RATE ? input : new Resampler(sampleRate, SAMPLE_RATE).process(input)
  const frames: PitchFrame[] = []
  const processor = new FrameProcessor({ sampleRate: SAMPLE_RATE, frameSize: FRAME_SIZE, hopSize: HOP_SIZE })
  const detector = new VoiceActivityDetector(DEFAULT_VAD_OPTIONS)
  let frameIndex = 0
  processor.onFrame = frame => {
    const startSample = frameIndex++ * HOP_SIZE
    const start = startSample / SAMPLE_RATE
    if (start >= duration) return
    const realLength = Math.max(0, Math.min(FRAME_SIZE, samples.length - startSample))
    const realSamples = frame.samples.subarray(0, realLength)
    const enoughSamples = realLength >= FRAME_SIZE / 2
    const spectrum = enoughSamples ? fftMagnitudes(realSamples, 2048) : null
    const { voiced } = detector.compute(realSamples, 10, spectrum !== null && hasSpeechSpectrum(spectrum, SAMPLE_RATE))
    const rawF0 = voiced ? detectPitch(realSamples, SAMPLE_RATE) : null
    frames.push({
      start,
      duration: Math.min(HOP_SIZE / SAMPLE_RATE, duration - start),
      time: start + Math.min(FRAME_SIZE / SAMPLE_RATE, duration - start) / 2,
      rawF0,
      f0: rawF0,
      voiced,
      exclusion: rawF0 === null ? 'invalid' : null,
    })
    if (frames.length % 100 === 0) onProgress?.(Math.min(1, (start + FRAME_SIZE / SAMPLE_RATE) / duration))
  }
  // 分秒推入，避免长音频一次创建全部重叠分析窗。
  for (let offset = 0; offset < samples.length; offset += SAMPLE_RATE) {
    processor.push(samples.subarray(offset, offset + SAMPLE_RATE))
  }
  if (samples.length) processor.push(new Float32Array(FRAME_SIZE))
  onProgress?.(1)
  return {
    ...summarizePitch(frames, duration),
    settings: {
      sampleRate: SAMPLE_RATE,
      frameSize: FRAME_SIZE,
      hopSize: HOP_SIZE,
      f0Range: [F0_RANGE.min, F0_RANGE.max],
      statisticsRange: [STATISTICS_MIN_F0, STATISTICS_MAX_F0],
      version: 'pitch-statistics-1',
    },
  }
}
