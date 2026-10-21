import styles from './ContextHelpButton.module.css'
import { Icon } from './Icon'

interface ContextHelpButtonProps {
  label: string
  onClick: () => void
}

export function ContextHelpButton({ label, onClick }: ContextHelpButtonProps) {
  return <button type="button" className={styles.button} aria-label={label} onClick={onClick}>
    <Icon name="help" />
  </button>
}
