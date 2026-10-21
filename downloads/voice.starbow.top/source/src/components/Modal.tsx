import { useEffect, useId, useRef, type ReactNode } from 'react'
import styles from './Modal.module.css'
import { isAvailableFocusTarget } from './focusTarget'
import { Icon } from './Icon'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  getFallbackFocus?: () => HTMLElement | null
  variant?: 'default' | 'learning'
}

export function Modal({ open, title, onClose, children, getFallbackFocus, variant = 'default' }: ModalProps) {
  const titleId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const fallbackRef = useRef(getFallbackFocus)
  fallbackRef.current = getFallbackFocus
  const close = () => {
    // 关闭前提交输入草稿，避免 Escape 直接卸载而丢失修改。
    const active = document.activeElement
    if (active instanceof HTMLElement && panelRef.current?.contains(active)) active.blur()
    closeRef.current()
  }

  useEffect(() => {
    if (!open) return
    const previousFocus = document.activeElement as HTMLElement | null
    const bodyOverflow = document.body.style.overflow
    const rootOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    panelRef.current?.focus()
    const viewport = window.visualViewport
    const resize = () => {
      if (!rootRef.current || !viewport) return
      rootRef.current.style.height = `${viewport.height}px`
      rootRef.current.style.top = `${viewport.offsetTop}px`
    }
    resize()
    viewport?.addEventListener('resize', resize)
    viewport?.addEventListener('scroll', resize)
    return () => {
      document.body.style.overflow = bodyOverflow
      document.documentElement.style.overflow = rootOverflow
      viewport?.removeEventListener('resize', resize)
      viewport?.removeEventListener('scroll', resize)
      const target = isAvailableFocusTarget(previousFocus) ? previousFocus : fallbackRef.current?.() ?? null
      if (isAvailableFocusTarget(target)) target.focus({ preventScroll: true })
    }
  }, [open])

  if (!open) return null
  return (
    <div ref={rootRef} className={styles.modal}>
      <div className={styles.modalMask} onClick={close} />
      <div ref={panelRef} className={styles.modalPanel} data-variant={variant} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}
        onKeyDown={event => {
          if (event.key === 'Escape') {
            event.preventDefault()
            event.stopPropagation()
            close()
          }
          if (event.key !== 'Tab') return
          const controls = Array.from(rootRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]') ?? []).filter(isAvailableFocusTarget)
          if (!controls?.length) { event.preventDefault(); return }
          const first = controls[0]
          const last = controls[controls.length - 1]
          if (event.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
            event.preventDefault(); last.focus()
          } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panelRef.current)) {
            event.preventDefault(); first.focus()
          }
        }}>
        <header className={styles.modalHeader}>
          <h3 id={titleId}>{title}</h3>
          <button className={styles.modalClose} onClick={close} aria-label="关闭"><Icon name="close" size={20} /></button>
        </header>
        <div className={styles.modalBody} data-modal-body>{children}</div>
      </div>
    </div>
  )
}
