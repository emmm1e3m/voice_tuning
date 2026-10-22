import { Modal } from '../Modal'
import { TrainingGoalCard } from './TrainingGoalCard'
import type { HelpTopic } from '../../content/helpContent'

interface TrainingGoalModalProps {
  open: boolean
  onClose: () => void
  onOpenHelp?: (topic: HelpTopic) => void
}

export function TrainingGoalModal({ open, onClose, onOpenHelp }: TrainingGoalModalProps) {
  return (
    <Modal open={open} title="目标频率设置" onClose={onClose}>
      <TrainingGoalCard onOpenHelp={onOpenHelp} />
    </Modal>
  )
}
