import { useId } from 'react'
import { VocalTractDiagram } from './VocalTractDiagram'
import { ANATOMY_VOWELS } from '../utils/anatomyAcoustics'
import { ExtrinsicLarynxFigure, IntrinsicLarynxFigure, LarynxFrameworkFigure } from './LaryngealFigures'
import { hasReferenceSpectrogram, ReferenceSpectrogram } from './ReferenceSpectrogram'
import { hasReferenceVowelSpace, ReferenceVowelSpaces } from './ReferenceVowelSpaces'
import { AnatomyPlate } from './AnatomyPlate'
import styles from './ManualFigure.module.css'

export type ManualFigureKind = 'tract' | 'extrinsic' | 'intrinsic' | 'anatomy-plate' | 'filter' | 'source' | 'output' | 'ipa' | 'measured-spectrum' | 'vsa' | 'praat-screenshot'

// Praat 操作与练习保留真实界面，按正文资源路径精确匹配。
const PRAAT_SCREENSHOTS = new Map<string, readonly [number, number]>([
  ['mineru_output/MTF声音女性化手册/images/58662964c39d84f3950f80868233daf318945e7376c6d732d2312017f6043492.jpg', [462, 685]],
  ['mineru_output/MTF声音女性化手册/images/d5fa7d482f0b6b6fb56ae0016c98b1938bee92c38dcc655c97dec1991fa3a488.jpg', [668, 514]],
  ['mineru_output/MTF声音女性化手册/images/5001818d8b5dd4d6fcc00d5c107c3eace5497535632d7ea2918ba3c0533e1fb6.jpg', [1093, 456]],
  ['mineru_output/MTF声音女性化手册/images/cd3908d3d779faddd50590b372e6492b4c75856859608d1b4831a3c0d66bc690.jpg', [1162, 868]],
  ['mineru_output/MTF声音女性化手册/images/f1f4e27a3a78fd82b5ab1ff48e3f7d59b93763adcbf0bc7eda31dd96b3516cb5.jpg', [982, 329]],
  ['mineru_output/MTF声音女性化手册/images/3ed715b479e74356e0816048b8ffcc181305595d247de001d38524cb1e3b2a23.jpg', [1037, 406]],
  ['4.jpg', [916, 399]],
  ['mineru_output/MTF声音女性化手册/images/e41a5c1fbb5157917951d2a73b304d06fdca6d43eea0cbdfd8f8a4b69d7c8b5a.jpg', [1157, 428]],
  ['mineru_output/MTF声音女性化手册/images/4b724a1ff68af17d32b384eb124f0198a11ac1f0c088912bce5b8fabbf66ddc0.jpg', [1157, 435]],
  ['mineru_output/MTF声音女性化手册/images/22d32d581b67f2e73e038a9f8b296ca830f2f06040cd0cb04ce7d24bc98d61fe.jpg', [1157, 423]],
  ['mineru_output/MTF声音女性化手册/images/81a1eb3fe1c7fe0575b1f79377b6893f164687cede2148b3a8bb6fc9a81279e6.jpg', [998, 392]],
])

const REDRAWN: Readonly<Record<string, ManualFigureKind>> = {
  '1.jpg': 'tract',
  '2.jpg': 'extrinsic',
  '3.jpg': 'intrinsic',
  '示意图.jpg': 'anatomy-plate',
  '3820ff723899c941b6f71e0dcd3c651dceb7252796348343263dde2441eb8b97.jpg': 'filter',
  '1702aeefce499f8aac4fa34321edbe5487688a6ee764b08b66d4f17596af95e8.jpg': 'source',
  '98fe24a93ddfdb56738d9fbea431cbf6b1bbc08d8ad47892947487f515225eec.jpg': 'output',
  '3eb232567f407b90ee5e4d3d175f09f2f2a13d58100e71ebb57b52fe201f0575.jpg': 'ipa',
}

export function getManualFigureKind(src: string): ManualFigureKind {
  if (PRAAT_SCREENSHOTS.has(src)) return 'praat-screenshot'
  if (hasReferenceSpectrogram(src)) return 'measured-spectrum'
  if (hasReferenceVowelSpace(src)) return 'vsa'
  return REDRAWN[basename(src)]
}

const basename = (src: string) => src.slice(src.lastIndexOf('/') + 1)
// 三张图共用一个响应和声源，输出图按二者相乘绘制。
const filterResponse = (hz: number) => .12 + .85 * Math.exp(-(((hz - 500) / 280) ** 2)) + .67 * Math.exp(-(((hz - 1500) / 260) ** 2)) + .49 * Math.exp(-(((hz - 2500) / 280) ** 2))
const sourceAmplitude = (hz: number) => Math.exp(-hz / 2400)

function SourceFilterFigure({ kind, compact = false }: { kind: 'filter' | 'source' | 'output'; compact?: boolean }) {
  const id = useId()
  const left = compact ? 54 : 74, right = compact ? 400 : 676, bottom = compact ? 195 : 250
  const chartX = (hz: number) => left + hz / 3000 * (right - left)
  const chartY = (amplitude: number) => bottom - amplitude * (compact ? 128 : 170)
  const title = kind === 'filter' ? '声道：滤波器的频率响应' : kind === 'source' ? '声源：等间距的谐波' : '输出：声源经过声道滤波'
  const envelopeAt = (hz: number) => filterResponse(hz) * (kind === 'output' ? sourceAmplitude(hz) : 1)
  const curve = Array.from({ length: 301 }, (_, i) => `${i ? 'L' : 'M'}${chartX(i * 10).toFixed(1)} ${chartY(envelopeAt(i * 10)).toFixed(1)}`).join(' ')
  return <svg viewBox={compact ? '0 0 440 280' : '0 0 740 330'} className={`${styles.chart} ${compact ? styles.compactChart : styles.wideChart}`} role="img" aria-labelledby={`${id}-title ${id}-desc`}>
    <title id={`${id}-title`}>{title}</title>
    <desc id={`${id}-desc`}>横轴频率零至三千赫兹。基频一百赫兹的声源谐波通过约五百、一千五百、两千五百赫兹的共振峰后，相应频段被相对加强。</desc>
    <text x={left} y={compact ? 24 : 33} className={styles.diagramTitle}>{title}</text>
    {[.25, .5, .75, 1].map(a => <path key={a} className={styles.grid} d={`M${left} ${chartY(a)}H${right}`} />)}
    {(compact ? [0, 1000, 2000, 3000] : [0, 500, 1000, 1500, 2000, 2500, 3000]).map(hz => <g key={hz}><path className={styles.grid} d={`M${chartX(hz)} 65V${bottom}`} /><text x={chartX(hz)} y={bottom + 26} textAnchor="middle">{hz}</text></g>)}
    <path d={`M${left} 65V${bottom}H${right}`} className={styles.axis} />
    <text x={right} y={compact ? 270 : 309} textAnchor="end">频率（Hz）</text><text x="19" y={compact ? 140 : 170} transform={`rotate(-90 19 ${compact ? 140 : 170})`} textAnchor="middle">相对幅度</text>
    {kind !== 'filter' && Array.from({ length: 30 }, (_, i) => { const hz = (i + 1) * 100; const amplitude = sourceAmplitude(hz) * (kind === 'output' ? filterResponse(hz) : 1); return <path key={hz} className={kind === 'source' ? styles.sourceHarmonic : styles.outputHarmonic} d={`M${chartX(hz)} ${bottom}V${chartY(amplitude)}`} /> })}
    {kind !== 'source' && <>
      <path className={kind === 'filter' ? styles.filterCurve : styles.filterGhost} d={curve} />
      {[500, 1500, 2500].map((hz, i) => <g key={hz}><path className={styles.peakGuide} d={`M${chartX(hz)} ${chartY(envelopeAt(hz)) - 5}V57`} /><text className={styles.peakLabel} x={chartX(hz)} y="52" textAnchor="middle">F{i + 1}</text></g>)}
    </>}
    {kind === 'source' && <g><path d={`M${chartX(100)} 61V49H${chartX(200)}V61`} className={styles.spacing} /><text x={chartX(260)} y="54" className={styles.peakLabel}>{compact ? 'F0 = 100 Hz（谐波间距）' : '谐波间距 = F0 = 100 Hz'}</text></g>}
    {kind === 'output' && <g transform={compact ? 'translate(-20 -64)' : undefined}><path className={styles.filterGhost} d="M75 307H102" /><text x="110" y="311">输出包络</text><path className={styles.outputHarmonic} d="M226 311V297" /><text x="237" y="311">滤波后的谐波</text></g>}
  </svg>
}

const IPA_ROWS = [
  { y: 78, x: [98, 352, 606], pairs: [['i', 'y'], ['ɨ', 'ʉ'], ['ɯ', 'u']], label: '闭' },
  { y: 155, x: [146, 382, 606], pairs: [['e', 'ø'], ['ɘ', 'ɵ'], ['ɤ', 'o']], label: '半闭' },
  { y: 232, x: [194, 412, 606], pairs: [['ɛ', 'œ'], ['ɜ', 'ɞ'], ['ʌ', 'ɔ']], label: '半开' },
  { y: 309, x: [242, 442, 606], pairs: [['a', 'ɶ'], ['', ''], ['ɑ', 'ɒ']], label: '开' },
] as const

function IpaFigure() {
  const id = useId()
  return <svg viewBox="0 0 720 390" className={styles.ipa} role="img" aria-labelledby={`${id}-title ${id}-desc`}>
    <title id={`${id}-title`}>国际音标元音四边形</title><desc id={`${id}-desc`}>横向表示舌位前后，纵向表示元音开闭。同一对音标左侧为不圆唇，右侧为圆唇。此处按国际音标表示，e与普通话拼音e不同。</desc>
    <text x="98" y="32" textAnchor="middle">前</text><text x="352" y="32" textAnchor="middle">央</text><text x="606" y="32" textAnchor="middle">后</text>
    <path d="M98 78H606V309H242Z" className={styles.vowelOutline} /><path d="M352 78L442 309" className={styles.vowelLine} />
    {IPA_ROWS.map(row => <g key={row.label}><text x="28" y={row.y + 5}>{row.label}</text><path d={`M${row.x[0]} ${row.y}H606`} className={styles.vowelLine} />{row.pairs.map((pair, i) => pair[0] && <g key={i}><circle cx={row.x[i]} cy={row.y} r="3.5" className={styles.vowelDot} /><text x={row.x[i] - 17} y={row.y + 7} textAnchor="end" className={styles.ipaSymbol}>{pair[0]}</text><text x={row.x[i] + 17} y={row.y + 7} className={styles.ipaSymbol}>{pair[1]}</text></g>)}</g>)}
    <rect x="378" y="183" width="43" height="34" rx="12" className={styles.symbolBackground} /><text x="400" y="209" textAnchor="middle" className={styles.ipaSymbol}>ə</text>
    <text x="157" y="118" className={styles.ipaSymbol}>ɪ ʏ</text><text x="532" y="118" className={styles.ipaSymbol}>ʊ</text><text x="225" y="282" className={styles.ipaSymbol}>æ</text><text x="430" y="278" textAnchor="middle" className={styles.ipaSymbol}>ɐ</text>
    <text x="360" y="354" textAnchor="middle">成对符号：左为不圆唇，右为圆唇</text><text x="360" y="377" textAnchor="middle" className={styles.ipaNote}>国际音标 /e/ 为前半闭元音；普通话拼音 e 通常对应 /ɤ/。</text>
  </svg>
}

export function ManualFigure({ src, caption }: { src: string; caption: string }) {
  const kind = getManualFigureKind(src)
  const screenshotUrl = `${import.meta.env.BASE_URL}manual/${src}`
  const screenshotSize = PRAAT_SCREENSHOTS.get(src)
  return <figure className={styles.figure} data-manual-figure={kind}>
    <div className={kind === 'praat-screenshot' ? styles.screenshot : styles.redrawn}>
      {kind === 'praat-screenshot' && <>
        <p className={styles.scrollHint}>左右滑动查看完整截图</p>
        <div className={styles.screenshotViewport} tabIndex={0} role="region" aria-label={`${caption}，可横向滚动`}>
          <a href={screenshotUrl} target="_blank" rel="noreferrer" aria-label={`${caption}，查看原尺寸`}>
            <img className={styles.screenshotImage} src={screenshotUrl} alt={caption} width={screenshotSize?.[0]} height={screenshotSize?.[1]} loading="lazy" decoding="async" />
          </a>
        </div>
      </>}
      {kind === 'tract' && <div className={styles.anatomyPlate}>
        <div><h4>声道 · 矢状剖视</h4><p className={styles.scrollHint}>左右滑动查看完整解剖图</p><div className={styles.tractGraphic} tabIndex={0} role="region" aria-label="声道解剖图，可横向滚动"><VocalTractDiagram position={ANATOMY_VOWELS['vowel-a'].position} /></div></div>
        <div><h4>喉的骨与软骨 · 前面观</h4><LarynxFrameworkFigure /></div>
      </div>}
      {kind === 'extrinsic' && <ExtrinsicLarynxFigure />}
      {kind === 'intrinsic' && <IntrinsicLarynxFigure />}
      {kind === 'anatomy-plate' && <AnatomyPlate />}
      {kind === 'measured-spectrum' && <ReferenceSpectrogram src={src} />}
      {kind === 'vsa' && <ReferenceVowelSpaces src={src} />}
      {(kind === 'filter' || kind === 'source' || kind === 'output' || kind === 'ipa') && <>
        {kind === 'ipa' && <p className={styles.scrollHint}>左右滑动查看完整示意图</p>}
        <div className={styles.scrollGraphic} tabIndex={0} role="region" aria-label={`${caption}，可横向滚动`}>
          {kind === 'ipa' ? <IpaFigure /> : <><SourceFilterFigure kind={kind} /><SourceFilterFigure kind={kind} compact /></>}
        </div>
      </>}
    </div>
    <figcaption><span>{basename(src) === '示意图.jpg' ? '头颈与喉部解剖 · 三个视角' : caption}</span>{kind === 'praat-screenshot' && <a className={styles.originalLink} href={screenshotUrl} target="_blank" rel="noreferrer">查看原尺寸 ↗</a>}</figcaption>
  </figure>
}
