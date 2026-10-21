import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, act } from '@testing-library/react'
import { FormantChart } from '../components/FormantChart'
import { useAppStore } from '../store/appStore'
import { useChartDisplayStore } from '../store/chartDisplayStore'

const { setOptionMock, getInstanceMock } = vi.hoisted(() => ({
  setOptionMock: vi.fn(),
  getInstanceMock: vi.fn(() => null),
}))

vi.mock('../hooks/useECharts', () => ({
  useECharts: () => ({
    chartRef: { current: document.createElement('div') },
    setOption: setOptionMock,
    getInstance: getInstanceMock,
  }),
}))

function lastOption() {
  const calls = setOptionMock.mock.calls
  return calls[calls.length - 1][0]
}

function seriesByName(name: string) {
  return lastOption().series.find((s: { name: string }) => s.name === name)
}

const FRAMES = [
  { time: 0.1, f0: 220, f1: 900, f2: 1200 },
  { time: 0.2, f0: 225, f1: 920, f2: 1250 },
]

describe('FormantChart', () => {
  beforeEach(() => {
    useAppStore.getState().reset()
    setOptionMock.mockClear()
    useChartDisplayStore.getState().setShowRegister(true)
  })

  it('renders data for all series by default', () => {
    useAppStore.getState().setFrames(FRAMES)
    render(<FormantChart />)
    expect(seriesByName('F1').data).toHaveLength(2)
    expect(seriesByName('F1').markLine).toBeDefined()
  })

  it('empties data and removes markLine for hidden series', () => {
    useAppStore.getState().setFrames(FRAMES)
    useAppStore.getState().toggleFormantVisible('f1')
    render(<FormantChart />)
    expect(seriesByName('F1').data).toEqual([])
    expect(seriesByName('F1').markLine).toBeUndefined()
    expect(seriesByName('F0').data).toHaveLength(2)
    expect(seriesByName('F2').data).toHaveLength(2)
  })

  it('re-renders when store formantVisible changes', () => {
    useAppStore.getState().setFrames(FRAMES)
    render(<FormantChart />)
    expect(seriesByName('F0').data).toHaveLength(2)

    act(() => {
      useAppStore.getState().toggleFormantVisible('f0')
    })

    expect(seriesByName('F0').data).toEqual([])
    expect(seriesByName('F0').markLine).toBeUndefined()
  })
  it('colors register time segments independently of visible frequencies and can hide them', () => {
    useAppStore.getState().setFrames([{ time: .1, f0: 220, f1: 900, f2: 1250, register: 'mixed' }])
    for (const key of ['f0', 'f1', 'f2'] as const) useAppStore.getState().toggleFormantVisible(key)
    render(<FormantChart />)
    const area = seriesByName('__register').markArea.data[0]
    expect(area[0].name).toBe('混声')
    expect(area[0].xAxis).toBeCloseTo(.095)
    expect(area[1].xAxis).toBeCloseTo(.105)
    act(() => useChartDisplayStore.getState().setShowRegister(false))
    expect(seriesByName('__register').markArea.data).toEqual([])
  })
})
