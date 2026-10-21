import { useId, useState } from 'react'
import styles from './SourceFilterLab.module.css'

const VOWELS = { i: [300, 2300], a: [800, 1400], u: [350, 800] } as const
const WIDTH = 660
const X = (hz: number) => 56 + hz / 3500 * 568
// 用两个共振峰的钟形包络演示滤波过程，数值只用于图示。
function envelope(hz: number, f1: number, f2: number) {
  return .08 + .9 * Math.exp(-(((hz - f1) / 190) ** 2)) + .75 * Math.exp(-(((hz - f2) / 260) ** 2))
}

export function SourceFilterLab() {
  const id = useId()
  const [f0, setF0] = useState(180)
  const [f1, setF1] = useState(800)
  const [f2, setF2] = useState(1400)
  const harmonics = Array.from({ length: Math.floor(3500 / f0) }, (_, index) => (index + 1) * f0)
  const path = Array.from({ length: 176 }, (_, index) => {
    const hz = index * 20
    return `${index ? 'L' : 'M'}${X(hz).toFixed(1)},${(292 - envelope(hz, f1, f2) * 111).toFixed(1)}`
  }).join(' ')
  const preset = (vowel: keyof typeof VOWELS) => { setF1(VOWELS[vowel][0]); setF2(VOWELS[vowel][1]) }
  return <section className={styles.lab} aria-label="声源与滤波器交互实验">
    <div className={styles.flow}><span><b>声源</b>声带振动 · F0</span><strong aria-hidden="true">→</strong><span><b>滤波器</b>声道共振 · F1 / F2</span><strong aria-hidden="true">→</strong><span><b>输出</b>被增强的泛音</span></div>
    <div className={styles.controls}>
      <label htmlFor={`${id}-f0`}>F0 · 泛音间隔 <output>{f0} Hz</output><input id={`${id}-f0`} type="range" min="80" max="320" step="5" value={f0} onChange={event => setF0(Number(event.target.value))} /></label>
      <label htmlFor={`${id}-f1`}>F1 · 第一共振峰 <output>{f1} Hz</output><input id={`${id}-f1`} type="range" min="200" max={Math.min(1000, f2 - 200)} step="25" value={f1} onChange={event => setF1(Math.min(Number(event.target.value), f2 - 200))} /></label>
      <label htmlFor={`${id}-f2`}>F2 · 第二共振峰 <output>{f2} Hz</output><input id={`${id}-f2`} type="range" min={Math.max(650, f1 + 200)} max="2800" step="25" value={f2} onChange={event => setF2(Math.max(Number(event.target.value), f1 + 200))} /></label>
    </div>
    <div className={styles.presets}><span>声道对照</span>{(['i', 'a', 'u'] as const).map(vowel => <button type="button" key={vowel} onClick={() => preset(vowel)}>{vowel}（{vowel === 'i' ? '衣' : vowel === 'a' ? '啊' : '乌'}）</button>)}<button type="button" onClick={() => { setF0(180); preset('a') }}>复位</button></div>
    <p className={styles.scrollHint}>左右滑动查看完整频谱</p>
    <div className={styles.plot} tabIndex={0} aria-label="声源频谱，可左右滚动"><svg viewBox={`0 0 ${WIDTH} 375`} role="img" aria-labelledby={`${id}-title ${id}-desc`}>
      <title id={`${id}-title`}>声源泛音与声道共振的示意频谱</title><desc id={`${id}-desc`}>上排泛音相隔 {f0} Hz；下排泛音经 F1 {f1} Hz、F2 {f2} Hz 的包络增强。</desc>
      {[0, 1000, 2000, 3000].map(hz => <g key={hz}><path className={styles.grid} d={`M${X(hz)} 40V302`} /><text x={X(hz)} y="328" textAnchor="middle">{hz}</text></g>)}
      <text x="56" y="25" className={styles.sourceLabel}>声源：等间距的泛音</text><text x="56" y="158">输出：共振峰附近的泛音更强</text>
      <path className={styles.axis} d="M56 122H624M56 292H624" />
      {harmonics.map((hz, index) => <g key={hz}><path className={styles.source} data-testid="source-harmonic" d={`M${X(hz)} 122V${122 - 64 / (1 + index * .08)}`} /><path className={styles.output} data-testid="output-harmonic" d={`M${X(hz)} 292V${292 - envelope(hz, f1, f2) * 100}`} /></g>)}
      <path className={styles.envelope} data-testid="filter-envelope" d={path} />
      <path className={styles.f1} d={`M${X(f1)} 190V298`} /><path className={styles.f2} d={`M${X(f2)} 190V298`} />
      <text x={X(f1)} y="189" textAnchor="middle" className={styles.f1Text}>F1</text><text x={X(f2)} y="189" textAnchor="middle" className={styles.f2Text}>F2</text><text x="625" y="369" textAnchor="end">频率（Hz）</text>
    </svg></div>
    <p className={styles.explanation}>先只调 F0，观察泛音的间距；再保持 F0 不变，切换元音，观察哪些泛音被增强。曲线为共振示意。</p>
  </section>
}
