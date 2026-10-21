import { useChartDisplayStore } from '../store/chartDisplayStore'
import styles from './FrequencyScaleControl.module.css'

export function FrequencyScaleControl() {
  const scale = useChartDisplayStore(s => s.frequencyScale)
  const setScale = useChartDisplayStore(s => s.setFrequencyScale)
  return <div className={styles.control} role="group" aria-label="频率坐标轴">
    <span>{scale === 'log' ? '相同倍数 · 相同距离' : '相同 Hz 差 · 相同距离'}</span>
    <div className={styles.buttons}>
      <button type="button" aria-pressed={scale === 'log'} onClick={() => setScale('log')} title="相同频率倍数占相同距离">对数</button>
      <button type="button" aria-pressed={scale === 'linear'} onClick={() => setScale('linear')} title="相同 Hz 差值占相同距离">线性</button>
    </div>
  </div>
}
