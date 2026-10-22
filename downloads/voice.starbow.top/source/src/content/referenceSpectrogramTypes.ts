export interface DigitizedTrace {
  kind: 'formants' | 'pitch' | 'intensity' | 'waveform'
  paths: string[]
}

export interface DigitizedAxis {
  label: string
  min: number
  max: number
  unit: string
}

export interface DigitizedPanel {
  label?: string
  columns: number
  rows: number
  density: string
  traces: DigitizedTrace[]
  xAxis: DigitizedAxis
  yAxis: DigitizedAxis
  rightAxes?: (DigitizedAxis & { kind: 'pitch' | 'intensity' })[]
  segments?: { x: number; label: string }[]
}

export interface DigitizedSpectrogram {
  title: string
  panels: DigitizedPanel[]
}
