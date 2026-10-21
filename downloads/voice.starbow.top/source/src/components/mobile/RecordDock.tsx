import { useEffect, useRef, useState, type Ref } from 'react'
import styles from './RecordDock.module.css'
import { Icon } from '../Icon'

export interface RecordDockProps {
  onRecord: () => void
  isCapturing: boolean
  isRequesting: boolean
  goalLabel: string
  onGoalClick: () => void
  showGoal?: boolean
  onClear?: () => void
  onPlayback?: () => void
  hasData?: boolean
  isPlaying?: boolean
  recordButtonRef?: Ref<HTMLButtonElement>
  onHeightChange?: (height: number) => void
}

function MicGlyph() {
  return <Icon name="mic" size={26} />
}

export function RecordDock({ onRecord, isCapturing, isRequesting, goalLabel, onGoalClick, showGoal = true, onClear, onPlayback, hasData, isPlaying, recordButtonRef, onHeightChange }: RecordDockProps) {
  const dockRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const dock = dockRef.current
    if (!dock || !onHeightChange) return
    const measure = () => onHeightChange(dock.getBoundingClientRect().height)
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(dock)
    return () => observer.disconnect()
  }, [onHeightChange])
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (!isCapturing) { setElapsed(0); return }
    const id = window.setInterval(() => setElapsed(s => s + 1), 1000)
    return () => window.clearInterval(id)
  }, [isCapturing])
  const timer = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`
  const micLabel = isRequesting ? '麦克风授权中' : isCapturing ? '停止录音' : '开始录音'
  return (
    <div
      ref={dockRef}
      className={styles.dock}
      data-portrait-dock="true"
      data-actions={Boolean(onClear || onPlayback)}
      data-goal-entry={showGoal}
      data-recording={isCapturing}
    >
      {showGoal && (
        <button type="button" className={styles.goal} onClick={onGoalClick}
          data-testid="dock-goal" aria-label="回到训练目标">
          <span className={styles.goalLabel} data-testid="dock-goal-label">{goalLabel}</span>
          <span className={styles.goalHint}>当前目标</span>
          <span className={styles.goalChevron} aria-hidden="true">›</span>
        </button>
      )}
      <span className={styles.micHalo} data-testid="dock-mic-halo">
        <button ref={recordButtonRef} type="button" className={styles.mic} data-recording={isCapturing}
          onClick={onRecord} disabled={isRequesting} aria-label={micLabel}>
          {isCapturing ? <Icon name="stop" /> : <MicGlyph />}
        </button>
      </span>
      {onClear && <button type="button" className={styles.action} onClick={onClear} disabled={!hasData}>
        <Icon name="clear" />清除图谱
      </button>}
      {onPlayback && <button type="button" className={styles.action} onClick={onPlayback} disabled={!hasData || isRequesting}>
        <Icon name={isPlaying ? 'stop' : 'play'} />{isPlaying ? '停止' : '回放'}
      </button>}
      <span className={styles.hint} data-testid="dock-hint">
        {isCapturing ? '正在录音' : '点击开始录音'}
      </span>
      {isCapturing && <span className={styles.timer} data-testid="dock-timer">{timer}</span>}
    </div>
  )
}
