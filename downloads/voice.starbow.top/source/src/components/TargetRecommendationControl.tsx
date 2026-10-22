import { useAppStore } from '../store/appStore'
import styles from './TargetRecommendationControl.module.css'

export function TargetRecommendationControl() {
  const mode = useAppStore(state => state.targetMode)
  const setMode = useAppStore(state => state.setTargetMode)
  return <div className={styles.control}>
    <div className={styles.buttons} role="group" aria-label="目标设置方式">
      <button type="button" aria-pressed={mode === 'vowel'} onClick={() => setMode('vowel')}>随F0推荐</button>
      <button type="button" aria-pressed={mode === 'manual'} onClick={() => setMode('manual')}>手动设置</button>
    </div>
    <p>{mode === 'vowel' ? 'F1/F2 随 F0 和元音自动更新，可手动微调。' : '分别调整三个目标；修改 F0 时保留自定 F1/F2。'}</p>
  </div>
}
