export const CHART_FONT_SCALE = 1.25

// 只格式化预览文字，不改变数据、指针或回放使用的真实数值。
export function formatFrequencyPreview(value: unknown): string {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? `${Math.round(value)} Hz` : '--'
}

export function formatTimePreview(value: unknown): string {
  return typeof value === 'number' && Number.isFinite(value) ? `${Math.round(value)} s` : '--'
}
