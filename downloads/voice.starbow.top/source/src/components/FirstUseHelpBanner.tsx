import styles from './FirstUseHelpBanner.module.css'
import { Icon } from './Icon'

interface FirstUseHelpBannerProps {
  visible: boolean
  suppressed: boolean
  layout: 'portrait' | 'landscape'
  dockHeight?: number
  onOpen: () => void
  onDismiss: () => void
}

export function FirstUseHelpBanner({ visible, suppressed, layout, dockHeight = 0, onOpen, onDismiss }: FirstUseHelpBannerProps) {
  if (!visible || (layout === 'portrait' && dockHeight <= 0)) return null
  return <section aria-label="首次使用帮助" className={styles.anchor} style={{ bottom: layout === 'portrait' ? dockHeight + 10 : 24 }}
    data-layout={layout}
    data-suppressed={suppressed} aria-hidden={suppressed || undefined}>
    <div className={styles.banner}>
      <Icon className={styles.icon} name="book" />
      <div className={styles.copy}><strong>使用教程</strong><span>发声原理、训练步骤与读图</span></div>
      <button type="button" className={styles.open} disabled={suppressed} onClick={onOpen}>查看说明</button>
      <button type="button" className={styles.close} disabled={suppressed} onClick={onDismiss} aria-label="关闭首次使用提示"><Icon name="close" /></button>
    </div>
  </section>
}
