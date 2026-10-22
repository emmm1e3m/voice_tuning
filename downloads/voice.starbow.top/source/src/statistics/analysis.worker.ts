import { analyzeClip } from './analyzeClip'

self.onmessage = (event: MessageEvent<{ samples: Float32Array; sampleRate: number }>) => {
  try {
    const analysis = analyzeClip(event.data.samples, event.data.sampleRate, progress => {
      self.postMessage({ type: 'progress', progress })
    })
    self.postMessage({ type: 'complete', analysis })
  } catch (error) {
    self.postMessage({ type: 'error', message: error instanceof Error ? error.message : '音高分析失败，请重试。' })
  }
}
