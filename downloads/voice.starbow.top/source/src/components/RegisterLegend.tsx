import { REGISTER_COLORS } from '../utils/registerSegments'
import { VOICE_REGISTER_LABELS } from '../feedback/register'
import { useChartDisplayStore } from '../store/chartDisplayStore'
import styles from './RegisterLegend.module.css'

export function RegisterLegend() {
  const show = useChartDisplayStore(state => state.showRegister)
  if (!show) return null
  return <div className={styles.legend} aria-label="声区背景图例"><span>时间背景 · 声区估计</span>{(['chest', 'mixed', 'falsetto'] as const).map(key => <span key={key}><i style={{ background: REGISTER_COLORS[key] }} />{VOICE_REGISTER_LABELS[key]}</span>)}<span>无数据留白</span></div>
}
