import { useEffect, useState } from 'react'
import { FORMANT_METHODS } from '../types'
import { useAppStore } from '../store/appStore'
import { AUDIO_RETENTION_LIMITS, SMOOTHING_WINDOW_LIMITS } from '../config/appConfig'
import { Modal } from './Modal'
import styles from './ConfigDrawer.module.css'

interface ConfigDrawerProps { open: boolean; onClose: () => void }

function validInteger(text: string, limits: { min: number; max: number }): boolean {
  const value = Number(text)
  return text.trim() !== '' && Number.isInteger(value) && value >= limits.min && value <= limits.max
}

export function ConfigDrawer({ open, onClose }: ConfigDrawerProps) {
  const config = useAppStore(s => s.config)
  const setConfig = useAppStore(s => s.setConfig)
  const [windowDraft, setWindowDraft] = useState(String(config.formantSmoothingWindow))
  const [retentionDraft, setRetentionDraft] = useState(String(config.audioRetentionSeconds))
  useEffect(() => { setWindowDraft(String(config.formantSmoothingWindow)) }, [config.formantSmoothingWindow, open])
  useEffect(() => { setRetentionDraft(String(config.audioRetentionSeconds)) }, [config.audioRetentionSeconds, open])
  const windowValid = validInteger(windowDraft, SMOOTHING_WINDOW_LIMITS)
  const retentionValid = validInteger(retentionDraft, AUDIO_RETENTION_LIMITS)
  const commitWindow = () => {
    if (!windowValid) { setWindowDraft(String(useAppStore.getState().config.formantSmoothingWindow)); return }
    const value = Number(windowDraft)
    if (value !== useAppStore.getState().config.formantSmoothingWindow) setConfig({ formantSmoothingWindow: value })
    setWindowDraft(String(value))
  }
  const commitRetention = () => {
    if (!retentionValid) { setRetentionDraft(String(useAppStore.getState().config.audioRetentionSeconds)); return }
    const value = Number(retentionDraft)
    if (value !== useAppStore.getState().config.audioRetentionSeconds) setConfig({ audioRetentionSeconds: value })
    setRetentionDraft(String(value))
  }

  return (
    <Modal open={open} title="配置" onClose={onClose}>
      <div className={styles.panel}>
        <section className={styles.section}>
          <h4>共振峰算法</h4>
          <div className={styles.options}>
            {FORMANT_METHODS.map(method => (
              <label key={method.value} className={styles.option} data-selected={config.formantMethod === method.value}>
                <input type="radio" name="formantMethod" value={method.value}
                  checked={config.formantMethod === method.value}
                  onChange={() => setConfig({ formantMethod: method.value })} />
                <span className={styles.optionBody}>
                  <span className={styles.optionTitle}>{method.label}{method.value === 'hybrid' && <small className={styles.recommended}>推荐</small>}</span>
                  <span className={styles.description}>{method.description.replace('，推荐', '')}</span>
                </span>
              </label>
            ))}
          </div>
          <p className={styles.hint}>生效于下次录音或导入。</p>
        </section>
        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <h4>共振峰平滑</h4>
            <label className={styles.toggle}>
              <input type="checkbox" checked={config.formantSmoothing}
                onChange={event => setConfig({ formantSmoothing: event.target.checked })} />
              <span>启用平滑</span>
            </label>
          </div>
          <label className={styles.numberRow} htmlFor="smoothing-window">
            <span>平滑窗口 <small>1–30 帧</small></span>
            <span className={styles.numberField}>
              <input id="smoothing-window" type="number" min={1} max={30} step={1} inputMode="numeric"
                disabled={!config.formantSmoothing} value={windowDraft} aria-invalid={!windowValid}
                onChange={event => setWindowDraft(event.target.value)}
                onBlur={commitWindow}
                onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); commitWindow() } }} />
              <span>帧</span>
            </span>
          </label>
          <p className={styles.hint}>每帧间隔 10 ms；较大窗口可抑制连续毛刺，也会延缓变化。生效于下次录音或导入。</p>
        </section>
        <section className={styles.section}>
          <h4>音频保留</h4>
          <label className={styles.numberRow} htmlFor="audio-retention">
            <span>保留时长 <small>5–120 秒</small></span>
            <span className={styles.numberField}>
              <input id="audio-retention" type="number" min={5} max={120} step={1} inputMode="numeric"
                value={retentionDraft} aria-invalid={!retentionValid}
                onChange={event => setRetentionDraft(event.target.value)}
                onBlur={commitRetention}
                onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); commitRetention() } }} />
              <span>秒</span>
            </span>
          </label>
          <p className={styles.hint}>输入后按 Enter 或移开焦点生效。调整录音、回放、下载与导入上限；缩短时只保留最新音频。</p>
        </section>
      </div>
    </Modal>
  )
}
