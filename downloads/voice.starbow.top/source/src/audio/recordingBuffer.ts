import { RingBuffer } from '../dsp/RingBuffer'
import { AUDIO_WINDOW_SAMPLES } from '../config/audioLimits'

// 分析写入、回放及 WAV 下载读取的原始采样缓冲。
export const recordingBuffer = new RingBuffer(AUDIO_WINDOW_SAMPLES)
