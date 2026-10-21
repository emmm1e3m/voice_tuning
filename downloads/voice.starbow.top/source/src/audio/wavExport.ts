import { AUDIO_SAMPLE_RATE } from '../config/audioLimits'

export const WAV_SAMPLE_RATE = AUDIO_SAMPLE_RATE

/** 将原始浮点采样量化为单声道 PCM16 WAV，不归一化、不补齐音频。 */
export function encodeWav(samples: Float32Array, sampleRate = WAV_SAMPLE_RATE): ArrayBuffer {
  if (!Number.isInteger(sampleRate) || sampleRate <= 0 || sampleRate > 0x7fffffff) {
    throw new RangeError('采样率必须是有效的正整数')
  }
  const dataSize = samples.length * 2
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)
  const writeText = (offset: number, text: string) => {
    for (let index = 0; index < text.length; index++) view.setUint8(offset + index, text.charCodeAt(index))
  }
  writeText(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeText(8, 'WAVE')
  writeText(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeText(36, 'data')
  view.setUint32(40, dataSize, true)
  for (let index = 0; index < samples.length; index++) {
    // 非有限样本不允许溢出；音量只做 PCM16 必需的饱和量化。
    const raw = Number.isFinite(samples[index]) ? samples[index] : 0
    const sample = Math.max(-1, Math.min(1, raw))
    view.setInt16(44 + index * 2, Math.round(sample * (sample < 0 ? 32768 : 32767)), true)
  }
  return buffer
}
