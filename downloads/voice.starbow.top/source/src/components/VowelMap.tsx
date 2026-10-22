import { useId, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent } from 'react'
import { ANATOMY_VOWELS, anatomyFrequencies, anatomyPositionForFormants, anatomyVowelReference, type FormantPoint } from '../utils/anatomyAcoustics'
import styles from './VowelMap.module.css'

interface VowelMapProps {
  value?: FormantPoint
  vowel?: string
  onChange?: (point: FormantPoint) => void
  onVowelChange?: (vowel: string) => void
  embedded?: boolean
}
const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value))
// 在动作可达范围外留出坐标边距，极限位置的拖动点仍不遮挡刻度。
const xFor = (f2: number) => 82 + (3900 - f2) / 3700 * 514
const yFor = (f1: number) => 50 + f1 / 1500 * 260
const vowelSymbol = (vowel: string) => vowel === 'vowel-yu' ? 'ü' : vowel.replace('vowel-', '')

export function VowelMap({ value, vowel, onChange, onVowelChange, embedded = false }: VowelMapProps = {}) {
  const id = useId().replace(/:/g, '')
  const svgRef = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)
  const [localVowel, setLocalVowel] = useState('vowel-i')
  const [position, setPosition] = useState(ANATOMY_VOWELS['vowel-i'].position)
  const selected = vowel ?? localVowel
  const point = value ?? anatomyFrequencies(position)
  const reference = anatomyVowelReference(selected)
  const atReference = Math.abs(point.f1 - reference.f1) < 2 && Math.abs(point.f2 - reference.f2) < 2
  const change = (next: FormantPoint) => {
    if (onChange) onChange(next)
    else setPosition(old => anatomyPositionForFormants(old, next))
  }
  const choose = (key: string) => {
    if (onVowelChange) onVowelChange(key)
    else { setLocalVowel(key); setPosition(ANATOMY_VOWELS[key].position) }
  }
  const move = (event: PointerEvent<SVGCircleElement>) => {
    const svg = svgRef.current
    const matrix = svg?.getScreenCTM()
    if (!svg || !matrix) return
    const cursor = svg.createSVGPoint()
    cursor.x = event.clientX; cursor.y = event.clientY
    const local = cursor.matrixTransform(matrix.inverse())
    change({ f1: Math.round(clamp((local.y - 50) / 260 * 1500, 150, 1400)), f2: Math.round(clamp(3900 - (local.x - 82) / 514 * 3700, 400, 3700)) })
  }
  return <section className={styles.lab} data-embedded={embedded} aria-label="元音 F1 F2 空间交互图">
    {!embedded && <>
      <div className={styles.presets} aria-label="元音对照">{Object.entries(ANATOMY_VOWELS).map(([key, item]) => <button type="button" key={key} aria-pressed={selected === key} onClick={() => choose(key)}>{item.name}</button>)}<button type="button" onClick={() => choose(selected)}>复位</button></div>
      <p className={styles.action}>{ANATOMY_VOWELS[selected].action}</p>
    </>}
    <div className={styles.mapHeader}><h2>元音空间</h2><span>拖动实心点</span></div>
    <div className={styles.plot}><svg ref={svgRef} viewBox="0 0 640 377" role="group" aria-labelledby={`${id}-title ${id}-desc`}>
      <title id={`${id}-title`}>元音的 F1 与 F2 空间</title>
      <desc id={`${id}-desc`}>左侧 F2 高，右侧 F2 低；上方 F1 低、元音较闭，下方 F1 高、元音较开。实心点与舌位、下颌、唇形及频谱同步。</desc>
      <defs><linearGradient id={`${id}-field`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f0f5fc" /><stop offset="1" stopColor="#fff4f8" /></linearGradient></defs>
      <rect x="82" y="50" width="514" height="260" rx="8" className={styles.background} fill={`url(#${id}-field)`} />
      {[200, 400, 600, 800, 1000, 1200, 1400].map(f1 => <g key={f1}><path className={styles.grid} d={`M82 ${yFor(f1)}H596`} /><text x="72" y={yFor(f1) + 4} textAnchor="end">{f1}</text></g>)}
      {[3600, 2800, 2000, 1200, 400].map(f2 => <g key={f2}><path className={styles.grid} d={`M${xFor(f2)} 50V310`} /><text x={xFor(f2)} y="333" textAnchor="middle">{f2}</text></g>)}
      <text x="82" y="25" className={styles.f2Text}>← F2 高 · 偏前</text><text x="596" y="25" textAnchor="end" className={styles.f2Text}>偏后 · F2 低 →</text>
      <text x="10" y="83" textAnchor="middle" className={styles.f1Text}>闭</text><text x="10" y="295" textAnchor="middle" className={styles.f1Text}>开</text>
      <text x="596" y="361" textAnchor="end">F2 (Hz)</text><text x="8" y="42" className={`${styles.f1Text} ${styles.axisTitle}`}>F1 (Hz)</text>
      {Object.entries(ANATOMY_VOWELS).map(([key, item]) => {
        const reference = anatomyVowelReference(key)
        return <g key={key} className={styles.reference} data-selected={selected === key}>
          <circle cx={xFor(reference.f2)} cy={yFor(reference.f1)} r="17" role="button" tabIndex={0} aria-label={`选择 ${item.name} 参考`} onClick={() => choose(key)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(key) } }} />
          <text x={xFor(reference.f2)} y={yFor(reference.f1) + 5} textAnchor="middle">{vowelSymbol(key)}</text>
        </g>
      })}
      <path className={styles.crosshair} d={`M82 ${yFor(point.f1)}H${xFor(point.f2)}V310`} />
      <circle className={styles.point} data-testid="vowel-current-point" cx={xFor(point.f2)} cy={yFor(point.f1)} r="20" role="img" aria-label={`当前点：F1 ${point.f1} Hz，F2 ${point.f2} Hz`}
        onPointerDown={event => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); dragging.current = true; move(event) }} onPointerMove={event => { if (dragging.current) move(event) }} onPointerUp={() => { dragging.current = false }} onPointerCancel={() => { dragging.current = false }} onLostPointerCapture={() => { dragging.current = false }} />
      <text className={styles.pointText} x={xFor(point.f2)} y={yFor(point.f1) + 5} textAnchor="middle">{atReference ? vowelSymbol(selected) : '+'}</text>
    </svg></div>
    {!embedded && <div className={styles.adjustments}>
      <label htmlFor={`${id}-f1`}>F1 · 开闭 <output>{point.f1} Hz</output><input id={`${id}-f1`} type="range" min="150" max="1400" step="1" value={point.f1} style={{ '--range-progress': `${(point.f1 - 150) / 1250 * 100}%` } as CSSProperties} onChange={event => change({ ...point, f1: Number(event.target.value) })} /></label>
      <label htmlFor={`${id}-f2`}>F2 · 前后 <output>{point.f2} Hz</output><input id={`${id}-f2`} type="range" min="400" max="3700" step="1" value={point.f2} style={{ '--range-progress': `${(point.f2 - 400) / 3300 * 100}%` } as CSSProperties} onChange={event => change({ ...point, f2: Number(event.target.value) })} /></label>
    </div>}
    <p className={styles.caption}>空心点为元音参考，实心点为当前状态，虚线标出对应的 F1、F2。</p>
  </section>
}
