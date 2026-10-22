import { useAppStore } from '../../store/appStore'
import { usePresetBands } from '../../hooks/usePresetBands'
import { VOWEL_PRESETS, presetShortLabel } from '../../types'
import { BandRangeRow } from '../BandRangeRow'
import { ContextHelpButton } from '../ContextHelpButton'
import { Icon } from '../Icon'
import { TargetRecommendationControl } from '../TargetRecommendationControl'
import type { HelpTopic } from '../../content/helpContent'
import styles from './TrainingGoalCard.module.css'

const BAND_NAMES = { f0: '基频', f1: '第一共振峰', f2: '第二共振峰' } as const

export function TrainingGoalCard({ onOpenHelp }: { onOpenHelp?: (topic: HelpTopic) => void } = {}) {
  const activePreset = useAppStore(s => s.activePreset)
  const switchPreset = useAppStore(s => s.switchPreset)
  const api = usePresetBands()

  return (
    <section className={styles.card} aria-label="目标频率设置" data-testid="training-goal-card">
      <div className={styles.intro}>
        <p className={styles.description}>选择元音，移动目标中心</p>
        <button type="button" className={styles.reset} aria-label="重置所有预设" title="恢复全部元音默认值" onClick={api.onReset}>
          <Icon name="reset" size={20} />
        </button>
      </div>
      <div className={styles.vowelLabel}>元音选择</div>
      <div className={styles.vowels} role="group" aria-label="元音预设">
        {Object.keys(VOWEL_PRESETS).map(key => (
          <button key={key} type="button" aria-pressed={activePreset === key}
            className={styles.vowel} onClick={() => switchPreset(key)}>{presetShortLabel(key)}</button>
        ))}
      </div>
      <div className={styles.bands}>
        <TargetRecommendationControl />
        {(['f0', 'f1', 'f2'] as const).map(key => (
          <div key={key} className={`${styles.band} ${styles[key]}`}>
            <div className={styles.bandHeader}>
              <h4 className={styles.bandTitle}><span className={styles.dot} />{key.toUpperCase()} <span>{BAND_NAMES[key]}</span></h4>
              {onOpenHelp && <ContextHelpButton label={`${key.toUpperCase()} 目标说明`} onClick={() => onOpenHelp(key)} />}
            </div>
            <BandRangeRow bandKey={key} api={api} />
          </div>
        ))}
      </div>
      <p className={styles.hint}>每个目标保持固定宽度。滑杆实时生效，输入后按 Enter 或移开焦点生效。</p>
    </section>
  )
}
