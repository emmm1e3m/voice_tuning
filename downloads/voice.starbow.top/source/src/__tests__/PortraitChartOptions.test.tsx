import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, act, waitFor } from '@testing-library/react'
import { F0Chart } from '../components/F0Chart'
import { FormantChart } from '../components/FormantChart'
import { PitchChart } from '../components/PitchChart'
import { useAppStore } from '../store/appStore'
import { useChartDisplayStore } from '../store/chartDisplayStore'
import { FREQUENCY_COLORS, frequencyColor } from '../utils/frequencyChart'
import { AUDIO_WINDOW_SECONDS } from '../config/audioLimits'
import { getBandCenter } from '../config/targetBandRules'
import { freqToMidi } from '../utils/pitch'
import { CHART_FONT_SCALE } from '../utils/chartFormatting'

const { setOptionMock, getInstanceMock } = vi.hoisted(() => ({
  setOptionMock: vi.fn(), getInstanceMock: vi.fn(() => null),
}))
vi.mock('../hooks/useECharts', () => ({
  useECharts: () => ({ chartRef: { current: null }, setOption: setOptionMock, getInstance: getInstanceMock }),
}))

function setMatchMedia(matches: boolean) {
  const listeners: Array<(event: { matches: boolean }) => void> = []
  const mql = {
    matches,
    addEventListener: (_type: string, listener: typeof listeners[number]) => listeners.push(listener),
    removeEventListener: () => {},
  }
  Object.defineProperty(window, 'matchMedia', { writable: true, configurable: true, value: vi.fn(() => mql) })
  return (next: boolean) => {
    mql.matches = next
    act(() => { for (const listener of listeners) listener({ matches: next }) })
  }
}
function lastOption(): any { return setOptionMock.mock.calls[setOptionMock.mock.calls.length - 1]?.[0] }
function series(name: string): any { return lastOption().series.find((item: any) => item.name === name) }

beforeEach(() => {
  useAppStore.getState().reset()
  useChartDisplayStore.getState().setFrequencyScale('log')
  setOptionMock.mockClear()
})

describe.each([false, true])('frequency charts, portrait=%s', portrait => {
  beforeEach(() => setMatchMedia(portrait))

  it.each([F0Chart, FormantChart])('shows an empty chart with a usable positive log axis', Chart => {
    render(<Chart />)
    const option = lastOption()
    expect(option.yAxis.type).toBe('log')
    expect(option.yAxis.logBase).toBe(2)
    expect(option.yAxis.min).toBeGreaterThan(0)
    expect(option.yAxis.max).toBeGreaterThan(option.yAxis.min)
    expect(option.yAxis.axisLabel.formatter(1024)).toBe('1024 Hz')
    expect(option.xAxis).toMatchObject({ min: 0, max: AUDIO_WINDOW_SECONDS })
    expect(series('F0').data).toEqual([])
    expect(option.grid.left).toBeGreaterThanOrEqual(50)
  })

  it('keeps each line, area, guide and tooltip in the same metric color', () => {
    render(<FormantChart />)
    for (const key of ['f0', 'f1', 'f2'] as const) {
      const metric = series(key.toUpperCase())
      const color = FREQUENCY_COLORS[key]
      expect(metric.lineStyle.color).toBe(color)
      expect(metric.itemStyle.color).toBe(color)
      expect(metric.markArea.data[0][0].itemStyle.color).toBe(frequencyColor(color, 0.08))
      expect(metric.markLine.lineStyle.color).toBe(frequencyColor(color, 0.5))
      expect(metric.markLine.label.color).toBe(color)
      expect(lastOption().tooltip.formatter([{ seriesName: key.toUpperCase(), value: [1, 230] }])).toContain(color)
    }
  })

  it('takes the F0 target from the current preset and reacts to custom target changes', () => {
    render(<F0Chart />)
    const expectRange = (range: [number, number]) => {
      expect(series('F0').markArea.data[0].map((edge: any) => edge.yAxis)).toEqual(range)
      expect(series('F0').markLine.data[0].yAxis).toBe(getBandCenter(range))
      expect(series('F0').markLine.data[0].label.formatter).toBe('F0 目标')
    }
    expectRange(useAppStore.getState().bands.f0.range)
    act(() => { useAppStore.getState().setBands({ f0: [200, 300] }) })
    expectRange(useAppStore.getState().bands.f0.range)
  })

  it.each([F0Chart, FormantChart, PitchChart])('formats empty-chart crosshairs as integer Hz and seconds', Chart => {
    render(<Chart />)
    const value = Chart === PitchChart ? freqToMidi(451.924890466) : 451.924890466
    expect(lastOption().yAxis.axisPointer.label.formatter({ value })).toBe('452 Hz')
    expect(lastOption().xAxis.axisPointer.label.formatter({ value: 8.21 })).toBe('8 s')
    expect(lastOption().xAxis.axisLabel.formatter(0.2)).toBe('0.2 s')
    expect(lastOption().xAxis.axisPointer.label.fontSize).toBe(12 * CHART_FONT_SCALE)
    expect(lastOption().textStyle.fontSize).toBe(12 * CHART_FONT_SCALE)
  })

  it('keeps every target guide at its selected Hz center on either scale', () => {
    render(<FormantChart />)
    const assertCenters = () => {
      for (const key of ['f0', 'f1', 'f2'] as const) {
        expect(series(key.toUpperCase()).markLine.data[0].yAxis).toBe(getBandCenter(useAppStore.getState().bands[key].range))
        expect(series(key.toUpperCase()).markLine.label.fontSize).toBe(11 * CHART_FONT_SCALE)
      }
    }
    assertCenters()
    act(() => useChartDisplayStore.getState().setFrequencyScale('linear'))
    assertCenters()
    act(() => useChartDisplayStore.getState().setFrequencyScale('log'))
    assertCenters()
  })

  it('rounds the formant preview while leaving original chart samples and timestamps intact', () => {
    const frames = [{ time: 8.21, f0: 221.7, f1: 451.924890466, f2: 1250.6 }]
    useAppStore.getState().setFrames(frames)
    render(<FormantChart />)
    const html = lastOption().tooltip.formatter([
      { seriesName: 'F0', value: [8.21, 221.7] },
      { seriesName: 'F1', value: [8.21, 451.924890466] },
      { seriesName: 'F2', value: [8.21, 1250.6] },
    ])
    expect(html).toContain('时间 8 s')
    expect(html).toContain('222 Hz')
    expect(html).toContain('452 Hz')
    expect(html).toContain('1251 Hz')
    expect(html).toContain('font-size:13.75px')
    expect(html).toContain('font-size:15px')
    expect(html).not.toContain('8.21 s')
    expect(series('F1').data).toEqual([[8.21, 451.924890466]])
    expect(useAppStore.getState().frames).toEqual(frames)
  })

  it.each([F0Chart, FormantChart])('switches scale without transforming Hz, gaps or playback time', Chart => {
    const values = [100, 0, -1, NaN, Infinity, null, 200, 400]
    const frames = values.map((value, time) => ({ time, f0: value, f1: value, f2: value }))
    useAppStore.getState().setFrames(frames)
    render(<Chart cursorTime={2.5} />)
    const expected = values.map((value, time) => [time, typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null])
    expect(series('F0').data).toEqual(expected)
    expect(series('F0').connectNulls).toBe(false)
    expect(series('__cursor').markLine.data).toEqual([{ xAxis: 2.5 }])
    act(() => { useChartDisplayStore.getState().setFrequencyScale('linear') })
    expect(lastOption().yAxis.type).toBe('value')
    expect(lastOption().yAxis.min).toBe(0)
    expect(series('F0').data).toEqual(expected)
    expect(series('__cursor').markLine.data).toEqual([{ xAxis: 2.5 }])
    expect(useAppStore.getState().frames).toEqual(frames)
  })

  it('includes a valid F0 above the old fixed 500 Hz limit', () => {
    useAppStore.getState().setFrames([{ time: 1, f0: 680, f1: 1000, f2: 2000 }])
    render(<F0Chart />)
    expect(lastOption().yAxis.max).toBeGreaterThanOrEqual(680)
    expect(series('F0').data).toEqual([[1, 680]])
  })
})

describe('responsive formant observations', () => {
  it('preserves every timestamp, gap and short peak in a full window', () => {
    setMatchMedia(true)
    const frames = Array.from({ length: 1000 }, (_, index) => ({
      time: 20 + index / 100, f0: 220 as number | null, f1: 900 as number | null, f2: 1200 as number | null,
    }))
    frames[499] = { time: 24.99, f0: null, f1: 3450, f2: null }
    useAppStore.getState().setFrames(frames)
    render(<FormantChart />)
    for (const name of ['F0', 'F1', 'F2']) {
      expect(series(name).data).toHaveLength(1000)
      expect(series(name).connectNulls).toBe(false)
      expect(series(name).lineStyle.width).toBeGreaterThan(0)
    }
    expect(series('F0').data[499]).toEqual([24.99, null])
    expect(series('F1').data[499]).toEqual([24.99, 3450])
    expect(series('F2').data[499]).toEqual([24.99, null])
  })

  it('keeps isolated observations visible and supports frame-selection hit targets', () => {
    setMatchMedia(true)
    useAppStore.getState().setFrames([900, 920, null, 940, null].map((value, time) => ({ time, f0: 220, f1: value, f2: 1200 })))
    const { rerender } = render(<FormantChart />)
    const metric = series('F1')
    expect(metric.showSymbol).toBe(true)
    expect(metric.data.map((value: unknown, dataIndex: number) => metric.symbol(value, { dataIndex })))
      .toEqual(['none', 'none', 'none', 'circle', 'none'])
    rerender(<FormantChart onFrameClick={() => {}} />)
    expect(series('F1').symbol).toBe('circle')
  })

  it('responds to viewport changes while retaining the current target and scale', () => {
    const resize = setMatchMedia(false)
    render(<F0Chart />)
    const target = series('F0').markArea.data
    expect(lastOption().grid.left).toBe(72)
    resize(true)
    expect(lastOption().grid.left).toBe(54)
    expect(series('F0').markArea.data).toEqual(target)
    expect(lastOption().yAxis.type).toBe('log')
  })

  it('marks the latest valid F0 instead of a nonfinite observation', () => {
    setMatchMedia(true)
    useAppStore.getState().setFrames([
      { time: 1, f0: 245, f1: 920, f2: 1250 },
      { time: 2, f0: Infinity, f1: 920, f2: 1250 },
    ])
    render(<F0Chart />)
    expect(series('F0').markPoint.data[0].coord).toEqual([1, 245])
    expect(series('F0').markPoint.itemStyle.color).toBe(FREQUENCY_COLORS.f0)
  })
})

describe.each([['F0', F0Chart], ['formants', FormantChart], ['pitch', PitchChart]] as const)('%s recording window', (_name, Chart) => {
  it.each([true, false])('follows the shared retained window (portrait=%s)', async portrait => {
    setMatchMedia(portrait)
    render(<Chart />)
    act(() => {
      for (let time = 0; time <= 35; time++) useAppStore.getState().appendFrame({ time, f0: 220, f1: 850, f2: 1250 })
    })
    await waitFor(() => expect(lastOption().xAxis).toMatchObject({ min: 35 - AUDIO_WINDOW_SECONDS, max: 35 }))
    act(() => { useAppStore.getState().appendFrame({ time: 36, f0: 225, f1: 860, f2: 1260 }) })
    await waitFor(() => expect(lastOption().xAxis).toMatchObject({ min: 36 - AUDIO_WINDOW_SECONDS, max: 36 }))
  })
})

describe.each([false, true])('shared chart timeline, portrait=%s', portrait => {
  it.each([F0Chart, FormantChart, PitchChart])('responds immediately to retention changes without changing frame timestamps', Chart => {
    setMatchMedia(portrait)
    const frames = [{ time: 34, f0: 220, f1: 850, f2: 1250 }, { time: 35, f0: 220, f1: 850, f2: 1250 }]
    useAppStore.getState().setFrames(frames)
    render(<Chart cursorTime={34.5} />)
    expect(lastOption().xAxis).toMatchObject({ min: 35 - AUDIO_WINDOW_SECONDS, max: 35 })
    act(() => useAppStore.getState().setConfig({ audioRetentionSeconds: 5 }))
    expect(lastOption().xAxis).toMatchObject({ min: 30, max: 35 })
    expect(series('__cursor').markLine.data).toEqual([{ xAxis: 34.5 }])
    expect(useAppStore.getState().frames).toEqual(frames)
  })

  it.each([
    { lastTime: 0, expected: { min: 0, max: 1 } },
    { lastTime: 2, expected: { min: 0, max: 2 } },
    { lastTime: 10, expected: { min: 0, max: 10 } },
    { lastTime: 20, expected: { min: 20 - AUDIO_WINDOW_SECONDS, max: 20 } },
    { lastTime: 35, expected: { min: 35 - AUDIO_WINDOW_SECONDS, max: 35 } },
  ])('uses the same visible time window ending at $lastTime seconds across three charts', ({ lastTime, expected }) => {
    setMatchMedia(portrait)
    const frames = [0, lastTime].map(time => ({ time, f0: 220, f1: 850, f2: 1250 }))
    useAppStore.getState().setFrames(frames)
    const ChartViews = [
      (cursor: number) => <F0Chart cursorTime={cursor} />,
      (cursor: number) => <FormantChart cursorTime={cursor} />,
      (cursor: number) => <PitchChart cursorTime={cursor} layout={portrait ? 'portrait' : 'landscape'} />,
    ]
    for (const view of ChartViews) {
      const cursor = Math.max(0, lastTime - 0.5)
      const { rerender, unmount } = render(view(cursor))
      expect(lastOption().xAxis).toMatchObject(expected)
      expect(lastOption().xAxis.splitNumber).toBe(portrait ? 3 : 4)
      expect(lastOption().xAxis.axisLabel.show).toBe(true)
      expect(lastOption().xAxis.axisLabel.formatter(1.5)).toBe('1.5 s')
      expect(lastOption().grid.bottom).toBeGreaterThanOrEqual(24)
      expect(series('__cursor').markLine.data).toEqual([{ xAxis: cursor }])
      rerender(view(lastTime))
      expect(lastOption().xAxis).toMatchObject(expected)
      expect(series('__cursor').markLine.data).toEqual([{ xAxis: lastTime }])
      unmount()
    }
    expect(useAppStore.getState().frames).toEqual(frames)
  })
})
