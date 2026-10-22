import { useEffect, useRef, useState } from 'react'
import { encodeWav } from '../audio/wavExport'
import { useECharts } from '../hooks/useECharts'
import { buildDistributionOption } from './chartOptions'
import type { PitchSummary, StatisticsReport as ReportData } from './types'
import styles from './StatisticsReport.module.css'

interface StatisticsReportProps {
  report: ReportData
  active?: boolean
}

function DistributionChart({ summary, showPercentiles }: { summary: PitchSummary; showPercentiles: boolean }) {
  const { chartRef, setOption } = useECharts()
  useEffect(() => {
    setOption(buildDistributionOption(summary, showPercentiles), { notMerge: true })
  }, [summary, showPercentiles, setOption])

  return <div
    ref={chartRef}
    className={styles.chart}
    role="img"
    aria-label="60至500赫兹音高分布直方图，纵轴为有效音高时长占比"
  />
}

export function StatisticsReport({ report, active = true }: StatisticsReportProps) {
  const { clip, analysis } = report
  const summary = analysis.summary
  const enough = summary.validDuration + 1e-9 >= 3
  const audioRef = useRef<HTMLAudioElement>(null)
  const [audioUrl, setAudioUrl] = useState<string>()

  useEffect(() => {
    const audio = audioRef.current
    const url = URL.createObjectURL(new Blob([encodeWav(clip.samples, clip.sampleRate)], { type: 'audio/wav' }))
    setAudioUrl(url)
    return () => {
      audio?.pause()
      URL.revokeObjectURL(url)
    }
  }, [clip])

  useEffect(() => {
    if (!active) audioRef.current?.pause()
  }, [active])

  const frequency = (value: number | null) => enough && value !== null ? value.toFixed(0) : '—'

  return <section className={styles.report} aria-labelledby="statistics-report-title">
    <header className={styles.header}>
      <div className={styles.identity}>
        <h2 id="statistics-report-title">本次统计</h2>
        <p>{clip.source === 'file' ? `导入音频 · ${clip.name}` : clip.material?.title ?? '自由说话'}</p>
      </div>
      <div className={styles.durations}>
        <span>录音 <strong>{clip.duration.toFixed(1)} 秒</strong></span>
        <span>有效 F0 <strong>{summary.validDuration.toFixed(1)} 秒</strong> · {(summary.coverage * 100).toFixed(0)}%</span>
      </div>
    </header>

    {!enough && <p className={styles.notice} role="status">有效音高不足 3 秒，请录制更长的说话片段后查看统计指标。</p>}
    {enough && summary.validDuration < 10 - 1e-9 && <p className={styles.notice} role="status">有效音高样本较少，结果仅供本段参考。</p>}

    <dl className={styles.metrics}>
      <div className={styles.median} data-testid="statistics-median">
        <dt>典型 F0</dt>
        <dd>{frequency(summary.median)}{enough && summary.median !== null && <small>Hz</small>}</dd>
        <p>音高中位数</p>
      </div>
      <div data-testid="statistics-p10">
        <dt>P10</dt>
        <dd>{frequency(summary.p10)}{enough && summary.p10 !== null && <small>Hz</small>}</dd>
        <p>常用范围下界</p>
      </div>
      <div data-testid="statistics-p90">
        <dt>P90</dt>
        <dd>{frequency(summary.p90)}{enough && summary.p90 !== null && <small>Hz</small>}</dd>
        <p>常用范围上界</p>
      </div>
    </dl>

    <div className={styles.playback}>
      <span>回听完整录音</span>
      <audio aria-label="回听完整录音" ref={audioRef} src={audioUrl} controls preload="metadata" onPlay={event => { if (!active) event.currentTarget.pause() }} />
    </div>

    <section className={styles.distribution} aria-labelledby="statistics-distribution-title">
      <div className={styles.chartHeader}>
        <h3 id="statistics-distribution-title">音高分布</h3>
        {enough && <span><i aria-hidden="true" />P10–P90 范围</span>}
      </div>
      {summary.validDuration > 0
        ? <DistributionChart summary={summary} showPercentiles={enough} />
        : <p className={styles.empty}>未检测到有效音高。可以先回听录音，检查收音或换一段录音。</p>}
    </section>

    <details className={styles.explanation}>
      <summary>如何理解这些数据</summary>
      <p>典型 F0 采用中位数；P10–P90 描述中间约 80% 的常用音高范围，不代表最低和最高音。相同音高重复较多时，落入范围的比例可能更高。</p>
      <p>统计采用整段录音中 60–500 Hz 的有效音高，按每 10 Hz 分组；柱高是各组占有效音高时长的比例。停顿、无效音高与疑似短暂孤立跳点不按 0 Hz 计入。有效时间比例也不代表识别准确率。</p>
      <p>已排除 {summary.excludedCount} 帧疑似孤立跳点；超过 500 Hz 的检测值共 {summary.aboveLimitCount} 帧（{summary.aboveLimitDuration.toFixed(2)} 秒）{summary.aboveLimitProportion !== null && `，占过滤前有效候选时长的 ${(summary.aboveLimitProportion * 100).toFixed(1)}%`}。超出范围可能是真实高音，不能直接视为误检。</p>
      <p>回放保留完整录音。音频与统计结果仅在本次打开期间保留，刷新页面后清除。</p>
    </details>
  </section>
}
