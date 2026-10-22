import { useId } from 'react'
import { anatomyEnvelope, type AnatomyFrequency } from '../utils/anatomyAcoustics'
import styles from './AnatomyExplorer.module.css'

type Frequencies = Record<AnatomyFrequency, number>
const X = (hz: number) => 82 + hz / 4000 * 514
const Y = (intensity: number) => 310 - intensity * 240
const curve = (frequencies: Frequencies) => Array.from({ length: 401 }, (_, index) => `${index ? 'L' : 'M'}${X(index * 10).toFixed(2)} ${Y(anatomyEnvelope(index * 10, frequencies.f1, frequencies.f2)).toFixed(2)}`).join(' ')

export function AnatomySpectrum({ reference, current }: { reference: Frequencies; current: Frequencies }) {
  const id = useId()
  return <div className={styles.spectrum}>
    <div className={styles.spectrumScroll} aria-label="元音频谱"><svg viewBox="0 0 640 377" role="img" aria-labelledby={`${id}-title ${id}-desc`}>
      <title id={`${id}-title`}>元音的强度与频率示意图</title>
      <desc id={`${id}-desc`}>F1 {current.f1} Hz、F2 {current.f2} Hz 为当前包络峰。虚线为所选元音参考。F0 {current.f0} Hz 为泛音间距，不是共振峰。纵轴为教学相对强度。</desc>
      <defs><linearGradient id={`${id}-envelope`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#b8a1cf" stopOpacity=".2" /><stop offset="1" stopColor="#b8a1cf" stopOpacity=".02" /></linearGradient></defs>
      <text x="82" y="25">相对强度</text>
      {[0, .5, 1].map(value => <g key={value}><path className={styles.spectrumGrid} d={`M82 ${Y(value)}H596`} /><text x="70" y={Y(value) + 6} textAnchor="end">{value}</text></g>)}
      {[0, 1000, 2000, 3000, 4000].map(hz => <g key={hz}><path className={styles.spectrumGrid} d={`M${X(hz)} 50V310`} /><text x={X(hz)} y="333" textAnchor={hz === 4000 ? 'end' : 'middle'}>{hz}</text></g>)}
      <path d={`${curve(current)} L596 310 L82 310 Z`} fill={`url(#${id}-envelope)`} />
      {Array.from({ length: Math.floor(4000 / current.f0) }, (_, index) => (index + 1) * current.f0).map(hz => <path key={hz} className={styles.harmonic} data-testid="anatomy-harmonic" d={`M${X(hz)} 310V${Y(anatomyEnvelope(hz, current.f1, current.f2))}`} />)}
      <path className={styles.referenceEnvelope} data-testid="anatomy-reference-envelope" d={curve(reference)} />
      <path className={styles.currentEnvelope} data-testid="anatomy-current-envelope" d={curve(current)} />
      {(['f1', 'f2'] as const).map((frequency, index) => <g key={frequency} className={styles.peakMarker} data-frequency={frequency}>
        <path d={`M${X(reference[frequency])} 76V310`} className={styles.referencePeak} />
        <path d={`M${X(current[frequency])} ${index ? 83 : 59}V310`} />
        <text x={Math.min(544, Math.max(134, X(current[frequency])))} y={index ? 74 : 50} textAnchor="middle">{frequency.toUpperCase()} {current[frequency]}</text>
      </g>)}
      <path className={styles.spectrumAxis} d="M82 50V310H596" />
      <text x="596" y="361" textAnchor="end">频率（Hz）</text>
    </svg></div>
    <div className={styles.spectrumLegend}><span className={styles.legendReference}>元音参考</span><span className={styles.legendCurrent}>当前包络</span><span className={styles.legendHarmonic}>当前泛音</span></div>
    <p className={styles.spectrumNote}>F0 决定泛音间距；F1、F2 是声道增强的共振峰。</p>
  </div>
}
