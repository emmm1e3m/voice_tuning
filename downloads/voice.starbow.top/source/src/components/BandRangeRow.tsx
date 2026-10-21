import { useId, useRef } from 'react'
import { useAppStore } from '../store/appStore'
import { BAND_INPUT_LIMITS } from '../config/analysisRanges'
import { getBandCenter, getTargetCenterBounds, TARGET_HALF_WIDTH_HZ } from '../config/targetBandRules'
import { BandValidationBubble } from './mobile/BandValidationBubble'
import { BandRangeSlider } from './mobile/BandRangeSlider'
import type { BandKey, PresetBandsApi } from '../hooks/usePresetBands'
import styles from './BandRangeRow.module.css'

export interface BandRangeRowProps { bandKey: BandKey; api: PresetBandsApi }

export function BandRangeRow({ bandKey, api }: BandRangeRowProps) {
  const bands = useAppStore(state => state.bands)
  const [min, max] = getTargetCenterBounds(bandKey, bands)
  const messageId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const message = api.inputMessages[bandKey]
  return (
    <div className={styles.control} data-band={bandKey}>
      <label className={styles.row}>
        <span className={styles.caption}>中心</span>
        <span className={`${styles.inputBox}${message ? ` ${styles.warning}` : ''}`}>
          <input ref={inputRef} type="number" inputMode="decimal" min={min} max={max} step={BAND_INPUT_LIMITS[bandKey].step}
            value={api.localValues[bandKey]} aria-label={`${bandKey.toUpperCase()}目标中心`}
            aria-describedby={message ? messageId : undefined}
            onChange={event => api.onInputChange(bandKey, event.target.value)}
            onBlur={() => api.onCommit(bandKey)} onKeyDown={api.onInputKeyDown(bandKey)} />
          <span>Hz</span>
        </span>
        <span className={styles.width}>±{TARGET_HALF_WIDTH_HZ[bandKey]} Hz</span>
      </label>
      <BandRangeSlider bandKey={bandKey} value={getBandCenter(bands[bandKey].range)}
        onChange={value => api.onSliderChange(bandKey, value)} onBoundary={text => api.showInputMessage(bandKey, text)} />
      {message && <BandValidationBubble id={messageId} index={0} anchor={inputRef.current}
        message={message} onClose={() => api.showInputMessage(bandKey, '')} />}
    </div>
  )
}
