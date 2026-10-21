import { useId, useState } from 'react'
import { anatomyFrequencies, anatomyVowelReference, ANATOMY_VOWELS, type AnatomyPosition, type AnatomyPositionKey } from '../utils/anatomyAcoustics'
import { AnatomySpectrum } from './AnatomySpectrum'
import styles from './AnatomyExplorer.module.css'

export type AnatomyFocus = 'all' | 'f0' | 'f1' | 'f2'
type PositionKey = AnatomyPositionKey
function tongueShape(position: AnatomyPosition) {
  const front = (position.tongueFront - 50) * .38
  const height = (position.tongueHeight - 45) * .45
  const jawY = (position.jaw - 35) * .23
  return `M224 ${281 + jawY} C215 251 ${218 + front} ${221 - height} ${261 + front} ${211 - height} C${293 + front} ${193 - height} 327 ${202 + jawY * .25} 363 ${207 + jawY * .4} Q368 ${215 + jawY * .4} 348 ${222 + jawY} C301 ${244 + jawY} 273 ${258 + jawY} 262 ${282 + jawY} Z`
}
const CONTROLS: readonly { key: PositionKey; label: string; ends: readonly [string, string]; focus: AnatomyFocus; effect: string; mechanism: string }[] = [
  { key: 'tension', label: '声带张力', ends: ['较低', '较高'], focus: 'f0', effect: 'F0 ↑', mechanism: '声带拉长、张力增加 → 振动趋快' },
  { key: 'larynx', label: '喉位', ends: ['较低', '较高'], focus: 'f2', effect: 'F1、F2 ↑', mechanism: '喉部上移 → 声道缩短 → 共振频率趋高' },
  { key: 'tongueFront', label: '舌位前后', ends: ['靠后', '靠前'], focus: 'f2', effect: 'F2 ↑', mechanism: '舌体前移 → 口腔收窄位置前移 → F2 常升高' },
  { key: 'tongueHeight', label: '舌位高低', ends: ['较低', '较高'], focus: 'f1', effect: 'F1 ↓', mechanism: '舌面抬高 → 元音趋闭 → F1 常降低' },
  { key: 'lips', label: '圆唇程度', ends: ['展开', '圆唇'], focus: 'f2', effect: 'F1、F2 ↓', mechanism: '圆唇前突 → 声道末端延长、出口收拢 → 共振频率趋低' },
  { key: 'jaw', label: '下颌开度', ends: ['较小', '较大'], focus: 'f1', effect: 'F1 ↑', mechanism: '下颌下降 → 开口增大 → F1 常升高' },
]
const FOCUS_TEXT: Record<AnatomyFocus, string> = {
  all: '先找声带，再沿气流向上看咽腔、舌面、口腔和嘴唇。改变这些部位，会改变声源或声道的形状。',
  f0: 'F0 主要来自声带周期性振动。右下方是声带俯视图；调节张力，观察声带的拉长方向。',
  f1: 'F1 与元音开闭有关。对照舌面高低和下颌开度：i 较闭，a 较开。',
  f2: 'F2 与元音前后、唇形和声道整体形状有关。对照舌体前后、圆唇与喉位，分别观察它们改变了哪里。',
}

export function AnatomyExplorer({ initialFocus = 'all' }: { initialFocus?: AnatomyFocus }) {
  const id = useId().replace(/:/g, '')
  const [focus, setFocus] = useState<AnatomyFocus>(initialFocus)
  const [vowel, setVowel] = useState('vowel-a')
  const [position, setPosition] = useState(ANATOMY_VOWELS['vowel-a'].position)
  const [active, setActive] = useState<PositionKey>(CONTROLS.find(control => initialFocus === 'all' || control.focus === initialFocus)!.key)
  const [showReference, setShowReference] = useState(true)
  const reference = anatomyVowelReference(vowel)
  const current = anatomyFrequencies(position, vowel)
  const baseline = ANATOMY_VOWELS[vowel].position
  const baselineJawY = (baseline.jaw - 35) * .23
  const availableControls = CONTROLS.filter(control => focus === 'all' || control.focus === focus)
  const activeControl = availableControls.find(control => control.key === active) ?? availableControls[0]
  const front = (position.tongueFront - 50) * .38
  const height = (position.tongueHeight - 45) * .45
  const larynxY = (50 - position.larynx) * .42
  const jawY = (position.jaw - 35) * .23
  const lipX = position.lips * .12
  const lipClosure = (position.lips - 15) * .07
  const upperLipY = 182 + lipClosure
  const lowerLipY = 211 + jawY - lipClosure
  const tonguePath = tongueShape(position)
  const noteFor = (key: PositionKey) => {
    const n = position[key]
    if (key === 'tension') return n > 60 ? '张力增加，声带拉长：振动趋快，F0 趋高。' : n < 30 ? '张力减小：振动趋慢，F0 趋低。' : '声带张力控制振动快慢；与上方声道形状分别观察。'
    if (key === 'larynx') return n > 65 ? '喉位升高：咽部声道缩短，多个共振峰可能上移。' : n < 35 ? '喉位降低：咽部声道延长，音色随之变化。' : '喉部位于舌骨下方，声带在喉部内部。'
    if (key === 'tongueFront') return n > 65 ? '舌体靠前：向前元音方向变化，F2 往往升高。' : n < 35 ? '舌体靠后：向后元音方向变化，F2 往往降低。' : '前后移动舌体，改变口腔与咽腔的收窄位置。'
    if (key === 'tongueHeight') return n > 65 ? '舌面较高：向闭元音方向变化，F1 往往降低。' : n < 30 ? '舌面较低：向开元音方向变化，F1 往往升高。' : '舌面高低与下颌开度共同塑造元音。'
    if (key === 'lips') return n > 60 ? '圆唇与前突：出口收拢、声道末端延长，共振峰常下移。' : '嘴唇较展开：声道出口较短，试着与圆唇比较。'
    return n > 65 ? '下颌下降、开口增大：F1 常升高，同时留意舌面的位置。' : n < 25 ? '下颌开度减小：口腔前端收窄，元音趋闭。' : '下颌是舌与口唇动作的支点，保持它能够灵活活动。'
  }
  const preset = (name: string) => {
    setVowel(name)
    setPosition(ANATOMY_VOWELS[name].position)
  }
  return <section className={styles.explorer} data-focus={focus} aria-label="发声部位交互图">
    <div className={styles.focusBar} aria-label="按声音要素查看部位">
      {(['all', 'f0', 'f2', 'f1'] as const).map(item => <button key={item} type="button" aria-pressed={focus === item} onClick={() => { setFocus(item); setActive(CONTROLS.find(control => item === 'all' || control.focus === item)!.key) }}>{item === 'all' ? '全部部位' : item.toUpperCase()}</button>)}
    </div>
    <p className={styles.focusText}>{FOCUS_TEXT[focus]}</p>
    <div className={styles.presets} aria-label="元音参考选择"><span>元音参考</span>{Object.entries(ANATOMY_VOWELS).map(([key, item]) => <button key={key} type="button" aria-pressed={vowel === key} onClick={() => preset(key)}>{item.name}</button>)}<button type="button" onClick={() => setPosition(baseline)}>复位</button><label className={styles.referenceToggle}><input type="checkbox" checked={showReference} onChange={event => setShowReference(event.target.checked)} />参考轮廓</label></div>
    <div className={styles.diagramLayout}>
      <div className={styles.diagram}>
        <svg viewBox="0 0 580 440" role="img" aria-labelledby={`${id}-title ${id}-desc`}>
          <title id={`${id}-title`}>侧面声道与声带俯视示意</title>
          <desc id={`${id}-desc`}>气流由气管经过声带，沿咽腔进入口腔。舌、喉位、口唇与下颌随下方控件移动。</desc>
          <defs>
            <marker id={`${id}-arrow`} markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto"><path d="M0 0L6 3.5L0 7" fill="none" stroke="#6d9fb6" strokeWidth="1.2" /></marker>
            <marker id={`${id}-motion`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto-start-reverse"><path d="M0 0L6 3L0 6Z" fill="#5f5689" /></marker>
          </defs>
          <path className={styles.head} d={`M164 402 L169 310 Q124 285 117 227 Q100 158 126 105 Q153 43 224 31 Q308 18 348 73 Q369 101 366 126 L395 154 Q405 164 384 172 L369 176 L${380 + lipX} ${upperLipY - 2} Q${389 + lipX} ${upperLipY + 4} ${374 + lipX} ${upperLipY + 9} L${380 + lipX} ${lowerLipY + 4} Q${384 + lipX} ${lowerLipY + 13} 369 ${230 + jawY} Q365 ${270 + jawY} 337 ${281 + jawY} L308 299 L311 402 Z`} />
          <path className={styles.nasal} d="M201 159 Q183 111 220 99 Q286 79 331 126 L359 158 Q335 146 307 150 L233 161 Z" />
          <path className={styles.airway} d={`M206 157 Q180 204 190 262 L205 ${327 + larynxY} L241 ${327 + larynxY} Q219 268 231 241 Q254 218 308 214 L${377 + lipX} ${lowerLipY} L${378 + lipX} ${upperLipY} Q325 164 263 164 L230 175 Z`} />
          <path className={styles.palate} d="M358 175 Q295 152 245 166 L229 171 Q216 180 220 196" />
          <path className={styles.jaw} d={`M365 ${231 + jawY} Q336 ${289 + jawY} 272 ${286 + jawY} L218 ${259 + jawY}`} />
          {(focus === 'f2' || active === 'lips') && <path className={styles.lipHighlight} data-testid="anatomy-lips" d={`M369 176 L${380 + lipX} ${upperLipY - 2} Q${389 + lipX} ${upperLipY + 4} ${374 + lipX} ${upperLipY + 9} M${380 + lipX} ${lowerLipY + 4} Q${384 + lipX} ${lowerLipY + 13} 369 ${230 + jawY}`} />}
          <path className={styles.tongue} data-focused={focus === 'f1' || focus === 'f2'} data-testid="anatomy-tongue" d={tonguePath} />
          {showReference && <g className={styles.reference} aria-hidden="true" data-testid="anatomy-reference"><path d={tongueShape(baseline)} /><path d="M200 314 Q216 307 241 314 L247 342 Q225 353 204 343 Z" /><path d={`M365 ${231 + baselineJawY} Q336 ${289 + baselineJawY} 272 ${286 + baselineJawY} L218 ${259 + baselineJawY}`} /></g>}
          <path className={styles.tongueDetail} d={`M235 ${270 + jawY} Q264 ${247 - height * .4} ${291 + front} ${223 - height * .6}`} />
          <path className={styles.hyoid} transform={`translate(0 ${larynxY * .55})`} d="M260 286 Q268 300 282 290" />
          <path className={styles.epiglottis} transform={`translate(0 ${larynxY * .4})`} d="M236 309 Q236 294 225 280 Q217 273 218 286 Q217 298 229 308" />
          <path className={styles.esophagus} d="M174 275L174 400M184 283L184 400" />
          <g transform={`translate(0 ${larynxY})`} data-testid="anatomy-larynx" data-focused={focus === 'f0' || focus === 'f2'}>
            <path className={styles.larynx} d="M200 314 Q216 307 241 314 L247 342 Q225 353 204 343 Z" />
            <path className={styles.folds} d="M207 328L238 328" />
          </g>
          <path className={styles.trachea} d={`M211 ${346 + larynxY} L211 405 M240 ${346 + larynxY} L240 405`} />
          {[365, 377, 389, 401].map(y => <path key={y} className={styles.tracheaRing} d={`M212 ${y} Q225 ${y + 4} 239 ${y}`} />)}
          <path className={styles.flow} d={`M224 392 L224 ${355 + larynxY} M215 ${302 + larynxY} Q197 261 206 222 M239 ${185 - height * .18}Q291 ${173 - height * .13} 346 ${185 + jawY * .15}`} markerEnd={`url(#${id}-arrow)`} />
          <g className={styles.motion} markerStart={`url(#${id}-motion)`} markerEnd={`url(#${id}-motion)`} aria-hidden="true">
            {active === 'larynx' && <path d="M256 310V352" />}
            {active === 'tongueFront' && <path d={`M266 ${224 - height}H306`} />}
            {active === 'tongueHeight' && <path d={`M${270 + front} 180V220`} />}
            {active === 'jaw' && <path d="M350 251V284" />}
            {active === 'lips' && <path d="M377 205H412" />}
            {active === 'tension' && <path d="M531 363V406" />}
          </g>
          <g className={styles.labels}>
            <path d={`M270 123L219 82H79M196 224L136 124H79M300 166L346 123H414M220 186L158 166H79M${271 + front} ${210 - height}L303 248H414M228 ${270 + jawY}L139 246H79M274 ${292 + larynxY * .55}L322 314H414M227 ${289 + larynxY * .4}L150 294H79`} />
            <text x="22" y="86">鼻腔</text><text x="22" y="128">咽腔</text><text x="420" y="127">硬腭</text><text x="22" y="170">软腭</text><text x="420" y="252">舌面</text><text x="22" y="250">舌根</text><text x="420" y="318">舌骨</text><text x="22" y="298">会厌</text>
            <path d={`M${382 + lipX} 197L430 180H466 M${351} ${260 + jawY}L401 279H450 M219 ${328 + larynxY}L175 341H160 M224 389L155 390H100`} />
            <text x="470" y="184">嘴唇</text><text x="454" y="283">下颌</text><text x="22" y="345">喉部／声带</text><text x="22" y="394">气管</text>
          </g>
          <g transform="translate(430 336)">
            <rect className={styles.inset} x="-8" y="-9" width="132" height="100" rx="10" />
            <text className={styles.insetLabel} x="3" y="8">声带俯视</text>
            <path className={styles.foldBody} d={`M53 25 Q${28 - position.tension * .07} 45 25 73 Q50 83 53 25 M57 25 Q${82 + position.tension * .07} 45 85 73 Q60 83 57 25`} />
            <path className={styles.foldEdge} data-focused={focus === 'f0'} d={`M53 ${29 - position.tension * .06}L53 ${68 + position.tension * .06} M57 ${29 - position.tension * .06}L57 ${68 + position.tension * .06}`} />
            <text className={styles.insetLabel} x="3" y="85">中缝为声门</text>
          </g>
        </svg>
        <p className={styles.caption}>蓝色为气流通道，虚线为所选元音的参考轮廓。</p>
      </div>
      <div className={styles.controls}>
        <div className={styles.partSelector} aria-label="选择要调整的部位">
          {availableControls.map(control => <button type="button" key={control.key} aria-pressed={activeControl.key === control.key} onClick={() => setActive(control.key)}>{control.label}</button>)}
        </div>
        {[activeControl].map(control => <div key={control.key} className={styles.control} data-active="true" data-control-focus={control.focus}>
          <label htmlFor={`${id}-${control.key}`}>{control.label}<span>向右：{control.effect}</span></label>
          <input id={`${id}-${control.key}`} type="range" min="0" max="100" value={position[control.key]} aria-valuetext={`${control.label}，${position[control.key] < 35 ? control.ends[0] : position[control.key] > 65 ? control.ends[1] : '中间位置'}，教学相对位置 ${position[control.key]}`} aria-describedby={`${id}-${control.key}-note`} onChange={event => setPosition(old => ({ ...old, [control.key]: Number(event.target.value) }))} />
          <div className={styles.sliderEnds}><span>{control.ends[0]}</span><span>{control.ends[1]}</span></div>
          <p id={`${id}-${control.key}-note`} aria-live="polite">{noteFor(control.key)}</p>
        </div>)}
        <div className={styles.acoustics} aria-label="动作对应的频率变化">
          <div className={styles.acousticHeading}><strong>{ANATOMY_VOWELS[vowel].name} · 参考 → 当前</strong><span>Hz</span></div>
          <div className={styles.frequencyReadouts}>{(['f0', 'f1', 'f2'] as const).map(frequency => <div key={frequency} className={styles.frequencyReadout} data-frequency={frequency} data-testid={`anatomy-${frequency}-readout`}>
            <strong>{frequency.toUpperCase()}</strong><span>{reference[frequency]} → <b>{current[frequency]}</b></span><output>{current[frequency] - reference[frequency] >= 0 ? '+' : ''}{current[frequency] - reference[frequency]} Hz</output>
          </div>)}</div>
          <AnatomySpectrum reference={reference} current={current} />
          <p className={styles.f0Explanation}>F0 {current.f0} Hz 是泛音间距；F1、F2 是包络上的共振峰。</p>
          <p className={styles.modelNote}>参考值沿用练习预设；F0 可独立调整，元音本身不限定音高。滑块与强度曲线为教学模型，不代表个人正常值或实测结果。</p>
        </div>
      </div>
    </div>
    <details className={styles.sources}><summary>原理与参考</summary><p>三个参考频率取应用内元音练习区间的中心，不是个人正常标准。解剖预设及滑块位移只按典型方向简化演示；指数位移、峰宽和相对强度为教学绘图参数，保留 F1、F2 的先后次序。真实发声中舌、下颌、喉和嘴唇会互相配合，不存在一个动作对应固定频率的换算；高音区还会出现声源与声道的耦合。</p><ul><li><a href="https://sail.usc.edu/~lgoldste/General_Phonetics/Source_Filter/SFc.html" target="_blank" rel="noreferrer">USC：舌位与元音的 F1、F2</a></li><li><a href="https://www.phys.unsw.edu.au/jw/voice.html" target="_blank" rel="noreferrer">UNSW：声带振动、声道长度与共振</a></li><li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC4503663/" target="_blank" rel="noreferrer">Lammert 与 Narayanan：唇形、喉位与声道长度</a></li></ul></details>
  </section>
}
