import { useChartDisplayStore } from '../store/chartDisplayStore'
import styles from './FrequencyScaleControl.module.css'
import { Tip } from './Tip'
import { REGISTER_EXPLANATION } from '../utils/registerSegments'

export function FrequencyScaleControl() {
  const scale = useChartDisplayStore(s => s.frequencyScale)
  const setScale = useChartDisplayStore(s => s.setFrequencyScale)
  const showRegister = useChartDisplayStore(s => s.showRegister)
  const setShowRegister = useChartDisplayStore(s => s.setShowRegister)
  return <div className={styles.control} role="group" aria-label="频率坐标轴">
    <span className={styles.description}>{scale === 'log' ? '相同倍数 · 相同距离' : '相同 Hz 差 · 相同距离'}</span>
    <div className={styles.buttons}>
      <button type="button" aria-pressed={scale === 'log'} onClick={() => setScale('log')} title="相同频率倍数占相同距离">对数</button>
      <button type="button" aria-pressed={scale === 'linear'} onClick={() => setScale('linear')} title="相同 Hz 差值占相同距离">线性</button>
    </div>
    <label className={styles.registerToggle}><input type="checkbox" checked={showRegister} onChange={event => setShowRegister(event.target.checked)} />声区</label>
    <Tip content={REGISTER_EXPLANATION} ariaLabel="声区着色说明" align="end" />
  </div>
}
