import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom'
import { AnalysisPage } from '../routes/AnalysisPage'
import { useAppStore } from '../store/appStore'

vi.mock('../hooks/useECharts', () => ({
  useECharts: () => ({ chartRef: { current: null }, setOption: vi.fn(), getInstance: () => null }),
}))

function renderAnalysis(portrait: boolean, onOpenHelp = vi.fn()) {
  vi.stubGlobal('matchMedia', () => ({ matches: portrait, addEventListener() {}, removeEventListener() {} }))
  return render(<MemoryRouter><Routes>
    <Route element={<Outlet context={{ cursorTime: -1, hasData: true, onOpenHelp }} />}>
      <Route index element={<AnalysisPage />} />
    </Route>
  </Routes></MemoryRouter>)
}

beforeEach(() => { useAppStore.getState().reset() })
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

describe('main window frequency results', () => {
  it.each([false, true])('shows recent window medians above the single chart (portrait=%s)', portrait => {
    useAppStore.getState().setFrames([
      { time: 0, f0: 900, f1: 1900, f2: 3000 },
      { time: 21, f0: 200, f1: 500, f2: 1600 },
      { time: 22, f0: 220, f1: 600, f2: 1800 },
      { time: 23, f0: 800, f1: null, f2: 2000 },
    ])
    renderAnalysis(portrait)
    const results = screen.getByRole('region', { name: '窗口频率结果' })
    expect(within(results).getByText('最近 20 秒')).toBeTruthy()
    expect(screen.getByTestId('window-f0').textContent).toBe('220Hz')
    expect(screen.getByTestId('window-f1').textContent).toBe('550Hz')
    expect(screen.getByTestId('window-f2').textContent).toBe('1800Hz')
    expect(document.querySelectorAll('#formantChart')).toHaveLength(1)
    expect(document.querySelector('#f0Chart')).toBeNull()
    expect(results.compareDocumentPosition(screen.getByRole('main')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.queryByText('听见变化，看见进步。')).toBeNull()
    expect(screen.queryByText('练习的方向，由你定义。')).toBeNull()
    expect(within(results).getByText('声带的张力、长度与有效振动质量')).toBeTruthy()
    expect(within(results).getByText('舌位高低 · 下颌开口')).toBeTruthy()
    expect(within(results).getByText('舌位前后 · 圆唇 · 声道长度')).toBeTruthy()
  })

  it('refreshes the displayed results when the retention window changes', () => {
    vi.useFakeTimers()
    useAppStore.getState().setFrames([
      { time: 1, f0: 150, f1: 400, f2: 1000 },
      { time: 19, f0: 250, f1: 800, f2: 2000 },
    ])
    renderAnalysis(false)
    expect(screen.getByTestId('window-f0').textContent).toBe('200Hz')
    act(() => useAppStore.getState().setConfig({ audioRetentionSeconds: 10 }))
    act(() => vi.advanceTimersByTime(100))
    expect(screen.getByText('最近 10 秒')).toBeTruthy()
    expect(screen.getByTestId('window-f0').textContent).toBe('250Hz')
    expect(screen.getByTestId('window-f1').textContent).toBe('800Hz')
    expect(screen.getByTestId('window-f2').textContent).toBe('2000Hz')
  })

  it('updates from incoming frames and clears the previous session results', () => {
    vi.useFakeTimers()
    renderAnalysis(true)
    expect(screen.getByTestId('window-f0').textContent).toBe('—Hz')
    act(() => useAppStore.getState().setFrames([
      { time: 1, f0: 200, f1: 600, f2: 1400 },
      { time: 2, f0: 240, f1: 700, f2: 1600 },
    ]))
    act(() => vi.advanceTimersByTime(100))
    expect(screen.getByTestId('window-f0').textContent).toBe('220Hz')
    expect(screen.getByTestId('window-f1').textContent).toBe('650Hz')
    expect(screen.getByTestId('window-f2').textContent).toBe('1500Hz')
    act(() => useAppStore.getState().clearFrames())
    act(() => vi.advanceTimersByTime(100))
    for (const key of ['f0', 'f1', 'f2']) expect(screen.getByTestId(`window-${key}`).textContent).toBe('—Hz')
  })

  it('opens the matching lesson from each frequency result', () => {
    const onOpenHelp = vi.fn()
    renderAnalysis(false, onOpenHelp)
    for (const [topic, name] of [
      ['f0', 'F0 音高：原理与训练方法'],
      ['f1', 'F1 元音与开口：原理与训练方法'],
      ['f2', 'F2 共振与音色：原理与训练方法'],
    ]) {
      fireEvent.click(screen.getByRole('button', { name }))
      expect(onOpenHelp).toHaveBeenLastCalledWith(topic)
      expect(screen.getByTestId(`window-${topic}`).textContent).toBe('—Hz')
    }
  })

  it('keeps all three result cards visible when a chart curve is hidden', () => {
    useAppStore.getState().setFrames([{ time: 1, f0: 220, f1: 500, f2: 1800 }])
    renderAnalysis(false)
    const legend = screen.getByTestId('formant-legend')
    fireEvent.click(within(legend).getByRole('button', { name: 'F2' }))
    expect(within(legend).getByRole('button', { name: 'F2' }).getAttribute('aria-pressed')).toBe('false')
    expect(screen.getByTestId('window-f2').textContent).toBe('1800Hz')
    expect(screen.getByRole('region', { name: '窗口频率结果' }).querySelectorAll('button')).toHaveLength(3)
  })

  it.each([false, true])('shows each reading and target center in one result line (portrait=%s)', portrait => {
    useAppStore.getState().setFrames([{ time: 1, f0: 220, f1: 600, f2: 1800 }])
    renderAnalysis(portrait)
    for (const [key, target] of [['f0', 240], ['f1', 900], ['f2', 1250]] as const) {
      const reading = screen.getByTestId(`window-${key}`)
      const center = screen.getByTestId(`target-${key}`)
      expect(reading.parentElement).toBe(center.parentElement)
      expect(reading.parentElement?.className).toContain('resultLine')
      expect(reading.nextElementSibling?.textContent).toBe('/')
      expect(center.textContent).toBe(`目标 ${target} Hz`)
      expect(reading.parentElement?.textContent).not.toContain('±')
    }
  })

  it('updates the target center beside its reading after editing', () => {
    renderAnalysis(false)
    expect(screen.getByTestId('target-f0').textContent).toBe('目标 240 Hz')
    expect(screen.getByTestId('target-f1').textContent).toBe('目标 900 Hz')
    expect(screen.getByTestId('target-f2').textContent).toBe('目标 1250 Hz')
    act(() => useAppStore.getState().setBandCenter('f0', 260))
    expect(screen.getByTestId('target-f0').textContent).toBe('目标 260 Hz')
    expect(screen.getByTestId('window-f0').textContent).toBe('—Hz')
    expect(screen.getByTestId('target-f1').textContent).toBe('目标 900 Hz')
  })
})
