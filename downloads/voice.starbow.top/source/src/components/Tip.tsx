import { useState } from 'react'
import styles from './Tip.module.css'
import { Icon } from './Icon'

interface TipProps {
  content: string
  ariaLabel?: string
  align?: 'start' | 'end'
}

const isHoverCapable = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(hover: hover)').matches === true

export function Tip({ content, ariaLabel = '说明', align = 'start' }: TipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [canHover] = useState(isHoverCapable)

  const hoverHandlers = canHover
    ? {
        onMouseEnter: () => setIsOpen(true),
        onMouseLeave: () => setIsOpen(false),
      }
    : {}

  return (
    <span className={styles.wrapper} data-align={align}>
      <button
        type="button"
        className={styles.trigger}
        aria-label={ariaLabel}
        onClick={() => setIsOpen(open => !open)}
        {...hoverHandlers}
      >
        <Icon name="info" size={15} />
      </button>
      {isOpen && <div className={styles.popover}>{content}</div>}
    </span>
  )
}
