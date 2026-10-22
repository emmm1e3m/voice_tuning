import { afterEach, describe, expect, it, vi } from 'vitest'
import { encodeWav } from '../audio/wavExport'
import { importStatisticsFile } from '../statistics/importClip'
import { runStatisticsAnalysis } from '../statistics/workerClient'
import type { StatisticsClip } from '../statistics/types'

function wavFile(buffer: ArrayBuffer, read = vi.fn(async () => buffer)) {
  return {
    name: 'practice.wav',
    slice: (start: number, end: number) => ({ arrayBuffer: async () => buffer.slice(start, end) }),
    arrayBuffer: read,
  } as unknown as File
}

afterEach(() => vi.unstubAllGlobals())

describe('统计录音导入', () => {
  it('保留完整的原始采样率与时长供报告回放', async () => {
    const buffer = encodeWav(new Float32Array(4000).fill(0.25), 8000)
    const clip = await importStatisticsFile(wavFile(buffer), new AbortController().signal)
    expect(clip).toMatchObject({ duration: 0.5, sampleRate: 8000, source: 'file', material: null, name: 'practice.wav' })
    expect(clip.samples.length).toBe(4000)
    expect(clip.samples[0]).toBeCloseTo(0.25, 4)
  })

  it('从WAV头拒绝超过60秒的文件，不完整读取或解析音频', async () => {
    const buffer = encodeWav(new Float32Array(60 * 8000 + 1), 8000)
    const read = vi.fn(async () => buffer)
    await expect(importStatisticsFile(wavFile(buffer, read), new AbortController().signal)).rejects.toThrow('60 秒')
    expect(read).not.toHaveBeenCalled()
  })

  it('取消后丢弃迟到的完整文件读取结果', async () => {
    const buffer = encodeWav(new Float32Array(4000), 8000)
    let finishRead!: (value: ArrayBuffer) => void
    const read = vi.fn(() => new Promise<ArrayBuffer>(resolve => { finishRead = resolve }))
    const controller = new AbortController()
    const task = importStatisticsFile(wavFile(buffer, read), controller.signal)
    await vi.waitFor(() => expect(read).toHaveBeenCalledOnce())
    controller.abort()
    finishRead(buffer)
    await expect(task).rejects.toMatchObject({ name: 'AbortError' })
  })
})

describe('统计分析Worker生命周期', () => {
  const clip: StatisticsClip = {
    samples: new Float32Array([0.2, 0.3]), sampleRate: 16000, duration: 2 / 16000,
    source: 'mic', name: '录音', material: null,
  }

  it('取消计算会终止Worker，并保留原音频缓冲', async () => {
    const terminate = vi.fn()
    const postMessage = vi.fn()
    vi.stubGlobal('Worker', class {
      terminate = terminate
      postMessage = postMessage
    })
    const controller = new AbortController()
    const task = runStatisticsAnalysis(clip, { signal: controller.signal })
    controller.abort()
    await expect(task).rejects.toMatchObject({ name: 'AbortError' })
    expect(terminate).toHaveBeenCalledOnce()
    expect(postMessage.mock.calls[0]).toHaveLength(1)
    expect(clip.samples.length).toBe(2)
    expect(clip.samples[0]).toBeCloseTo(0.2)
  })

  it('已取消的请求不再创建Worker', async () => {
    const construct = vi.fn()
    vi.stubGlobal('Worker', class { constructor() { construct() } })
    const controller = new AbortController()
    controller.abort()
    await expect(runStatisticsAnalysis(clip, { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' })
    expect(construct).not.toHaveBeenCalled()
  })
})
