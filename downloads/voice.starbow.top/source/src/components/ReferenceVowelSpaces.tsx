import { useId } from 'react'
import {
  REFERENCE_VOWEL_SPACES,
  VOWEL_SPACE_AXES,
  VOWEL_SPACE_CONDITIONS,
  VOWEL_SPACE_OUTLINE,
  type ReferenceVowel,
} from '../content/referenceVowelSpaces'
import styles from './ReferenceVowelSpaces.module.css'

const basename = (src: string) => src.slice(src.lastIndexOf('/') + 1)

export function hasReferenceVowelSpace(src: string): boolean {
  return Object.prototype.hasOwnProperty.call(REFERENCE_VOWEL_SPACES, basename(src))
}

function VowelMarker({ vowel }: { vowel: ReferenceVowel }) {
  switch (vowel) {
    case 'æ': return <circle r="6.8" fill="currentColor" />
    case 'ʌ': return <path d="M-7-5H7L0 7Z" fill="currentColor" />
    case 'ɒ': return <path d="M-9 0H9M0-9V9" strokeWidth="2.7" />
    case 'ɜː': return <rect x="-6" y="-6" width="12" height="12" fill="currentColor" />
    case 'e':
    case 'ʊ': return <rect x="-6.5" y="-6.5" width="13" height="13" fill="white" strokeWidth="2.6" />
    case 'ɪ': return <path d="M0-8 8 0 0 8-8 0Z" fill="white" strokeWidth="2.6" />
    case 'iː': return <path d="M-9 0H9M0-9V9M-6.4-6.4 6.4 6.4M-6.4 6.4 6.4-6.4" strokeWidth="2.3" />
    case 'u': return <path d="M0-5.5 5.5 0 0 5.5-5.5 0Z" fill="currentColor" />
  }
}

export function ReferenceVowelSpaces({ src }: { src: string }) {
  const id = useId()
  const specification = REFERENCE_VOWEL_SPACES[basename(src)]
  if (!specification) return null

  const { traces } = specification
  const { f1Range, f2Range, f1Ticks, f2Ticks } = VOWEL_SPACE_AXES
  const plot = { left: 104, right: 900, top: 33, bottom: 742 }
  const x = (f2: number) => plot.left + (f2 - f2Range[0]) / (f2Range[1] - f2Range[0]) * (plot.right - plot.left)
  const y = (f1: number) => plot.bottom - (f1 - f1Range[0]) / (f1Range[1] - f1Range[0]) * (plot.bottom - plot.top)

  return <section className={styles.figure} aria-label={specification.title}>
    <div className={styles.heading}>
      <h4>{specification.title}</h4>
      <div className={styles.legendGroup}>
        <p className={styles.legendLabel}>声音修改条件</p>
        <ul className={styles.legend} aria-label="声音修改条件">
          {traces.map(trace => <li key={trace.condition} style={{ color: VOWEL_SPACE_CONDITIONS[trace.condition].color }}>
            <span aria-hidden="true" /><span>{VOWEL_SPACE_CONDITIONS[trace.condition].label}</span>
          </li>)}
        </ul>
      </div>
    </div>
    <p className={styles.scrollHint}>左右滑动查看完整图表</p>
    <div className={styles.viewport} tabIndex={0} role="region" aria-label={`${specification.title}图表，可横向滚动`}>
      <svg viewBox="0 0 960 848" className={styles.chart} role="img" aria-labelledby={`${id}-title ${id}-description`}>
        <title id={`${id}-title`}>{specification.title}</title>
        <desc id={`${id}-description`}>{specification.title}，展示三种声音修改条件下的九个元音。横轴第二共振峰 F2 向右增加，纵轴第一共振峰 F1 向上增加，单位均为赫兹。每种条件的轮廓依次连接 u、ʊ、ɒ、ʌ、æ、e、ɪ、iː；ɜː 为独立点。</desc>
        <rect x={plot.left} y={plot.top} width={plot.right - plot.left} height={plot.bottom - plot.top} className={styles.plotBackground} />
        {f1Ticks.map(hz => <g key={hz}>
          <path d={`M${plot.left} ${y(hz)}H${plot.right}`} className={styles.grid} />
          <path d={`M${plot.left - 7} ${y(hz)}h7`} className={styles.axis} />
          <text x={plot.left - 17} y={y(hz)} textAnchor="end" dominantBaseline="middle" className={styles.tick}>{hz}</text>
        </g>)}
        {f2Ticks.map(hz => <g key={hz}>
          <path d={`M${x(hz)} ${plot.top}V${plot.bottom}`} className={styles.grid} />
          <path d={`M${x(hz)} ${plot.bottom}v7`} className={styles.axis} />
          <text x={x(hz)} y={plot.bottom + 36} textAnchor="middle" className={styles.tick}>{hz}</text>
        </g>)}
        <path d={`M${plot.left} ${plot.top}V${plot.bottom}H${plot.right}`} className={styles.axis} />
        <text x={(plot.left + plot.right) / 2} y="825" textAnchor="middle" className={styles.axisLabel}>第二共振峰 F2（Hz）</text>
        <text x="30" y={(plot.top + plot.bottom) / 2} textAnchor="middle" transform={`rotate(-90 30 ${(plot.top + plot.bottom) / 2})`} className={styles.axisLabel}>第一共振峰 F1（Hz）</text>
        {traces.map(trace => {
          const condition = VOWEL_SPACE_CONDITIONS[trace.condition]
          const points = VOWEL_SPACE_OUTLINE.map(vowel => vowel === 'æ' && trace.lineApex ? trace.lineApex : trace.points.find(point => point.vowel === vowel)!)
          return <g key={trace.condition} style={{ color: condition.color }} data-vsa-condition={trace.condition}>
            <path d={points.map((point, index) => `${index ? 'L' : 'M'}${x(point.f2).toFixed(2)} ${y(point.f1).toFixed(2)}`).join(' ')} className={styles.trace} />
            {trace.points.map(point => <g key={point.vowel} data-vsa-vowel={point.vowel} data-f1={point.f1} data-f2={point.f2}>
              <g transform={`translate(${x(point.f2)} ${y(point.f1)})`} className={styles.marker}><VowelMarker vowel={point.vowel} /></g>
              <text x={x(point.f2) + point.labelOffset[0]} y={y(point.f1) + point.labelOffset[1]} dominantBaseline="middle" textAnchor={point.labelOffset[0] < 0 ? 'end' : 'start'} className={styles.vowel}>{point.vowel}</text>
            </g>)}
          </g>
        })}
      </svg>
    </div>
    <p className={styles.note}>两图采用相同坐标尺度 · F2 向右增大，F1 向上增大</p>
  </section>
}
