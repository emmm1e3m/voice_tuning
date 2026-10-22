import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { StatisticsReport } from '../statistics/StatisticsReport'
import { buildDistributionOption } from '../statistics/chartOptions'
import type { StatisticsReport as ReportData } from '../statistics/types'

const { setOption } = vi.hoisted(() => ({ setOption: vi.fn() }))
vi.mock('../hooks/useECharts', () => ({
  useECharts: () => ({ chartRef: { current: null }, setOption }),
}))

function report(validDuration = 12): ReportData {
  return {
    id: 'sample-report',
    createdAt: '2026-10-22T07:00:00.000Z',
    clip: { samples: new Float32Array(24000), sampleRate: 24000, duration: 20, source: 'mic', name: '录音', material: { id: 'voice', title: '听见自己的声音' } },
    analysis: {
      frames: [],
      summary: {
        median: 220, p10: 180, p90: 270, validDuration, coverage: validDuration / 20,
        excludedCount: 2, histogram: [{ from: 220, to: 230, count: 10, proportion: 1 }],
        aboveLimitCount: 10, aboveLimitDuration: 0.1, aboveLimitProportion: .01, candidateDuration: validDuration + .1,
      },
      settings: { sampleRate: 16000, frameSize: 800, hopSize: 160, f0Range: [60, 1000], statisticsRange: [60, 500], version: '1' },
    },
  }
}

describe('StatisticsReport', () => {
  const createUrl = vi.fn((_blob: Blob) => 'blob:statistics-audio')
  const revokeUrl = vi.fn()
  let pause: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.stubGlobal('URL', class extends URL {
      static createObjectURL = createUrl
      static revokeObjectURL = revokeUrl
    })
    pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    createUrl.mockClear()
    revokeUrl.mockClear()
    setOption.mockClear()
  })
  afterEach(() => {
    cleanup()
    pause.mockRestore()
    vi.unstubAllGlobals()
  })

  it('shows percentiles only with sufficient valid pitch while preserving complete audio playback', () => {
    const sample = report(2.9)
    const { rerender } = render(<StatisticsReport report={sample} />)
    expect(screen.getByRole('status').textContent).toContain('不足 3 秒')
    for (const metric of ['median', 'p10', 'p90']) {
      expect(within(screen.getByTestId(`statistics-${metric}`)).getByText('—')).toBeDefined()
    }
    const audio = screen.getByLabelText('回听完整录音') as HTMLAudioElement
    expect(audio.controls).toBe(true)
    expect(audio.getAttribute('src')).toBe('blob:statistics-audio')
    expect(createUrl.mock.calls[0][0]).toBeInstanceOf(Blob)

    rerender(<StatisticsReport report={report(8)} />)
    expect(screen.getByRole('status').textContent).toContain('样本较少')
    expect(screen.getByTestId('statistics-median').textContent).toContain('220Hz')
    expect(screen.getByTestId('statistics-p10').textContent).toContain('180Hz')
    expect(screen.getByTestId('statistics-p90').textContent).toContain('270Hz')
  })

  it('pauses inactive playback and releases the audio URL on unmount', () => {
    const sample = report()
    const { rerender, unmount } = render(<StatisticsReport report={sample} />)
    rerender(<StatisticsReport report={sample} active={false} />)
    expect(pause).toHaveBeenCalledOnce()
    unmount()
    expect(revokeUrl).toHaveBeenCalledWith('blob:statistics-audio')
    expect(pause).toHaveBeenCalledTimes(2)
  })

  it('keeps playback available when no valid pitch was detected', () => {
    const sample = report(0)
    sample.analysis.summary = { ...sample.analysis.summary, median: null, p10: null, p90: null, histogram: [] }
    render(<StatisticsReport report={sample} />)
    expect(screen.getByText(/未检测到有效音高/)).toBeDefined()
    expect(screen.getByLabelText('回听完整录音').getAttribute('src')).toBe('blob:statistics-audio')
    expect(screen.queryByRole('img')).toBeNull()
  })
})

describe('statistics distribution chart', () => {
  it('uses 44 bins over 60–500 Hz and time proportions on the vertical axis', () => {
    const option = buildDistributionOption(report().analysis.summary)
    const series = (option.series as Array<{ data: number[][]; markArea?: { data: unknown[] }; markLine?: unknown }>)[0]
    expect(series.data).toHaveLength(44)
    expect(series.data[0]).toEqual([65, 0])
    expect(series.data[series.data.length - 1]).toEqual([495, 0])
    expect(series.data[16]).toEqual([225, 100])
    expect(series.markArea?.data).toEqual([[{ xAxis: 180 }, { xAxis: 270 }]])
    expect(series.markLine).toBeDefined()
    const noPercentiles = buildDistributionOption(report(2).analysis.summary, false)
    expect((noPercentiles.series as Array<{ markLine?: unknown }>)[0].markLine).toBeUndefined()
  })
})
