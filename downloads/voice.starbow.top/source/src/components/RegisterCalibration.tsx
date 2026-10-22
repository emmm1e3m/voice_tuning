import { useEffect, useId, useState } from 'react'
import { useAppStore } from '../store/appStore'
import { useRegisterCalibrationStore } from '../store/registerCalibrationStore'
import { calibrationSample, REGISTER_CALIBRATION_SECONDS } from '../dsp/register-calibration'
import type { RegisterCalibrationSample } from '../dsp/register-calibration'
import { HARMONIC_DB_FLOOR } from '../dsp/harmonic-amplitudes'
import { ANALYSIS_HOP_SECONDS } from '../config/audioLimits'
import styles from './RegisterCalibration.module.css'

interface RegisterCalibrationProps {
  isCapturing: boolean
  isRequesting: boolean
  onRecord: () => void
}

export function RegisterCalibration({ isCapturing, isRequesting, onRecord }: RegisterCalibrationProps) {
  const headingId = useId()
  const calibration = useRegisterCalibrationStore(state => state.calibration)
  const [active, setActive] = useState(false)
  const [duration, setDuration] = useState(0)
  const [status, setStatus] = useState('')

  useEffect(() => {
    if (!active) return
    if (!isCapturing) {
      setActive(false)
      setStatus('录音已暂停，本次采样未保存。')
      return
    }
    let samples: RegisterCalibrationSample[] = []
    const timeout = window.setTimeout(() => {
      setActive(false)
      setDuration(0)
      setStatus('未取得稳定的边界声，请保持同一元音后重试。')
    }, 12000)
    // 逐帧订阅，避免 React 合并更新时遗漏同一音频块中的分析帧。
    const unsubscribe = useAppStore.subscribe((state, previous) => {
      if (state.latestFrame === previous.latestFrame || !state.latestFrame) return
      const sample = calibrationSample(state.latestFrame)
      const last = samples[samples.length - 1]
      if (!sample || (last && (sample.time <= last.time || sample.time - last.time > ANALYSIS_HOP_SECONDS * 3))) {
        samples = []
        setDuration(0)
        setStatus('等待连续、清晰的边界声……')
        return
      }
      samples.push(sample)
      const elapsed = sample.time - samples[0].time + ANALYSIS_HOP_SECONDS
      setDuration(Math.min(elapsed, REGISTER_CALIBRATION_SECONDS))
      if (elapsed < REGISTER_CALIBRATION_SECONDS - ANALYSIS_HOP_SECONDS / 2) return
      if (useRegisterCalibrationStore.getState().saveSamples(samples)) {
        unsubscribe()
        window.clearTimeout(timeout)
        setActive(false)
        setStatus('校准已保存，当前录音与之后导入的音频均采用此边界。')
      } else {
        samples = []
        setDuration(0)
        setStatus('边界样本尚不稳定，请保持音高、元音和响度。')
      }
    })
    return () => {
      unsubscribe()
      window.clearTimeout(timeout)
    }
  }, [active, isCapturing])

  function start() {
    setDuration(0)
    setStatus('请维持真假音转换边界处的同一元音……')
    setActive(true)
  }

  return <section className={styles.root} aria-labelledby={headingId}>
    <div className={styles.heading}><h4 id={headingId}>声区校准</h4><span>{calibration ? '已校准' : '默认边界'}</span></div>
    <div className={styles.content}>
      <p>声区用于定位换声点、观察真假音过渡是否稳定；标签本身不代表音色好坏或女性化程度。</p>
      <p>在下方开始录音，找到你感受到的真假音转换边界。维持同一元音，点击「采集边界声」并保持音高与响度约 {REGISTER_CALIBRATION_SECONDS} 秒，程序将自动保存。请在相近音高、元音、响度与麦克风位置下比较；跨越较大音域时重新校准。</p>
      <p className={styles.method}>统计 H2–H10 中相对基频峰衰减不足 {HARMONIC_DB_FLOOR} dB 的谐波峰；F1/F2 是声道共振峰，不计入此数量。</p>
      {calibration && <p className={styles.result}>已标定边界 <strong>{calibration.boundaryCount.toFixed(1)} 个谐波峰</strong><span>F0 {Math.round(calibration.f0)} Hz</span></p>}
      <div className={styles.actions}>
        <button type="button" className={!isCapturing ? styles.primary : undefined} disabled={isRequesting} onClick={onRecord}>{isRequesting ? '麦克风授权中…' : isCapturing ? '停止录音' : '开始录音'}</button>
        <button type="button" className={styles.primary} disabled={!isCapturing || active} onClick={start}>{calibration ? '重新采样' : '采集边界声'}</button>
        {active && <button type="button" onClick={() => { setActive(false); setDuration(0); setStatus('本次采样已取消。') }}>取消采样</button>}
        {calibration && !active && <button type="button" onClick={() => { useRegisterCalibrationStore.getState().clearCalibration(); setStatus('已恢复默认声区边界。') }}>恢复默认</button>}
      </div>
      {active && <progress aria-label="边界声采样进度" max={REGISTER_CALIBRATION_SECONDS} value={duration} />}
      {status && <p className={styles.status} role="status">{status}</p>}
    </div>
  </section>
}
