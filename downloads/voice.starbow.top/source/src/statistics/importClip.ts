import { decodeAudioFile, probeAudioDuration, probeWavDuration } from '../audio/audioDecoder'
import { isWavFile, parseWav } from '../dsp/wav-parser'
import { MAX_STATISTICS_SECONDS } from './constants'
import type { StatisticsClip } from './types'

function checkCancellation(signal: AbortSignal): void {
  if (signal.aborted) throw new DOMException('已取消导入。', 'AbortError')
}

function checkDuration(duration: number): void {
  if (!Number.isFinite(duration) || duration <= 0) throw new Error('音频为空或无法读取时长。')
  if (duration > MAX_STATISTICS_SECONDS) throw new Error('音频不能超过 60 秒，请裁剪后重试。')
}

export async function importStatisticsFile(file: File, signal: AbortSignal): Promise<StatisticsClip> {
  checkCancellation(signal)
  const header = await file.slice(0, 12).arrayBuffer()
  checkCancellation(signal)
  let samples: Float32Array
  let sampleRate: number
  if (isWavFile(header)) {
    const duration = await probeWavDuration(file)
    checkCancellation(signal)
    if (duration !== null) checkDuration(duration)
    const contents = await file.arrayBuffer()
    checkCancellation(signal)
    try {
      const parsed = parseWav(contents)
      samples = parsed.samples
      sampleRate = parsed.sampleRate
    } catch {
      throw new Error('无法读取 WAV 音频，请检查文件是否完整。')
    }
  } else {
    let duration: number
    try {
      duration = await probeAudioDuration(file)
    } catch {
      checkCancellation(signal)
      throw new Error('无法读取该音频，请尝试 WAV、MP3 或 M4A 文件。')
    }
    checkCancellation(signal)
    checkDuration(duration)
    const contents = await file.arrayBuffer()
    checkCancellation(signal)
    const context = new AudioContext()
    try {
      const decoded = await decodeAudioFile(contents, context)
      samples = decoded.samples
      sampleRate = decoded.sampleRate
    } catch {
      throw new Error('无法解码该音频，请尝试 WAV、MP3 或 M4A 文件。')
    } finally {
      await context.close()
    }
    checkCancellation(signal)
  }
  const duration = samples.length / sampleRate
  checkDuration(duration)
  checkCancellation(signal)
  return { samples, sampleRate, duration, source: 'file', name: file.name, material: null }
}
