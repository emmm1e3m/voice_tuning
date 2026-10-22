import type { AudioEngine } from '../ts/AudioEngine'
import type { StatisticsAnalysis, StatisticsClip, StatisticsMaterial, StatisticsSnapshot } from './types'
import { MAX_STATISTICS_SECONDS } from './constants'

interface AnalysisOptions {
  signal: AbortSignal
  onProgress?: (progress: number) => void
}

export interface StatisticsDependencies {
  engine: Pick<AudioEngine, 'startCapture' | 'stopCapture'>
  analyze: (clip: StatisticsClip, options: AnalysisOptions) => Promise<StatisticsAnalysis>
  importFile: (file: File, signal: AbortSignal) => Promise<StatisticsClip>
  now?: () => Date
}

const isBusy = (phase: StatisticsSnapshot['phase']) =>
  ['requesting', 'recording', 'paused', 'importing', 'analyzing'].includes(phase)

export class StatisticsSessionController {
  private snapshot: StatisticsSnapshot = {
    phase: 'ready', material: null, elapsed: 0, atLimit: false, progress: 0, error: null, report: null,
  }
  private listeners = new Set<() => void>()
  private chunks: Float32Array[] = []
  private sampleCount = 0
  private sampleRate = 0
  private material: StatisticsMaterial | null = null
  private workingClip: StatisticsClip | null = null
  private operation = 0
  private capture = 0
  private operationAbort = new AbortController()
  private captureAbort = new AbortController()
  private captureTimer: ReturnType<typeof setTimeout> | null = null

  constructor(private dependencies: StatisticsDependencies) {}

  getSnapshot = () => this.snapshot

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private update(patch: Partial<StatisticsSnapshot>) {
    this.snapshot = { ...this.snapshot, ...patch }
    this.listeners.forEach(listener => listener())
  }

  private clearCaptureTimer() {
    if (this.captureTimer !== null) clearTimeout(this.captureTimer)
    this.captureTimer = null
  }

  private stopCapture() {
    this.capture++
    this.captureAbort.abort()
    this.clearCaptureTimer()
    this.dependencies.engine.stopCapture()
  }

  private interruption(capture: number) {
    if (capture !== this.capture || !['requesting', 'recording'].includes(this.snapshot.phase)) return
    if (this.sampleCount > 0) {
      this.pause()
      this.update({ error: '录音已中断，已保留片段，可以继续录音或完成分析。' })
    } else {
      this.cancel()
      this.update({ error: '没有收到音频，请检查麦克风后重试。' })
    }
  }

  private watchCapture(capture: number) {
    this.clearCaptureTimer()
    this.captureTimer = setTimeout(() => this.interruption(capture), 5000)
  }

  private begin(phase: StatisticsSnapshot['phase']) {
    this.operationAbort.abort()
    this.operationAbort = new AbortController()
    const operation = ++this.operation
    this.update({ phase, elapsed: 0, atLimit: false, progress: 0, error: null })
    return operation
  }

  start = async (material: StatisticsMaterial | null) => {
    if (isBusy(this.snapshot.phase)) return
    this.chunks = []
    this.sampleCount = 0
    this.sampleRate = 0
    this.workingClip = null
    this.material = material ? { ...material } : null
    this.begin('requesting')
    this.update({ material: this.material })
    await this.captureAudio()
  }

  private async captureAudio() {
    const capture = ++this.capture
    this.captureAbort = new AbortController()
    try {
      await this.dependencies.engine.startCapture((input, sampleRate) => {
        if (capture !== this.capture || !['requesting', 'recording'].includes(this.snapshot.phase)) return
        this.sampleRate = sampleRate
        const capacity = Math.round(MAX_STATISTICS_SECONDS * sampleRate)
        const count = Math.min(input.length, capacity - this.sampleCount)
        if (count > 0) {
          // 浏览器会重用输入缓冲；暂停后保留的片段必须拥有自己的采样。
          this.chunks.push(input.slice(0, count))
          this.sampleCount += count
        }
        this.update({ phase: 'recording', elapsed: this.sampleCount / sampleRate })
        if (this.sampleCount >= capacity) this.pause()
        else this.watchCapture(capture)
      }, {
        signal: this.captureAbort.signal,
        onInterrupted: () => this.interruption(capture),
      })
      if (capture !== this.capture) return
      this.update({ phase: 'recording' })
      this.watchCapture(capture)
    } catch {
      if (capture !== this.capture) return
      this.stopCapture()
      this.update({
        phase: this.sampleCount ? 'paused' : 'ready',
        error: '无法启动录音，请检查麦克风权限或设备。',
      })
    }
  }

  pause = () => {
    if (!['requesting', 'recording'].includes(this.snapshot.phase)) return
    this.stopCapture()
    const elapsed = this.sampleRate ? this.sampleCount / this.sampleRate : 0
    this.update({ phase: 'paused', elapsed, atLimit: elapsed >= MAX_STATISTICS_SECONDS })
  }

  resume = async () => {
    if (this.snapshot.phase !== 'paused' || this.snapshot.atLimit) return
    this.update({ phase: 'requesting', error: null })
    await this.captureAudio()
  }

  finish = () => {
    if (this.snapshot.phase !== 'paused' || !this.sampleCount || !this.sampleRate) return
    const samples = new Float32Array(this.sampleCount)
    let offset = 0
    for (const chunk of this.chunks) {
      samples.set(chunk, offset)
      offset += chunk.length
    }
    this.chunks = []
    this.workingClip = {
      samples,
      sampleRate: this.sampleRate,
      duration: samples.length / this.sampleRate,
      source: 'mic',
      name: '声音练习录音',
      material: this.material,
    }
    void this.analyze(this.operation, this.workingClip)
  }

  private async analyze(operation: number, clip: StatisticsClip) {
    this.update({ phase: 'analyzing', elapsed: clip.duration, error: null, progress: 0 })
    try {
      const analysis = await this.dependencies.analyze(clip, {
        signal: this.operationAbort.signal,
        onProgress: progress => {
          if (operation === this.operation) this.update({ progress })
        },
      })
      if (operation !== this.operation) return
      const report = {
        id: crypto.randomUUID(),
        createdAt: (this.dependencies.now?.() ?? new Date()).toISOString(),
        clip,
        analysis,
      }
      this.workingClip = null
      this.update({ phase: 'ready', report, elapsed: 0, atLimit: false, progress: 1, error: null })
    } catch (error) {
      if (operation !== this.operation) return
      this.update({ phase: 'error', error: error instanceof Error ? error.message : '分析失败，请重试。' })
    }
  }

  importFile = async (file: File) => {
    if (isBusy(this.snapshot.phase)) return
    const operation = this.begin('importing')
    this.workingClip = null
    try {
      const clip = await this.dependencies.importFile(file, this.operationAbort.signal)
      if (operation !== this.operation) return
      this.workingClip = clip
      await this.analyze(operation, clip)
    } catch (error) {
      if (operation !== this.operation) return
      this.update({ phase: 'ready', error: error instanceof Error ? error.message : '导入失败，请检查音频文件。' })
    }
  }

  retry = () => {
    if (this.snapshot.phase !== 'error' || !this.workingClip) return
    const clip = this.workingClip
    const operation = this.begin('analyzing')
    void this.analyze(operation, clip)
  }

  cancel = () => {
    const capturing = ['requesting', 'recording'].includes(this.snapshot.phase)
    this.operation++
    this.operationAbort.abort()
    if (capturing) this.stopCapture()
    this.chunks = []
    this.sampleCount = 0
    this.sampleRate = 0
    this.workingClip = null
    this.update({ phase: 'ready', elapsed: 0, atLimit: false, progress: 0, error: null })
  }

  leave = () => {
    if (!['recording', 'requesting'].includes(this.snapshot.phase)) return
    if (this.sampleCount) this.pause()
    else this.cancel()
  }

  destroy = () => {
    this.cancel()
    this.listeners.clear()
  }
}
