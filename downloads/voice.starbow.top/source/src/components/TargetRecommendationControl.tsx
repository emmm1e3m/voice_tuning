import { useAppStore } from '../store/appStore'
import styles from './TargetRecommendationControl.module.css'

export function TargetRecommendationControl() {
  const mode = useAppStore(state => state.targetMode)
  const setMode = useAppStore(state => state.setTargetMode)
  return <div className={styles.control}>
    <div className={styles.buttons} role="group" aria-label="目标设置方式">
      <button type="button" aria-pressed={mode === 'vowel'} onClick={() => setMode('vowel')}>按元音推荐</button>
      <button type="button" aria-pressed={mode === 'manual'} onClick={() => setMode('manual')}>手动设置</button>
    </div>
    <p>{mode === 'vowel' ? '先设 F0 音高目标，F1/F2 自动采用所选元音的参考区间；也可直接手调。' : '分别调整三个目标；修改 F0 时保留自定 F1/F2。'}F0 不决定共振峰，参考区间需按自身声音调整。</p>
  </div>
}
