import { useId, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import styles from './VowelMap.module.css'

const VOWELS = [
  { symbol: 'i', word: '衣', f1: 300, f2: 2300, action: '舌位较高、靠前，嘴唇展开。' },
  { symbol: 'e', word: '欸', f1: 450, f2: 2000, action: '舌位前、半闭；与 i 比较开口。' },
  { symbol: 'a', word: '啊', f1: 800, f2: 1400, action: '舌位较低，开口较大。' },
  { symbol: 'o', word: '喔', f1: 500, f2: 900, action: '舌位靠后、半闭，嘴唇拢圆。' },
  { symbol: 'u', word: '乌', f1: 350, f2: 800, action: '舌位较高、靠后，嘴唇拢圆。' },
  { symbol: 'ü', word: '迂', f1: 300, f2: 1700, action: '保持 i 的前舌位，再把嘴唇拢圆。' },
] as const
const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value))
const xFor = (f2: number) => 82 + (2800 - f2) / 2200 * 482
const yFor = (f1: number) => 65 + (f1 - 200) / 800 * 242

export function VowelMap() {
  const id = useId()
  const svgRef = useRef<SVGSVGElement>(null)
  const [selected, setSelected] = useState(0)
  const [point, setPoint] = useState({ f1: 300, f2: 2300 })
  const [dragging, setDragging] = useState(false)
  const choose = (index: number) => { setSelected(index); setPoint({ f1: VOWELS[index].f1, f2: VOWELS[index].f2 }) }
  const move = (event: PointerEvent<SVGCircleElement>) => {
    const svg = svgRef.current
    if (!svg) return
    const matrix = svg.getScreenCTM()
    if (!matrix) return
    const cursor = svg.createSVGPoint()
    cursor.x = event.clientX; cursor.y = event.clientY
    const local = cursor.matrixTransform(matrix.inverse())
    setPoint({ f1: Math.round(clamp(200 + (local.y - 65) / 242 * 800, 200, 1000) / 10) * 10, f2: Math.round(clamp(2800 - (local.x - 82) / 482 * 2200, 600, 2800) / 10) * 10 })
  }
  const keyMove = (event: KeyboardEvent<SVGCircleElement>) => {
    const change = { ArrowLeft: [0, 50], ArrowRight: [0, -50], ArrowUp: [-25, 0], ArrowDown: [25, 0] }[event.key]
    if (!change) return
    event.preventDefault()
    setPoint(old => ({ f1: clamp(old.f1 + change[0], 200, 1000), f2: clamp(old.f2 + change[1], 600, 2800) }))
  }
  return <section className={styles.lab} aria-label="元音 F1 F2 空间交互图">
    <div className={styles.presets} aria-label="元音对照">{VOWELS.map((vowel, index) => <button type="button" key={vowel.symbol} aria-pressed={selected === index} onClick={() => choose(index)}>{vowel.symbol}<small>{vowel.word}</small></button>)}<button type="button" onClick={() => choose(selected)}>复位</button></div>
    <p className={styles.action}>{VOWELS[selected].action}</p>
    <p className={styles.scrollHint}>左右滑动查看完整元音图</p>
    <div className={styles.plot} tabIndex={0} aria-label="元音空间，可左右滚动"><svg ref={svgRef} viewBox="0 0 640 395" role="group" aria-labelledby={`${id}-title ${id}-desc`}>
      <title id={`${id}-title`}>元音的 F1 与 F2 空间</title><desc id={`${id}-desc`}>左侧 F2 高、右侧 F2 低；上方 F1 低、下方 F1 高。选中点可拖动，也可用方向键移动。</desc>
      <rect x="82" y="65" width="482" height="242" rx="4" className={styles.background} />
      {[200, 400, 600, 800, 1000].map(f1 => <g key={f1}><path className={styles.grid} d={`M82 ${yFor(f1)}H564`} /><text x="69" y={yFor(f1) + 5} textAnchor="end">{f1}</text></g>)}
      {[2800, 2200, 1600, 1000, 600].map(f2 => <g key={f2}><path className={styles.grid} d={`M${xFor(f2)} 65V307`} /><text x={xFor(f2)} y="333" textAnchor="middle">{f2}</text></g>)}
      <text x="82" y="28" className={`${styles.f2Text} ${styles.fullLabel}`}>← F2 较高 · 前元音</text><text x="564" y="28" textAnchor="end" className={`${styles.f2Text} ${styles.fullLabel}`}>后元音 · F2 较低 →</text>
      <text x="82" y="28" className={`${styles.f2Text} ${styles.compactLabel}`}>前 · F2 高</text><text x="564" y="28" textAnchor="end" className={`${styles.f2Text} ${styles.compactLabel}`}>后 · F2 低</text>
      <text x="16" y="110" className={styles.f1Text}>闭</text><text x="16" y="290" className={styles.f1Text}>开</text>
      <text x="565" y="365" textAnchor="end">F2（Hz）</text><text x="35" y="52" className={styles.f1Text}>F1（Hz）</text>
      {VOWELS.map((vowel, index) => <g key={vowel.symbol} className={styles.reference} opacity={selected === index ? .35 : 1}><circle cx={xFor(vowel.f2)} cy={yFor(vowel.f1)} r="16" /><text x={xFor(vowel.f2)} y={yFor(vowel.f1) + 5} textAnchor="middle">{vowel.symbol}</text></g>)}
      <path className={styles.crosshair} d={`M82 ${yFor(point.f1)}H${xFor(point.f2)}V307`} />
      <circle className={styles.point} cx={xFor(point.f2)} cy={yFor(point.f1)} r="19" tabIndex={0} role="button" aria-label={`探索点：F1 ${point.f1} Hz，F2 ${point.f2} Hz。方向键移动`} onKeyDown={keyMove}
        onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); setDragging(true); move(event) }} onPointerMove={event => { if (dragging) move(event) }} onPointerUp={() => setDragging(false)} onPointerCancel={() => setDragging(false)} />
      <text className={styles.pointText} x={xFor(point.f2)} y={yFor(point.f1) + 5} textAnchor="middle">{VOWELS[selected].symbol}</text>
    </svg></div>
    <div className={styles.adjustments}>
      <label htmlFor={`${id}-f1`}>F1 · 开闭 <output>{point.f1} Hz</output><input id={`${id}-f1`} type="range" min="200" max="1000" step="25" value={point.f1} onChange={event => setPoint(old => ({ ...old, f1: Number(event.target.value) }))} /></label>
      <label htmlFor={`${id}-f2`}>F2 · 前后 <output>{point.f2} Hz</output><input id={`${id}-f2`} type="range" min="600" max="2800" step="50" value={point.f2} onChange={event => setPoint(old => ({ ...old, f2: Number(event.target.value) }))} /></label>
    </div>
    <p className={styles.caption}>图中为典型元音的示意位置。选择 i → a 观察开闭，选择 i → u 比较前后与唇形；拖动实心点探索相邻位置。</p>
  </section>
}
