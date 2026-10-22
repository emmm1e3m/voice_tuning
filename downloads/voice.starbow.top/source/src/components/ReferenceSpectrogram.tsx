import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { DigitizedAxis, DigitizedPanel, DigitizedSpectrogram, DigitizedTrace } from '../content/referenceSpectrogramTypes'
import styles from './ReferenceSpectrogram.module.css'

const PRINCIPLES = [
  'e6caba5d30095e6418a3ea5a52d6d6b1c2da9dbfe699ee007538d2dc238b3468.jpg',
  '5d443775094c569de93ed9667b5c253e3753dd1bc1871dc9504563e133d8a9bb.jpg',
  'b68aa2731748aca3edc84a91a7135e82d2864d58789245088818c673351f78d8.jpg',
  'fe02ac75a9d66d77fd2df3059ade92cb38f8c1f763f2493f0a5f580906d862e6.jpg',
  '765fffb9cdf051eadc3c9b52ee2e1f8553dd7f623cc0903c1595dc6c15f7e9a2.jpg',
]
const loadPrinciples = () => import('../content/referenceSpectrogramPrinciples').then(module => module.REFERENCE_SPECTROGRAM_PRINCIPLES)
const LOADERS: Record<string, () => Promise<Record<string, DigitizedSpectrogram>>> = Object.fromEntries(PRINCIPLES.map(name => [name, loadPrinciples]))
const basename = (src: string) => src.slice(src.lastIndexOf('/') + 1)
const number = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 3, useGrouping: false })
const TRACE_LABELS: Record<DigitizedTrace['kind'], string> = {
  formants: '共振峰', pitch: '基频', intensity: '音强', waveform: '波形',
}

export function hasReferenceSpectrogram(src: string): boolean {
  return basename(src) in LOADERS
}

function Density({ panel }: { panel: DigitizedPanel }) {
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const context = canvas.current?.getContext('2d')
    if (!context) return
    const density = atob(panel.density)
    const frame = context.createImageData(panel.columns, panel.rows)
    for (let i = 0; i < density.length; i += 1) {
      const value = density.charCodeAt(i)
      frame.data[i * 4] = value
      frame.data[i * 4 + 1] = value
      frame.data[i * 4 + 2] = value
      frame.data[i * 4 + 3] = 255
    }
    context.putImageData(frame, 0, 0)
  }, [panel])

  return <canvas ref={canvas} width={panel.columns} height={panel.rows} aria-hidden="true" />
}

function axisLabel(axis: DigitizedAxis) {
  return `${axis.label}${axis.unit ? `（${axis.unit === 's' ? '秒' : axis.unit}）` : ''}`
}

function Scale({ axis, kind, right = false }: { axis: DigitizedAxis; kind?: 'pitch' | 'intensity'; right?: boolean }) {
  const steps = axis.max === 5000 ? 5 : 4
  return <div className={`${styles.scale} ${right ? styles.rightScale : ''}`} data-kind={kind} aria-label={`${axisLabel(axis)}，${axis.min} 至 ${axis.max}`}>
    {Array.from({ length: steps + 1 }, (_, i) => <span key={i} style={{ top: `${i / steps * 100}%` }}>{number.format(axis.max - i / steps * (axis.max - axis.min))}</span>)}
  </div>
}

function Panel({ panel, rightAxisSlots }: { panel: DigitizedPanel; rightAxisSlots: number }) {
  const rightAxes = panel.rightAxes ?? []
  const waveform = panel.yAxis.unit === ''
  const layout = { gridTemplateColumns: `var(--axis-width) minmax(0,1fr)${rightAxisSlots ? ` repeat(${rightAxisSlots},var(--right-axis-width))` : ''}` } as CSSProperties
  return <div className={styles.panel} data-waveform={waveform || undefined}>
    <div className={styles.axisLabels}>
      <span>{axisLabel(panel.yAxis)}</span>
      {panel.label && <strong>{panel.label}</strong>}
      {rightAxes.length > 0 && <div className={styles.rightAxisLabels}>{rightAxes.map(axis => <span key={axis.kind} data-kind={axis.kind}>{axisLabel(axis)}</span>)}</div>}
    </div>
    <div className={styles.chart} style={layout}>
      <Scale axis={panel.yAxis} />
      <div className={styles.plot} style={{ aspectRatio: `${panel.columns} / ${panel.rows}` }}>
        <Density panel={panel} />
        <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
          {[250, 500, 750].map(p => <path key={p} d={`M${p},0V1000M0,${p}H1000`} className={styles.gridLine} vectorEffect="non-scaling-stroke" />)}
          {panel.traces.map(trace => <g key={trace.kind} data-kind={trace.kind}>{trace.paths.map((path, index) => <path key={index} d={path} />)}</g>)}
        </svg>
        {panel.segments && <div className={styles.segments}>{panel.segments.map(segment => <span key={`${segment.x}-${segment.label}`} style={{ left: `${segment.x / 10}%` }}>{segment.label}</span>)}</div>}
      </div>
      {rightAxes.map(axis => <Scale key={axis.kind} axis={axis} kind={axis.kind} right />)}
      <div className={styles.timeScale}>
        {[0, .25, .5, .75, 1].map(fraction => <span key={fraction} style={{ left: `${fraction * 100}%` }}>{number.format(panel.xAxis.min + fraction * (panel.xAxis.max - panel.xAxis.min))}</span>)}
      </div>
    </div>
    <p className={styles.timeLabel}>{axisLabel(panel.xAxis)}</p>
  </div>
}

export function ReferenceSpectrogram({ src }: { src: string }) {
  const [loaded, setLoaded] = useState<{ src: string; reference: DigitizedSpectrogram }>()
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let current = true
    setFailed(false)
    const filename = basename(src)
    const loader = LOADERS[filename]
    if (loader) loader().then(records => {
      if (current) setLoaded({ src, reference: records[filename] })
    }).catch(() => { if (current) setFailed(true) })
    return () => { current = false }
  }, [src, attempt])
  if (!hasReferenceSpectrogram(src)) return null
  const reference = loaded?.src === src ? loaded.reference : undefined
  if (!reference) return <div className={styles.loading}>{failed ? <><span>图表加载失败</span><button type="button" onClick={() => setAttempt(value => value + 1)}>重试</button></> : '图表加载中…'}</div>
  const kinds = new Set(reference.panels.flatMap(panel => panel.traces.map(trace => trace.kind)))
  if (reference.panels.some(panel => panel.yAxis.unit === '')) kinds.add('waveform')
  const hasSpectrum = reference.panels.some(panel => panel.yAxis.unit === 'Hz')
  const rightAxisSlots = Math.max(...reference.panels.map(panel => panel.rightAxes?.length ?? 0))

  return <div className={styles.reference} data-multiaxis={rightAxisSlots > 0 || undefined} role="img" aria-label={`${reference.title}；灰度表示时频能量，有色轨迹使用各自坐标轴。`}>
    <h4 className={styles.title}>{reference.title}</h4>
    {rightAxisSlots > 0 && <p className={styles.scrollHint}>左右滑动查看完整图表</p>}
    <div className={styles.chartScroll} tabIndex={rightAxisSlots > 0 ? 0 : undefined} role={rightAxisSlots > 0 ? 'region' : undefined} aria-label={rightAxisSlots > 0 ? `${reference.title}，可横向滚动` : undefined}>
      <div className={styles.panels}>{reference.panels.map((panel, index) => <Panel key={index} panel={panel} rightAxisSlots={rightAxisSlots} />)}</div>
    </div>
    <div className={styles.legend} aria-label="图例">
      {hasSpectrum && <span><i className={styles.densitySwatch} />时频能量</span>}
      {Array.from(kinds).map(kind => <span key={kind} data-kind={kind}><i />{TRACE_LABELS[kind]}{kind === 'pitch' || kind === 'intensity' ? ' · 右轴' : ''}</span>)}
    </div>
  </div>
}
