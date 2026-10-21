import { beforeEach, describe, expect, it } from 'vitest'
import { encodeWav } from '../audio/wavExport'
import { recordingBuffer } from '../audio/recordingBuffer'
import { AUDIO_WINDOW_SECONDS, AUDIO_WINDOW_SAMPLES } from '../config/audioLimits'

function text(view: DataView, offset: number, count: number): string {
  return Array.from({ length: count }, (_, index) => String.fromCharCode(view.getUint8(offset + index))).join('')
}
function pcm(buffer: ArrayBuffer): number[] {
  const view = new DataView(buffer)
  return Array.from({ length: (buffer.byteLength - 44) / 2 }, (_, index) => view.getInt16(44 + index * 2, true))
}

describe('PCM16 WAV export', () => {
  beforeEach(() => recordingBuffer.clear())

  it('writes an interoperable RIFF header for 16 kHz mono PCM16', () => {
    const samples = new Float32Array([0, 0.5, -0.5])
    const buffer = encodeWav(samples)
    const view = new DataView(buffer)
    expect(buffer.byteLength).toBe(50)
    expect(text(view, 0, 4)).toBe('RIFF')
    expect(view.getUint32(4, true)).toBe(42)
    expect(text(view, 8, 4)).toBe('WAVE')
    expect(text(view, 12, 4)).toBe('fmt ')
    expect(view.getUint32(16, true)).toBe(16)
    expect(view.getUint16(20, true)).toBe(1)
    expect(view.getUint16(22, true)).toBe(1)
    expect(view.getUint32(24, true)).toBe(16000)
    expect(view.getUint32(28, true)).toBe(32000)
    expect(view.getUint16(32, true)).toBe(2)
    expect(view.getUint16(34, true)).toBe(16)
    expect(text(view, 36, 4)).toBe('data')
    expect(view.getUint32(40, true)).toBe(6)
    expect(pcm(buffer)).toEqual([0, 16384, -16384])
    expect(samples).toEqual(new Float32Array([0, 0.5, -0.5]))
  })

  it('saturates out-of-range amplitudes without wrapping or normalizing quieter samples', () => {
    const buffer = encodeWav(new Float32Array([-2, -1, -0.25, 0, 0.25, 1, 2, NaN, Infinity]))
    expect(pcm(buffer)).toEqual([-32768, -32768, -8192, 0, 8192, 32767, 32767, 0, 0])
  })

  it('does not pad short recordings or manufacture samples for an empty buffer', () => {
    recordingBuffer.write(new Float32Array([0.25, -0.25]))
    expect(encodeWav(recordingBuffer.read()).byteLength).toBe(48)
    recordingBuffer.clear()
    expect(encodeWav(recordingBuffer.read()).byteLength).toBe(44)
  })

  it('exports only the retained window in chronological order after ring-buffer wraparound', () => {
    const capacity = AUDIO_WINDOW_SAMPLES
    const samples = Float32Array.from({ length: capacity + 3 }, (_, index) => (index % 17 - 8) / 8)
    recordingBuffer.write(samples.subarray(0, capacity - 5))
    recordingBuffer.write(samples.subarray(capacity - 5))
    const snapshot = recordingBuffer.read()
    expect(snapshot).toEqual(samples.slice(3))
    const buffer = encodeWav(snapshot)
    expect(buffer.byteLength).toBe(44 + capacity * 2)
    const view = new DataView(buffer)
    expect(view.getUint32(40, true) / view.getUint32(28, true)).toBe(AUDIO_WINDOW_SECONDS)
    expect(pcm(buffer)).toEqual(pcm(encodeWav(samples.slice(3))))
    expect(recordingBuffer.read()).toEqual(snapshot)
  })

  it.each([0, -1, NaN, 16000.5])('rejects an invalid sample rate %s', rate => {
    expect(() => encodeWav(new Float32Array([0]), rate)).toThrow(RangeError)
  })
})
