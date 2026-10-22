import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom'
import type { StatisticsSnapshot } from '../statistics/types'
import { STATISTICS_MATERIALS } from '../statistics/materials'

const session = vi.hoisted(() => ({
  snapshot: {} as StatisticsSnapshot,
  start: vi.fn(), pause: vi.fn(), resume: vi.fn(), finish: vi.fn(), importFile: vi.fn(), cancel: vi.fn(), retry: vi.fn(),
}))
vi.mock('../statistics/StatisticsSessionProvider', () => ({ useStatisticsSession: () => session }))
vi.mock('../statistics/StatisticsReport', () => ({ StatisticsReport: () => <div>report-content</div> }))

import { StatisticsPage } from '../routes/StatisticsPage'

function renderPage() {
  return render(<MemoryRouter><Routes><Route element={<Outlet context={{ onOpenHelp: vi.fn() }} />}><Route index element={<StatisticsPage />} /></Route></Routes></MemoryRouter>)
}

beforeEach(() => {
  vi.clearAllMocks()
  session.snapshot = { phase: 'ready', material: null, elapsed: 0, atLimit: false, progress: 0, error: null, report: null }
})
afterEach(cleanup)

describe('StatisticsPage', () => {
  it('offers two Chinese and two English passages plus free speaking and starts with the chosen material', () => {
    renderPage()
    expect(STATISTICS_MATERIALS.filter(item => item.language === 'zh')).toHaveLength(2)
    expect(STATISTICS_MATERIALS.filter(item => item.language === 'en')).toHaveLength(2)
    const english = STATISTICS_MATERIALS.find(item => item.language === 'en')!
    fireEvent.change(screen.getByLabelText('选择内容'), { target: { value: english.id } })
    expect(screen.getByRole('article', { name: '朗读正文' }).getAttribute('lang')).toBe('en')
    expect(screen.getByText(english.text)).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: '开始录音' }))
    expect(session.start).toHaveBeenCalledWith({ id: english.id, title: english.title })
    fireEvent.change(screen.getByLabelText('选择内容'), { target: { value: 'free' } })
    fireEvent.click(screen.getByRole('button', { name: '开始录音' }))
    expect(session.start).toHaveBeenLastCalledWith(null)
  })

  it('restores a paused passage and offers continuation or completion without changing material mid-clip', () => {
    const passage = STATISTICS_MATERIALS[3]
    session.snapshot = { ...session.snapshot, phase: 'paused', elapsed: 12.2, material: passage }
    renderPage()
    expect((screen.getByLabelText('选择内容') as HTMLSelectElement).value).toBe(passage.id)
    expect((screen.getByLabelText('选择内容') as HTMLSelectElement).disabled).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: '继续录音' }))
    expect(session.resume).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByRole('button', { name: '完成并分析' }))
    expect(session.finish).toHaveBeenCalledOnce()
  })

  it('prevents continuation at the one-minute limit while keeping analysis available', () => {
    session.snapshot = { ...session.snapshot, phase: 'paused', elapsed: 60, atLimit: true }
    renderPage()
    expect((screen.getByRole('button', { name: '继续录音' }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: '完成并分析' }) as HTMLButtonElement).disabled).toBe(false)
    expect(screen.getByText('已录满 60 秒，请完成并分析。')).toBeDefined()
  })

  it('passes the selected file to the independent importer', () => {
    renderPage()
    const file = new File(['audio'], 'voice.wav', { type: 'audio/wav' })
    fireEvent.change(screen.getByLabelText('导入统计音频'), { target: { files: [file] } })
    expect(session.importFile).toHaveBeenCalledWith(file)
  })

  it('hides the previous report during a new clip and restores it after cancellation', () => {
    session.snapshot.report = { id: 'previous-report' } as NonNullable<StatisticsSnapshot['report']>
    const view = renderPage()
    expect(screen.getByText('report-content')).toBeDefined()

    for (const phase of ['requesting', 'recording', 'paused', 'importing', 'analyzing'] as const) {
      session.snapshot = { ...session.snapshot, phase }
      view.rerender(<MemoryRouter><Routes><Route element={<Outlet context={{ onOpenHelp: vi.fn() }} />}><Route index element={<StatisticsPage />} /></Route></Routes></MemoryRouter>)
      expect(screen.queryByText('report-content')).toBeNull()
      expect(screen.queryByText('从一段自然说话开始')).toBeNull()
    }

    session.snapshot = { ...session.snapshot, phase: 'ready' }
    view.rerender(<MemoryRouter><Routes><Route element={<Outlet context={{ onOpenHelp: vi.fn() }} />}><Route index element={<StatisticsPage />} /></Route></Routes></MemoryRouter>)
    expect(screen.getByText('report-content')).toBeDefined()
  })
})
