import type { StatisticsAnalysis, StatisticsClip } from './types'

export function runStatisticsAnalysis(
  clip: StatisticsClip,
  { signal, onProgress }: { signal: AbortSignal; onProgress?: (progress: number) => void },
): Promise<StatisticsAnalysis> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('已取消分析。', 'AbortError'))
      return
    }
    let worker: Worker
    try {
      worker = new Worker(new URL('./analysis.worker.ts', import.meta.url), { type: 'module' })
    } catch {
      reject(new Error('无法启动音高分析，请使用支持 Web Worker 的浏览器。'))
      return
    }
    const cleanup = () => {
      signal.removeEventListener('abort', cancel)
      worker.terminate()
    }
    const cancel = () => {
      cleanup()
      reject(new DOMException('已取消分析。', 'AbortError'))
    }
    signal.addEventListener('abort', cancel, { once: true })
    worker.onerror = () => {
      cleanup()
      reject(new Error('音高分析意外中断，请重试。'))
    }
    worker.onmessageerror = () => {
      cleanup()
      reject(new Error('无法读取音高分析结果，请重试。'))
    }
    worker.onmessage = (event: MessageEvent<
      { type: 'progress'; progress: number }
      | { type: 'complete'; analysis: StatisticsAnalysis }
      | { type: 'error'; message: string }
    >) => {
      const result = event.data
      if (result.type === 'progress') onProgress?.(result.progress)
      else if (result.type === 'complete') {
        cleanup()
        resolve(result.analysis)
      } else {
        cleanup()
        reject(new Error(result.message))
      }
    }
    // 拷贝给 Worker 而不转移底层缓冲，报告回放仍需保留完整原音频。
    try {
      worker.postMessage({ samples: clip.samples, sampleRate: clip.sampleRate })
    } catch {
      cleanup()
      reject(new Error('无法向音高分析器发送音频，请重试。'))
    }
  })
}
