export const F0_RANGE = { min: 60, max: 1000 } as const

// 默认显示范围与可编辑目标范围；图表可扩展，独立于 DSP 检测边界。
export const F0_CHART_RANGE = { min: 0, max: 500 } as const
export const FORMANT_CHART_RANGE = { min: 0, max: 3500 } as const

export const BAND_INPUT_LIMITS: Record<
  'f0' | 'f1' | 'f2',
  { min: number; max: number; step: number }
> = {
  f0: { ...F0_CHART_RANGE, step: 5 },
  f1: { ...FORMANT_CHART_RANGE, step: 10 },
  f2: { ...FORMANT_CHART_RANGE, step: 10 },
}

export const FORMANT_MIN_GAP_HZ = 50
