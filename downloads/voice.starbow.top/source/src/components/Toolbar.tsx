import type { ReactNode, Ref } from 'react'
import { Button } from './Button'
import styles from './Toolbar.module.css'
import type { ToolItem } from '../hooks/useToolbar'
import { BrandMark, ToolIcon } from './Icon'

interface ToolbarProps {
  toolItems: ToolItem[]
  onToolClick: (toolId: string) => void
  nav?: { label: string; onClick: () => void }
  pageTabs?: ReactNode
  moreMenu?: ReactNode
  recordButtonRef?: Ref<HTMLButtonElement>
  helpButtonRef?: Ref<HTMLButtonElement>
}

export function Toolbar({ toolItems, onToolClick, nav, pageTabs, moreMenu, recordButtonRef, helpButtonRef }: ToolbarProps) {
  return (
    <header className={styles.toolbar} data-compact={moreMenu ? 'true' : 'false'}>
      <div className={styles.brand}>
        <span className={styles.logo} aria-hidden="true"><BrandMark /></span>
        <div><span className={styles.title}>声音练习室</span><span className={styles.subtitle}>VOICE STUDIO</span></div>
      </div>

      {pageTabs && <div className={styles.pageTabs}>{pageTabs}</div>}

      {!pageTabs && nav && (
        <div className={styles.nav}>
          <span className={styles.current}>{nav.label === '返回分析' ? '音高参考' : '声音分析'}</span>
          <Button label={nav.label === '返回分析' ? '返回分析' : nav.label} onClick={nav.onClick} />
        </div>
      )}

      {moreMenu ?? (
        <div className={styles.actions}>
          {toolItems.map(item => (
            <Button
              ref={item.id === 'record' ? recordButtonRef : item.id === 'help' ? helpButtonRef : undefined}
              key={item.id}
              id={item.id}
              variant={item.variant}
              icon={<ToolIcon id={item.id} active={item.recording || item.label === '停止'} />}
              label={item.label}
              recording={item.recording}
              disabled={item.disabled}
              title={item.label}
              aria-label={item.label}
              onClick={() => onToolClick(item.id)}
            />
          ))}
        </div>
      )}
    </header>
  )
}
