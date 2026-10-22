import { VOWEL_PRESETS, presetShortLabel } from '../types'
import { useAppStore } from '../store/appStore'
import { usePresetBands } from '../hooks/usePresetBands'
import { BandRangeRow } from './BandRangeRow'
import { ContextHelpButton } from './ContextHelpButton'
import { Icon } from './Icon'
import { TargetRecommendationControl } from './TargetRecommendationControl'
import styles from './TargetPresetBar.module.css'
import type { HelpTopic } from '../content/helpContent'

export function TargetPresetBar({ onOpenHelp }: { onOpenHelp?: (topic: HelpTopic) => void } = {}) {
  const activePreset = useAppStore(s => s.activePreset)
  const switchPreset = useAppStore(s => s.switchPreset)
  const api = usePresetBands()
  const vowelKeys = Object.keys(VOWEL_PRESETS)

  return (
    <details open className={styles.bar} aria-label="目标频率设置"
      onToggle={event => { if (!event.currentTarget.open) api.showInputMessage('f0', '') }}>
      <summary className={styles.summary}>
        <span className={styles.label}>目标频率设置</span>
        <span className={styles.currentVowel}>元音 {presetShortLabel(activePreset)}</span>
        <Icon name="arrow" size={14} className={styles.disclosure} />
      </summary>
      <div className={styles.body}>
        <div className={styles.row}>
          <span className={styles.bodyLabel}>选择元音与参考中心</span>
          <button type="button" className={styles.resetIcon} onClick={api.onReset}
            aria-label="重置所有预设" title="恢复全部元音默认值"><Icon name="reset" size={17} /></button>
        </div>
        <div className={styles.vowels} role="group" aria-label="元音预设">
          {vowelKeys.map(name => (
            <button key={name} type="button"
              className={`${styles.vowelBtn}${activePreset === name ? ` ${styles.vowelBtnActive}` : ''}`}
              data-preset={name} aria-pressed={activePreset === name} onClick={() => switchPreset(name)}>
              {presetShortLabel(name)}
            </button>
          ))}
        </div>
        <div className={styles.inputs}>
          <TargetRecommendationControl />
          {(['f0', 'f1', 'f2'] as const).map(key => (
            <div key={key} className={styles.bandGroup}>
              <div className={styles.bandHeading}>
                <span><strong>{key.toUpperCase()}</strong> {key === 'f0' ? '音高' : key === 'f1' ? '第一共振峰' : '第二共振峰'}</span>
                {onOpenHelp && <ContextHelpButton label={`${key.toUpperCase()} 目标说明`} onClick={() => onOpenHelp(key)} />}
              </div>
              <BandRangeRow bandKey={key} api={api} />
            </div>
          ))}
        </div>
        <p className={styles.hint}>数值按 Enter 或移开焦点生效。</p>
      </div>
    </details>
  )
}
