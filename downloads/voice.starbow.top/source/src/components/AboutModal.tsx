import { Modal } from './Modal'
import styles from './AboutModal.module.css'
import { useAppStore } from '../store/appStore'

interface AboutModalProps { open: boolean; onClose: () => void }

export function AboutModal({ open, onClose }: AboutModalProps) {
  const retentionSeconds = useAppStore(state => state.config.audioRetentionSeconds)
  return (
    <Modal open={open} title="关于与来源" onClose={onClose}>
      <section className={styles.section}>
        <h4>声音练习室</h4>
        <p>实时分析 F0、F1 与 F2，支持录音、回放、WAV 下载和声音训练教程。</p>
      </section>
      <section className={styles.section}>
        <h4>整合来源</h4>
        <p><a className={styles.link} href="https://voice.starbow.top/" target="_blank" rel="noopener noreferrer">Voice Builder · 在线声音训练 ↗</a></p>
        <p><a className={styles.link} href="https://mtf-voice-training.vercel.app/" target="_blank" rel="noopener noreferrer">MTF 声音女性化练习手册 ↗</a></p>
      </section>
      <section className={styles.section}>
        <h4>音频保存</h4>
        <p>录音与声音分析在浏览器内进行。当前缓冲保留最近 {retentionSeconds} 秒，点击「下载 WAV」保存。</p>
      </section>
    </Modal>
  )
}
