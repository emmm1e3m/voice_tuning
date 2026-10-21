import { useEffect, useRef, useState, type RefObject } from 'react'
import type { ToolItem } from '../../hooks/useToolbar'
import styles from './MobileMoreMenu.module.css'
import { Icon, ToolIcon } from '../Icon'

export interface MobileMoreMenuProps {
  items: ToolItem[]
  onSelect: (toolId: string) => void
  nav?: { label: string; onClick: () => void }
  triggerButtonRef?: RefObject<HTMLButtonElement | null>
}

export function MobileMoreMenu({ items, onSelect, nav, triggerButtonRef }: MobileMoreMenuProps) {
  const [open, setOpen] = useState(false)
  const internalTriggerRef = useRef<HTMLButtonElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const triggerRef = triggerButtonRef ?? internalTriggerRef
  const menuItems = items.filter(item => item.id !== 'record')
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      setOpen(false)
      triggerRef.current?.focus()
    }
    const onPointerDown = (event: PointerEvent) => {
      // 外部点击继续执行默认聚焦，不把焦点抢回菜单入口。
      if (event.target instanceof Node && !wrapRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open, triggerRef])
  return (
    <div ref={wrapRef} className={styles.wrap}>
      <button ref={triggerRef} type="button" className={styles.trigger} aria-label="更多操作"
        aria-expanded={open} onClick={() => setOpen(prev => !prev)}><Icon name="more" /></button>
      {open && (
        <div className={styles.menu} role="menu">
          {nav && (
            <button key="__nav" type="button" role="menuitem" className={styles.item}
              onClick={() => { nav.onClick(); setOpen(false) }}>
              <span className={styles.itemIcon} aria-hidden="true"><Icon name="swap" /></span>
              <span className={styles.itemLabel}>{nav.label}</span>
            </button>
          )}
          {menuItems.map(item => (
            <button key={item.id} type="button" role="menuitem" className={styles.item}
              disabled={item.disabled}
              onClick={() => {
                if (item.disabled) return
                // 菜单项即将卸载，为弹窗保留可恢复焦点的稳定入口。
                triggerRef.current?.focus()
                onSelect(item.id)
                setOpen(false)
              }}>
              <span className={styles.itemIcon} aria-hidden="true"><ToolIcon id={item.id} active={item.recording || item.label === '停止'} /></span>
              <span className={styles.itemLabel}>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
