import type { HelpTopic } from '../content/helpContent'
import styles from './LearningStrip.module.css'
import { Icon } from './Icon'
import { useWindowSummary } from '../hooks/useWindowSummary'
import { useAppStore } from '../store/appStore'
import { getBandCenter } from '../config/targetBandRules'

const DIMENSIONS = [
  { key: 'f0', name: '音高', structure: '声带的张力、长度与有效振动质量' },
  { key: 'f1', name: '元音与开口', structure: '舌位高低 · 下颌开口' },
  { key: 'f2', name: '共振与音色', structure: '舌位前后 · 圆唇 · 声道长度' },
] as const

export function LearningStrip({ onOpenHelp }: { onOpenHelp?: (topic: HelpTopic) => void }) {
  const summary = useWindowSummary()
  const seconds = useAppStore(s => s.config.audioRetentionSeconds)
  const bands = useAppStore(s => s.bands)
  return (
    <section className={styles.summary} aria-label="窗口频率结果">
      <div className={styles.summaryLabel}><span>窗口中位数</span><span>最近 {seconds} 秒</span></div>
      <div className={styles.learning}>
      {DIMENSIONS.map(item => (
        <button key={item.key} type="button" className={styles.dimension} data-dimension={item.key}
          aria-label={`${item.key.toUpperCase()} ${item.name}：使用说明`}
          onClick={() => onOpenHelp?.(item.key)}>
          <span className={styles.top}><b>{item.key.toUpperCase()}</b><span className={styles.name}>{item.name}</span><span className={styles.arrow}><Icon name="help" size={17} /></span></span>
          <span className={styles.resultLine}>
            <span className={styles.reading} data-testid={`window-${item.key}`}><strong>{summary[item.key] == null ? '—' : Math.round(summary[item.key]!)}</strong><span>Hz</span></span>
            <span className={styles.separator}>/</span>
            <span className={styles.target} data-testid={`target-${item.key}`}>目标 {Math.round(getBandCenter(bands[item.key].range))} Hz</span>
          </span>
          <span className={styles.structure}>{item.structure}</span>
        </button>
      ))}
      </div>
    </section>
  )
}
