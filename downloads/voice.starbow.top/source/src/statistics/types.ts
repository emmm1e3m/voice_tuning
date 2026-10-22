export interface StatisticsMaterial {
  id: string
  title: string
}

export interface StatisticsClip {
  samples: Float32Array
  sampleRate: number
  duration: number
  source: 'mic' | 'file'
  name: string
  material: StatisticsMaterial | null
}

export interface PitchFrame {
  start: number
  duration: number
  time: number
  rawF0: number | null
  f0: number | null
  voiced: boolean
  exclusion: 'invalid' | 'isolated-jump' | 'above-statistics-limit' | null
}

export interface HistogramBin {
  from: number
  to: number
  count: number
  proportion: number
}

export interface PitchSummary {
  median: number | null
  p10: number | null
  p90: number | null
  validDuration: number
  coverage: number
  excludedCount: number
  histogram: HistogramBin[]
  aboveLimitCount: number
  aboveLimitDuration: number
  aboveLimitProportion: number | null
  candidateDuration: number
}

export interface StatisticsAnalysis {
  frames: PitchFrame[]
  summary: PitchSummary
  settings: {
    sampleRate: number
    frameSize: number
    hopSize: number
    f0Range: readonly [number, number]
    statisticsRange: readonly [number, number]
    version: string
  }
}

export interface StatisticsReport {
  id: string
  createdAt: string
  clip: StatisticsClip
  analysis: StatisticsAnalysis
}

export type StatisticsPhase = 'ready' | 'requesting' | 'recording' | 'paused' | 'importing' | 'analyzing' | 'error'

export interface StatisticsSnapshot {
  phase: StatisticsPhase
  material: StatisticsMaterial | null
  elapsed: number
  atLimit: boolean
  progress: number
  error: string | null
  report: StatisticsReport | null
}
