import { useId, useState, type CSSProperties } from 'react'
import { anatomyFrequencies, anatomyPositionForFormants, anatomyVowelReference, ANATOMY_VOWELS, isAnatomyPartRelevant, type AnatomyPositionKey, type FormantPoint } from '../utils/anatomyAcoustics'
import { AnatomySpectrum } from './AnatomySpectrum'
import { VocalTractDiagram } from './VocalTractDiagram'
import { VowelMap } from './VowelMap'
import styles from './AnatomyExplorer.module.css'

export type AnatomyFocus = 'all' | 'f0' | 'f1' | 'f2'
const CONTROLS: readonly { key: AnatomyPositionKey; label: string; ends: readonly [string, string]; focus: AnatomyFocus; effect: string; mechanism: string }[] = [
  { key: 'tension', label: '声带调节', ends: ['较低音高', '较高音高'], focus: 'f0', effect: 'F0 ↑', mechanism: '环甲肌、甲杓肌等协同调节声带的纵向伸展、刚度和参与振动的组织，使 F0 变化；提高音高不需要挤喉或用力夹紧声门。' },
  { key: 'larynx', label: '喉位', ends: ['低', '高'], focus: 'f2', effect: 'F1、F2 ↑', mechanism: '喉部上移，声道缩短，多个共振峰趋高。' },
  { key: 'tongueFront', label: '舌位前后', ends: ['后', '前'], focus: 'f2', effect: 'F2 ↑', mechanism: '舌体前移，声道收窄位置改变，F2 通常升高。' },
  { key: 'tongueHeight', label: '舌位高低', ends: ['低', '高'], focus: 'f1', effect: 'F1 ↓', mechanism: '舌面抬高，元音趋闭，F1 通常降低。' },
  { key: 'lips', label: '圆唇程度', ends: ['展唇', '圆唇'], focus: 'f2', effect: 'F1、F2 ↓', mechanism: '嘴唇拢圆并前突，声道出口延长，共振峰趋低。' },
  { key: 'jaw', label: '下颌开度', ends: ['小', '大'], focus: 'f1', effect: 'F1 ↑', mechanism: '下颌下降，开口增大，与舌高共同影响 F1。' },
]

export function AnatomyExplorer({ initialFocus = 'all' }: { initialFocus?: AnatomyFocus }) {
  const id = useId().replace(/:/g, '')
  const [focus, setFocus] = useState<AnatomyFocus>(initialFocus)
  const [vowel, setVowel] = useState('vowel-a')
  const [position, setPosition] = useState(ANATOMY_VOWELS['vowel-a'].position)
  const [hoveredPart, setHoveredPart] = useState<AnatomyPositionKey>()
  const [focusedPart, setFocusedPart] = useState<AnatomyPositionKey>()
  const [limited, setLimited] = useState(false)
  const reference = anatomyVowelReference(vowel)
  const current = anatomyFrequencies(position)
  const active = hoveredPart ?? focusedPart
  const activeControl = CONTROLS.find(control => control.key === active)
  const preset = (key: string) => {
    setVowel(key)
    setPosition(ANATOMY_VOWELS[key].position)
    setLimited(false)
  }
  const changeMap = (point: FormantPoint) => {
    const next = anatomyPositionForFormants(position, point)
    const result = anatomyFrequencies(next)
    setPosition(next)
    setLimited(Math.abs(result.f1 - point.f1) > 3 || Math.abs(result.f2 - point.f2) > 3)
  }

  return <section className={styles.explorer} data-focus={focus} aria-label="发声部位交互图">
    <div className={styles.presets} aria-label="元音参考选择">
      <span>元音参考</span>
      {Object.entries(ANATOMY_VOWELS).map(([key, item]) => <button key={key} type="button" aria-pressed={vowel === key} onClick={() => preset(key)}>{item.name}</button>)}
      <button className={styles.reset} type="button" onClick={() => preset(vowel)}>复位</button>
    </div>
    <div className={styles.workbench}>
      <div className={styles.diagram}>
        <div className={styles.panelHeading}><h2>发声结构</h2><span>矢状剖视</span></div>
        <VocalTractDiagram position={position} active={active} onActiveChange={setHoveredPart} focus={focus} />
      </div>
      <div className={styles.controls}>
        <div className={styles.controlToolbar}>
          <div className={styles.panelHeading}><h2>调整发声部位</h2></div>
          <div className={styles.focusBar} aria-label="按声音要素查看部位">
            {(['all', 'f0', 'f1', 'f2'] as const).map(item => <button key={item} type="button" aria-pressed={focus === item} onClick={() => setFocus(item)}>{item === 'all' ? '全部部位' : item.toUpperCase()}</button>)}
          </div>
        </div>
        <div className={styles.controlGrid}>
          {CONTROLS.map(control => <div key={control.key} className={styles.control} data-active={active === control.key} data-control-focus={control.focus} data-highlighted={isAnatomyPartRelevant(control.key, focus)} onPointerEnter={() => setHoveredPart(control.key)} onPointerLeave={() => setHoveredPart(undefined)}>
            <label htmlFor={`${id}-${control.key}`}>{control.label}<span>{control.effect}</span></label>
            <input id={`${id}-${control.key}`} type="range" min="0" max="100" step="0.1" value={position[control.key]} style={{ '--range-progress': `${position[control.key]}%` } as CSSProperties} aria-label={control.label} aria-valuetext={`${control.label}：${Math.round(position[control.key])}，从${control.ends[0]}到${control.ends[1]}的相对位置`} aria-describedby={`${id}-mechanism`} onFocus={() => setFocusedPart(control.key)} onBlur={() => setFocusedPart(undefined)} onChange={event => { setLimited(false); setPosition(old => ({ ...old, [control.key]: Number(event.target.value) })) }} />
            <div className={styles.sliderEnds}><span>{control.ends[0]}</span><span>{control.ends[1]}</span></div>
          </div>)}
        </div>
        <p id={`${id}-mechanism`} className={styles.mechanism}>{activeControl ? <><strong>{activeControl.label}</strong>{activeControl.mechanism}</> : 'F1 主要反映元音开闭；F2 同时受舌位前后、圆唇和声道长度影响。悬停部位或滑块可查看其作用。'}</p>
        <div className={styles.readoutHeading}>声音数值<span>参考 → 当前 · Hz</span></div>
        <div className={styles.frequencyReadouts}>{(['f0', 'f1', 'f2'] as const).map(frequency => <div key={frequency} className={styles.frequencyReadout} data-frequency={frequency} data-testid={`anatomy-${frequency}-readout`}>
          <strong>{frequency.toUpperCase()}</strong><span>{reference[frequency]} → <b>{current[frequency]}</b></span>
        </div>)}</div>
      </div>
    </div>
    <div className={styles.results}>
      <div className={styles.vowelPanel}>
        <VowelMap value={current} vowel={vowel} onChange={changeMap} onVowelChange={preset} embedded />
        {limited && <p className={styles.reachNote} role="status">已到达当前喉位与唇形下的动作边界；调整圆唇或喉位可继续探索。</p>}
      </div>
      <div className={styles.acoustics} aria-label="动作对应的频率变化">
        <div className={styles.panelHeading}><h2>声音频谱</h2><span>声源与共振</span></div>
        <AnatomySpectrum reference={reference} current={current} />
      </div>
    </div>
    <details className={styles.sources}><summary>模型说明与参考</summary><p>剖视图对鼻中隔作透明处理，并把喉软骨与声带层面投影显示。元音参考取练习预设中心。动作与频率采用连续教学模型；「声带调节」合并了伸展、刚度与振动组织等因素，不代表用力程度。模型中的 F0 独立于声道，元音本身不限定音高。实际肌肉协调与声学关系更复杂，滑块数值不代表个人正常值或实测结果。</p><ul><li><a href="https://sail.usc.edu/~lgoldste/General_Phonetics/Source_Filter/SFc.html" target="_blank" rel="noreferrer">USC：舌位与元音的 F1、F2</a></li><li><a href="https://www.phys.unsw.edu.au/jw/voice.html" target="_blank" rel="noreferrer">UNSW：声源、声道与共振</a></li><li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC4503663/" target="_blank" rel="noreferrer">Lammert 与 Narayanan：声道长度与形状</a></li></ul></details>
  </section>
}
