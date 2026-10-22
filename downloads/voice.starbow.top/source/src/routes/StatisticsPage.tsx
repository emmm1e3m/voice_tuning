import { useEffect, useRef, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Button } from '../components/Button'
import { ContextHelpButton } from '../components/ContextHelpButton'
import { useStatisticsSession } from '../statistics/StatisticsSessionProvider'
import { StatisticsReport } from '../statistics/StatisticsReport'
import { STATISTICS_MATERIALS } from '../statistics/materials'
import type { StatisticsPhase } from '../statistics/types'
import type { ShellContext } from './AppShell'
import styles from './StatisticsPage.module.css'

const PHASE_LABELS: Record<StatisticsPhase, string> = {
  ready: '准备录音', requesting: '等待麦克风授权', recording: '正在录音', paused: '录音已暂停',
  importing: '正在读取音频', analyzing: '正在分析', error: '需要重试',
}

function clock(seconds: number) {
  const value = Math.floor(seconds)
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`
}

export function StatisticsPage() {
  const shell = useOutletContext<ShellContext>()
  const { snapshot, start, pause, resume, finish, importFile, cancel, retry } = useStatisticsSession()
  const [materialId, setMaterialId] = useState(() => ['paused', 'recording', 'requesting'].includes(snapshot.phase)
    ? snapshot.material?.id ?? 'free' : STATISTICS_MATERIALS[0].id)
  const [fontSize, setFontSize] = useState(16)
  const fileRef = useRef<HTMLInputElement>(null)
  const reportRef = useRef<HTMLDivElement>(null)
  const lastReportRef = useRef(snapshot.report?.id)
  const material = STATISTICS_MATERIALS.find(item => item.id === materialId)
  const { phase, elapsed, atLimit, progress, error, report } = snapshot
  const hasDraft = ['requesting', 'recording', 'paused'].includes(phase)
  const processing = phase === 'importing' || phase === 'analyzing'
  const recording = phase === 'recording'

  useEffect(() => {
    if (report && report.id !== lastReportRef.current) {
      lastReportRef.current = report.id
      reportRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
      reportRef.current?.focus({ preventScroll: true })
    }
  }, [report])

  return (
    <main className={styles.page} aria-label="统计分析">
      <div className={styles.inner}>
        <header className={styles.header}>
          <div>
            <h1 className="page-title">统计分析</h1>
            <p>录一段自然说话，了解常用音高与声音的起伏。</p>
          </div>
          <ContextHelpButton label="统计分析使用说明" onClick={() => shell.onOpenHelp?.('statistics')} />
        </header>

        <div className={styles.workspace}>
          <section className={styles.reader} aria-labelledby="reading-title">
            <div className={styles.readerHeader}>
              <h2 id="reading-title">朗读材料</h2>
              <div className={styles.fontControls} aria-label="朗读字号">
                <button type="button" aria-label="减小朗读字号" disabled={fontSize === 14} onClick={() => setFontSize(value => value - 2)}>A−</button>
                <button type="button" aria-label="增大朗读字号" disabled={fontSize === 22} onClick={() => setFontSize(value => value + 2)}>A＋</button>
              </div>
            </div>
            <label className={styles.materialLabel} htmlFor="statistics-material">选择内容</label>
            <select id="statistics-material" className={styles.materialSelect} value={materialId} disabled={hasDraft || processing} onChange={event => setMaterialId(event.target.value)}>
              <optgroup label="中文">
                {STATISTICS_MATERIALS.filter(item => item.language === 'zh').map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
              </optgroup>
              <optgroup label="English">
                {STATISTICS_MATERIALS.filter(item => item.language === 'en').map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
              </optgroup>
              <option value="free">自由说话</option>
            </select>
            <article className={styles.readingText} lang={material?.language === 'en' ? 'en' : 'zh-CN'} style={{ fontSize }} aria-label="朗读正文">
              <h3>{material?.title ?? '说说此刻的想法'}</h3>
              <p>{material?.text ?? '选一个熟悉的话题，像平常聊天一样说一段话。可以聊聊今天的经历、喜欢的一种声音，或最近练习中的发现。'}</p>
            </article>
          </section>

          <section className={styles.recorder} data-draft={hasDraft} aria-labelledby="recording-title">
            <h2 id="recording-title">录制与分析</h2>
            <p className={styles.description}>建议自然说话 30–60 秒，也可以导入已有录音。</p>
            <div className={styles.status} data-recording={recording} role="status">
              <span className={styles.statusDot} aria-hidden="true" />{PHASE_LABELS[phase]}
            </div>
            <div className={styles.timer} role="timer" aria-label={`已录制 ${elapsed.toFixed(1)} 秒，最多 60 秒`}>
              {clock(elapsed)} <span>/ 01:00</span>
            </div>
            <progress className={styles.durationProgress} aria-label="录音时长" value={Math.min(60, elapsed)} max={60} />

            <div className={styles.actions}>
              {phase === 'recording' ? <Button variant="primary" onClick={pause}>暂停录音</Button>
                : phase === 'paused' ? <>
                  <Button variant="primary" disabled={atLimit} onClick={() => void resume()}>继续录音</Button>
                  <Button onClick={finish} disabled={elapsed === 0}>完成并分析</Button>
                </>
                  : phase === 'requesting' ? <Button variant="primary" disabled>麦克风授权中…</Button>
                    : processing ? <div className={styles.processing}>
                      <span>{PHASE_LABELS[phase]}…</span>
                      {phase === 'analyzing' && <progress max={1} value={progress} aria-label="分析进度" />}
                    </div>
                      : phase === 'error' ? <>
                        <Button variant="primary" onClick={retry}>重试分析</Button>
                        <Button onClick={cancel}>重新准备</Button>
                      </>
                        : <>
                          <Button variant="primary" onClick={() => void start(material ? { id: material.id, title: material.title } : null)}>开始录音</Button>
                          <Button onClick={() => fileRef.current?.click()}>导入音频</Button>
                        </>}
            </div>
            {(hasDraft || processing) && <Button variant="ghost" className={styles.cancel} onClick={cancel}>{processing ? phase === 'importing' ? '取消导入' : '取消分析' : elapsed > 0 ? '丢弃本段' : '取消'}</Button>}
            {atLimit && phase === 'paused' && <p className={styles.notice}>已录满 60 秒，请完成并分析。</p>}
            {phase === 'paused' && !atLimit && <p className={styles.description}>片段已保留，可以继续录音或完成分析。</p>}
            {error && <p className={styles.error} role="alert">{error}</p>}
            <p className={styles.privacy}>音频仅在本地处理。录音与报告在本次打开期间保留。</p>
            <input ref={fileRef} type="file" accept="audio/*" hidden aria-label="导入统计音频" onChange={event => {
              const file = event.target.files?.[0]
              event.target.value = ''
              if (file) void importFile(file)
            }} />
          </section>
        </div>

        {!hasDraft && !processing && (report ? <div ref={reportRef} tabIndex={-1} className={styles.report}>
          <StatisticsReport report={report} />
        </div> : <div className={styles.empty}>
          <span className={styles.emptyChart} aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></span>
          <h2>从一段自然说话开始</h2>
          <p>完成录音后，这里会显示典型 F0、常用音高范围和分布，并支持回听。</p>
        </div>)}
      </div>
    </main>
  )
}
