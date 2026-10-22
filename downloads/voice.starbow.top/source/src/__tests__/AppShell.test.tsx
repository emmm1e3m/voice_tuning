import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useOutletContext } from 'react-router-dom'
import { useAppStore } from '../store/appStore'
import { AppShell, type ShellContext } from '../routes/AppShell'

const { setOptionMock, audioAction, suspendAudio, audioState } = vi.hoisted(() => ({ setOptionMock: vi.fn(), audioAction: vi.fn(), suspendAudio: vi.fn(), audioState: { capturing: false, playing: false } }))

vi.mock('../hooks/useECharts', () => ({
  useECharts: () => ({
    chartRef: { current: document.createElement('div') },
    setOption: setOptionMock,
    getInstance: () => null,
  }),
}))

vi.mock('../hooks/useToolbar', () => ({
  useToolbar: (onConfig: () => void, onHelp: () => void, onAbout: () => void) => ({
    toolItems: [
      { id: 'record', variant: 'primary', icon: '●', label: '开始录音' },
      { id: 'help', variant: 'ghost', icon: '?', label: '帮助' },
      { id: 'config', variant: 'ghost', icon: '⚙', label: '设置' },
      { id: 'playback', variant: 'ghost', icon: '▶', label: audioState.playing ? '停止' : '回放' },
    ],
    handleClickTool: (id: string) => id === 'help' ? onHelp() : id === 'config' ? onConfig() : id === 'about' ? onAbout() : audioAction(id),
    hasData: true,
    cursorTime: 3,
    isCapturing: audioState.capturing,
    isRequesting: false,
    fileInputRef: { current: null },
    handleFileChange: vi.fn(),
    suspend: suspendAudio,
  }),
}))

function ProbePage() {
  const ctx = useOutletContext<ShellContext>()
  return <div>practice-content {ctx.cursorTime}<button onClick={() => ctx.onOpenHelp?.('targets')}>目标说明</button></div>
}

function renderApp(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<div>analysis-content</div>} />
          <Route path="practice" element={<ProbePage />} />
          <Route path="statistics" element={<div>statistics-content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('AppShell', () => {
  beforeEach(() => {
    useAppStore.getState().reset()
    audioAction.mockClear()
    suspendAudio.mockClear()
    audioState.capturing = false
    audioState.playing = false
  })

  it('shows both navigation links and marks the analysis page active by default', () => {
    renderApp('/')
    expect(screen.getByText('analysis-content')).toBeDefined()
    expect(screen.getByRole('link', { name: '音高参考' })).toBeDefined()
    expect(screen.getByRole('link', { name: '声音分析' }).getAttribute('aria-current')).toBe('page')
  })

  it('navigates in both directions while preserving both link labels', () => {
    renderApp('/')
    fireEvent.click(screen.getByRole('link', { name: '音高参考' }))
    expect(screen.getByText(/practice-content/)).toBeDefined()
    expect(screen.getByRole('link', { name: '音高参考' }).getAttribute('aria-current')).toBe('page')
    fireEvent.click(screen.getByRole('link', { name: '声音分析' }))
    expect(screen.getByText('analysis-content')).toBeDefined()
    expect(screen.getByRole('link', { name: '声音分析' }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('link', { name: '音高参考' })).toBeDefined()
  })

  it('passes cursorTime through outlet context', () => {
    renderApp('/practice')
    expect(screen.getByText('practice-content 3')).toBeDefined()
  })

  it('suspends realtime audio on statistics entry and uses the statistics help without duplicate recording controls', () => {
    audioState.capturing = true
    renderApp('/')
    fireEvent.click(screen.getByRole('link', { name: '统计分析' }))
    expect(screen.getByText('statistics-content')).toBeDefined()
    expect(suspendAudio).toHaveBeenCalledOnce()
    expect(screen.queryByRole('button', { name: '开始录音' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /帮助/ }))
    expect(screen.getByRole('button', { name: '统计分析' }).getAttribute('aria-pressed')).toBe('true')
  })

  it.each(['idle', 'recording', 'playing'])('opens quick start without audio actions while %s', mode => {
    audioState.capturing = mode === 'recording'
    audioState.playing = mode === 'playing'
    renderApp('/')
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /帮助/ }))
    expect(screen.getByRole('button', { name: '快速上手' }).getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: '关闭' }))
    expect(audioAction).not.toHaveBeenCalled()
  })

  it('opens a requested topic through route context', () => {
    renderApp('/practice')
    fireEvent.click(screen.getByRole('button', { name: '目标说明' }))
    expect(screen.getByRole('button', { name: '训练目标' }).getAttribute('aria-pressed')).toBe('true')
    expect(audioAction).not.toHaveBeenCalled()
  })

  it.each([false, true])('connects configuration recording controls to the shared recorder while recording=%s', capturing => {
    audioState.capturing = capturing
    renderApp('/')
    fireEvent.click(screen.getByRole('button', { name: '设置' }))
    const dialog = screen.getByRole('dialog', { name: '配置' })
    fireEvent.click(within(dialog).getByRole('button', { name: capturing ? '停止录音' : '开始录音' }))
    expect(audioAction).toHaveBeenCalledWith('record')
    expect(screen.getByRole('dialog', { name: '配置' })).toBeDefined()
    expect((within(dialog).getByRole('button', { name: '采集边界声' }) as HTMLButtonElement).disabled).toBe(!capturing)
  })
})
