import { useRef, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import { BAND_INPUT_LIMITS } from '../../config/analysisRanges'
import { getTargetCenterBounds } from '../../config/targetBandRules'
import { useAppStore } from '../../store/appStore'
import type { BandKey } from '../../hooks/usePresetBands'
import styles from './TrainingGoalCard.module.css'

interface BandRangeSliderProps {
  bandKey: BandKey
  value: number
  onChange: (value: number) => void
  onBoundary: (message: string) => void
}

// 桌面与手机共用一个中心滑块；固定宽度交给同一套目标规则维护。
export function BandRangeSlider({ bandKey, value, onChange, onBoundary }: BandRangeSliderProps) {
  const bands = useAppStore(s => s.bands)
  const [min, max] = getTargetCenterBounds(bandKey, bands)
  const { step } = BAND_INPUT_LIMITS[bandKey]
  const gesture = useRef<{ x: number; center: number } | null>(null)
  const handleRef = useRef<HTMLButtonElement>(null)
  const lastBoundary = useRef('')
  const percent = max > min ? (value - min) / (max - min) * 100 : 0

  const update = (number: number) => {
    const next = Math.max(min, Math.min(max, number))
    if (next !== value) onChange(next)
    const message = number <= min ? `已到中心下限 ${min} Hz` : number >= max ? `已到中心上限 ${max} Hz` : ''
    if (message !== lastBoundary.current) {
      lastBoundary.current = message
      onBoundary(message)
    }
    return next
  }
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const origin = gesture.current
    const rect = event.currentTarget.getBoundingClientRect()
    if (!origin || !rect.width) return
    const delta = (event.clientX - origin.x) / rect.width * (max - min)
    update(origin.center + Math.round(delta / step) * step)
  }
  const onKeyDown = (event: KeyboardEvent) => {
    let next: number
    switch (event.key) {
      case 'ArrowLeft': case 'ArrowDown': next = value - step; break
      case 'ArrowRight': case 'ArrowUp': next = value + step; break
      case 'PageDown': next = value - step * 10; break
      case 'PageUp': next = value + step * 10; break
      case 'Home': next = min; break
      case 'End': next = max; break
      default: return
    }
    event.preventDefault()
    lastBoundary.current = ''
    update(next)
  }
  return (
    <div>
      <div className={styles.slider} role="group" data-band-slider aria-label={`${bandKey.toUpperCase()}中心调节`}
        style={{ '--center': `${Math.max(0, Math.min(100, percent))}%` } as CSSProperties}
        onPointerDown={event => {
          if (event.button !== 0 || gesture.current) return
          event.preventDefault()
          lastBoundary.current = ''
          const rect = event.currentTarget.getBoundingClientRect()
          const isHandle = (event.target as HTMLElement).closest('[data-handle]')
          const next = !isHandle && rect.width
            ? update(Math.round((min + (event.clientX - rect.left) / rect.width * (max - min)) / step) * step)
            : value
          gesture.current = { x: event.clientX, center: next }
          event.currentTarget.setPointerCapture(event.pointerId)
          handleRef.current?.focus({ preventScroll: true })
        }}
        onPointerMove={event => {
          if (gesture.current && event.currentTarget.hasPointerCapture(event.pointerId)) move(event)
        }}
        onPointerUp={event => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
          gesture.current = null
        }}
        onPointerCancel={() => { gesture.current = null }}
        onLostPointerCapture={() => { gesture.current = null }}>
        <div className={styles.track}><div className={styles.selection} /></div>
        <button ref={handleRef} type="button" role="slider" data-handle="center" className={styles.handle}
          style={{ left: `${Math.max(0, Math.min(100, percent))}%` }}
          aria-label={`${bandKey.toUpperCase()}中心滑杆`} aria-valuemin={min} aria-valuemax={max} aria-valuenow={value}
          aria-valuetext={`${value} Hz`} aria-orientation="horizontal" onKeyDown={onKeyDown} />
      </div>
      <div className={styles.scale}><span>{min}</span><span>{max} Hz</span></div>
    </div>
  )
}
