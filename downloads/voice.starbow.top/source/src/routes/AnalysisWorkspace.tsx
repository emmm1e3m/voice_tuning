import { useOutletContext } from 'react-router-dom'
import { useAppStore } from '../store/appStore'
import type { ShellContext } from './AppShell'
import { TargetPresetBar } from '../components/TargetPresetBar'
import { FeedbackCard } from '../components/FeedbackCard'
import { FeedbackHero } from '../components/mobile/FeedbackHero'
import { FormantChart } from '../components/FormantChart'
import { EmptyState } from '../components/EmptyState'
import { ContextHelpButton } from '../components/ContextHelpButton'
import { LearningStrip } from '../components/LearningStrip'
import { FrequencyScaleControl } from '../components/FrequencyScaleControl'
import { FREQUENCY_COLORS } from '../utils/frequencyChart'
import styles from './AnalysisPage.module.css'

export function AnalysisWorkspace({ layout }: { layout: 'landscape' | 'portrait' }) {
  const { cursorTime, hasData, isCapturing, onOpenHelp } = useOutletContext<ShellContext>()
  const visible = useAppStore(s => s.formantVisible)
  const toggle = useAppStore(s => s.toggleFormantVisible)
  const portrait = layout === 'portrait'
  const seconds = useAppStore(s => s.config.audioRetentionSeconds)
  return <div className={styles.page} data-layout={layout}>
    <div className={styles.inner}>
      <LearningStrip onOpenHelp={onOpenHelp} />
      <div className={styles.workspaceHeader}>
        <div className={styles.workspaceTitle}><span className={styles.statusDot} data-recording={!!isCapturing} /><h1>声音分析</h1>{isCapturing && <span>录音中</span>}</div>
        <FrequencyScaleControl />
      </div>
      <main className={styles.content}>
        {!portrait && <aside className={styles.sidePanel}><FeedbackCard onOpenHelp={onOpenHelp} /><TargetPresetBar onOpenHelp={onOpenHelp} /></aside>}
        <div className={styles.chartsColumn}>
          {portrait && <div data-testid="feedback-hero" className={styles.portraitSlot}><FeedbackHero /></div>}
          <div className={styles.chartStack}>
            <section className={styles.card}>
              <div className={styles.chartHeader}>
                <div className={styles.titleWithHelp}><h2 className={styles.cardTitle}>共振峰</h2>{onOpenHelp && <ContextHelpButton label="共振峰图说明" onClick={() => onOpenHelp('charts')} />}</div>
                <div className={styles.cardLegend} data-testid="formant-legend" aria-label="图例">
                  {(['f0', 'f1', 'f2'] as const).map(key => <button key={key} type="button" className={styles.legendItem} aria-pressed={visible[key]} data-key={key} data-active={String(visible[key])} onClick={() => toggle(key)}><i style={{ background: FREQUENCY_COLORS[key] }} />{key.toUpperCase()}</button>)}
                </div>
              </div>
              <div className={styles.chartArea}>
                <FormantChart cursorTime={cursorTime} />
                <EmptyState title="尚无音频" description={portrait ? '点击下方麦克风开始录音' : `开始录音，或导入不超过 ${seconds} 秒的音频`} visible={!hasData} />
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  </div>
}
