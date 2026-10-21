import { useId, useState } from 'react'
import { VOWEL_PRESETS } from '../types'
import { FREQUENCY_COLORS } from '../utils/frequencyChart'
import styles from './ChartReadingExample.module.css'

const KEYS = ['f0', 'f1', 'f2'] as const
const NAMES = { f0: '音高', f1: '第一共振峰', f2: '第二共振峰' }
const TARGETS = VOWEL_PRESETS['vowel-a']
const LEFT = 78
const RIGHT = 506
const TOP = 44
const BOTTOM = 300
// 使用示意轨迹说明读图；数值不来自录音或人体模拟。
const EXAMPLE_VALUES: Record<typeof KEYS[number], readonly (number | null)[]> = {
  f0: [221, 228, 241, 249, 245, 235, 239, 250, 263, null, 239, 231, 225, 235, 250, 260, 247],
  f1: [845, 855, 890, 915, 935, 920, 892, 865, 860, null, 880, 930, 1008, 980, 925, 902, 884],
  f2: [1190, 1220, 1260, 1305, 1310, 1270, 1245, 1280, 1320, null, 1260, 1240, 1225, 1200, 1215, 1260, 1300],
}
function y(hz: number) { return BOTTOM - Math.log2(hz / 100) / Math.log2(3200 / 100) * (BOTTOM - TOP) }
function x(seconds: number) { return LEFT + seconds / 4 * (RIGHT - LEFT) }
function curve(values: readonly (number | null)[]) {
  let connected = false
  return values.map((value, index) => {
    if (value === null) { connected = false; return '' }
    const command = connected ? 'L' : 'M'
    connected = true
    return `${command}${x(index / 4).toFixed(2)},${y(value).toFixed(2)}`
  }).join(' ')
}

export function ChartReadingExample() {
  const id = useId()
  const [visible, setVisible] = useState({ f0: true, f1: true, f2: true })
  return <figure className={styles.example} aria-label="F0、F1、F2 读图示例">
    <div className={styles.header}><strong>读图示例</strong><span>示意数据 · a 元音</span></div>
    <div className={styles.legend} role="group" aria-label="示例曲线图例">
      {KEYS.map(key => <button key={key} type="button" aria-label={`${key.toUpperCase()} 示例曲线`} aria-pressed={visible[key]}
        onClick={() => setVisible(old => ({ ...old, [key]: !old[key] }))}>
        <i style={{ background: FREQUENCY_COLORS[key] }} aria-hidden="true" /><strong>{key.toUpperCase()}</strong><span>{NAMES[key]}</span>
      </button>)}
    </div>
    <div className={styles.plot} tabIndex={0} role="region" aria-label="示例时间频率图，可左右滚动">
      <svg viewBox="0 0 660 355" role="img" aria-labelledby={`${id}-title`} aria-describedby={`${id}-desc`}>
        <title id={`${id}-title`}>同一张对数频率图中的 F0、F1、F2 曲线和目标窗口</title>
        <desc id={`${id}-desc`}>横轴为 0 到 4 秒，纵轴为 100 到 3200 Hz 的对数坐标。F0 为紫色，F1 为粉色，F2 为蓝色。同色浅色带表示各项目标范围，虚线表示目标中心。中间的停顿处曲线断开。</desc>
        {KEYS.map(key => {
          const [low, high] = TARGETS[key]
          const center = (low + high) / 2
          return <g key={key} style={{ color: FREQUENCY_COLORS[key] }}>
            <rect data-testid={`example-target-${key}`} x={LEFT} y={y(high)} width={RIGHT - LEFT} height={y(low) - y(high)} fill="currentColor" opacity=".11" />
            <line data-testid={`example-center-${key}`} x1={LEFT} x2={RIGHT} y1={y(center)} y2={y(center)} stroke="currentColor" strokeWidth="1.4" strokeDasharray="5 5" />
            <text className={styles.targetLabel} x={RIGHT + 13} y={y(center) + 4} fill="currentColor">{key.toUpperCase()} 中心 {center}</text>
          </g>
        })}
        {[100, 200, 400, 800, 1600, 3200].map(hz => <g key={hz}>
          <line className={styles.grid} x1={LEFT} x2={RIGHT} y1={y(hz)} y2={y(hz)} />
          <text className={styles.tick} x={LEFT - 12} y={y(hz) + 4} textAnchor="end">{hz}</text>
        </g>)}
        {[0, 1, 2, 3, 4].map(seconds => <g key={seconds}>
          <line className={styles.grid} x1={x(seconds)} x2={x(seconds)} y1={TOP} y2={BOTTOM} />
          <text className={styles.tick} x={x(seconds)} y={BOTTOM + 22} textAnchor="middle">{seconds}</text>
        </g>)}
        <path className={styles.axis} d={`M${LEFT} ${TOP}V${BOTTOM}H${RIGHT}`} />
        <text className={styles.axisTitle} x={16} y={23}>频率 Hz（对数）</text>
        <text className={styles.axisTitle} x={(LEFT + RIGHT) / 2} y={BOTTOM + 47} textAnchor="middle">时间 / 秒</text>
        {KEYS.filter(key => visible[key]).map(key => <path key={key} data-testid={`example-curve-${key}`} d={curve(EXAMPLE_VALUES[key])}
          fill="none" stroke={FREQUENCY_COLORS[key]} strokeWidth={key === 'f0' ? 2.6 : 2.2} strokeLinejoin="round" strokeLinecap="round" />)}
      </svg>
    </div>
    <figcaption>实线是频率轨迹，浅色带是目标窗口，虚线是中心。先看同一个元音的稳定部分，再看三条曲线怎样随时间变化；停顿处留空。点击图例可单独观察一条示例曲线。</figcaption>
  </figure>
}
