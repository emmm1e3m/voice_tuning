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
        <h4>来源与致谢</h4>
        <p>声音练习室基于以下文档与代码进行二次开发和易用性优化，整合训练教程与声音分析功能，并优化界面布局和操作流程。</p>
        <p>文档来源：<a className={styles.link} href="https://space.bilibili.com/942770" target="_blank" rel="noopener noreferrer">あおぎ葵 ↗</a> · <a className={styles.link} href="https://mtf-voice-training.vercel.app/" target="_blank" rel="noopener noreferrer">MTF 声音女性化练习手册 ↗</a>。</p>
        <p>代码来源：<a className={styles.link} href="https://github.com/JPs-git/voice-builder" target="_blank" rel="noopener noreferrer">JPs-git/voice-builder ↗</a> · <a className={styles.link} href="https://voice.starbow.top/" target="_blank" rel="noopener noreferrer">原项目在线体验 ↗</a>。</p>
        <p>感谢原作者提供的文档与代码。</p>
      </section>
      <section className={styles.section}>
        <h4>音频保存</h4>
        <p>录音与声音分析在浏览器内进行。当前缓冲保留最近 {retentionSeconds} 秒，点击「下载 WAV」保存。</p>
      </section>
    </Modal>
  )
}
