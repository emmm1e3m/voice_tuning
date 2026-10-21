import { useId } from 'react'
import { anatomyEnvelope, type AnatomyFrequency } from '../utils/anatomyAcoustics'
import styles from './AnatomyExplorer.module.css'

type Frequencies = Record<AnatomyFrequency, number>
const X = (hz: number) => 54 + hz / 4000 * 526
const Y = (intensity: number) => 244 - intensity * 148
const curve = (frequencies: Frequencies) => Array.from({ length: 401 }, (_, index) => `${index ? 'L' : 'M'}${X(index * 10).toFixed(2)} ${Y(anatomyEnvelope(index * 10, frequencies.f1, frequencies.f2)).toFixed(2)}`).join(' ')

export function AnatomySpectrum({ reference, current }: { reference: Frequencies; current: Frequencies }) {
  const id = useId()
  return <div className={styles.spectrum}>
    <div className={styles.spectrumLegend}><span>┄ 元音参考</span><span>━ 当前包络</span><span>│ 当前泛音</span></div>
    <div className={styles.spectrumScroll} tabIndex={0} aria-label="元音频谱，可在图内左右滑动"><svg viewBox="0 0 600 330" role="img" aria-labelledby={`${id}-title ${id}-desc`}>
      <title id={`${id}-title`}>元音的强度与频率示意图</title>
      <desc id={`${id}-desc`}>F1 {current.f1} Hz、F2 {current.f2} Hz 为当前包络峰。虚线为所选元音参考。F0 {current.f0} Hz 为泛音间距，不是共振峰。纵轴为教学相对强度。</desc>
      <text x="54" y="22" className={styles.spectrumAxisLabel}>相对强度</text>
      {[0, .5, 1].map(value => <g key={value}><path className={styles.spectrumGrid} d={`M54 ${Y(value)}H580`} /><text x="42" y={Y(value) + 6} textAnchor="end">{value}</text></g>)}
      {[0, 1000, 2000, 3000, 4000].map(hz => <g key={hz}><path className={styles.spectrumGrid} d={`M${X(hz)} 88V244`} /><text x={X(hz)} y="265" textAnchor={hz === 4000 ? 'end' : 'middle'}>{hz}</text></g>)}
      {Array.from({ length: Math.floor(4000 / current.f0) }, (_, index) => (index + 1) * current.f0).map(hz => <path key={hz} className={styles.harmonic} data-testid="anatomy-harmonic" d={`M${X(hz)} 244V${Y(anatomyEnvelope(hz, current.f1, current.f2))}`} />)}
      <path className={styles.referenceEnvelope} data-testid="anatomy-reference-envelope" d={curve(reference)} />
      <path className={styles.currentEnvelope} data-testid="anatomy-current-envelope" d={curve(current)} />
      {(['f1', 'f2'] as const).map((frequency, index) => <g key={frequency} className={styles.peakMarker} data-frequency={frequency}>
        <path d={`M${X(reference[frequency])} 91V244`} className={styles.referencePeak} />
        <path d={`M${X(current[frequency])} ${index ? 74 : 48}V244`} />
        <text x={Math.min(530, Math.max(93, X(current[frequency])))} y={index ? 66 : 40} textAnchor="middle">{frequency.toUpperCase()} {current[frequency]}</text>
      </g>)}
      <path className={styles.spectrumAxis} d="M54 88V244H580" />
      <path className={styles.referenceFundamental} data-testid="anatomy-reference-f0-marker" d={`M${X(reference.f0)} 212V244`} />
      <path className={styles.fundamental} data-testid="anatomy-f0-marker" d={`M${X(current.f0)} 204V244`} />
      <text x={Math.max(98, X(reference.f0))} y="291" textAnchor="middle" className={styles.referenceFundamentalLabel}>参考 F0</text>
      <text x={Math.max(98, X(current.f0))} y="321" textAnchor="middle" className={styles.fundamentalLabel}>当前 F0</text>
      <text x="580" y="321" textAnchor="end" className={styles.spectrumAxisLabel}>频率（Hz）</text>
    </svg></div>
  </div>
}
