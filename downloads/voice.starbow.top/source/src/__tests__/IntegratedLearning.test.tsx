import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from '../routes/AppShell'
import { AnalysisPage } from '../routes/AnalysisPage'
import { useAppStore } from '../store/appStore'
import { useIntroHintStore } from '../store/introHintStore'

vi.mock('../hooks/useECharts', () => ({
  useECharts: () => ({ chartRef: { current: null }, setOption: vi.fn(), getInstance: () => null }),
}))

function renderStudio(portrait = false) {
  vi.stubGlobal('matchMedia', () => ({ matches: portrait, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
  return render(<MemoryRouter><Routes><Route element={<AppShell />}>
    <Route index element={<AnalysisPage />} />
  </Route></Routes></MemoryRouter>)
}

const DIMENSIONS = [
  { key: 'f0', card: 'F0 音高：使用说明', topic: 'F0 · 音高', principle: '在程序中观察 F0' },
  { key: 'f2', card: 'F2 共振与音色：使用说明', topic: 'F2 · 共振与元音', principle: '在程序中观察 F2' },
  { key: 'f1', card: 'F1 元音与开口：使用说明', topic: 'F1 · 开口与元音', principle: '在程序中观察 F1' },
] as const

describe('integrated learning entry points', () => {
  const getUserMedia = vi.fn()
  beforeEach(() => {
    localStorage.clear()
    useAppStore.getState().reset()
    useIntroHintStore.setState({ handled: true })
    getUserMedia.mockClear()
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia } })
  })

  it.each([false, true])('opens all three real learning cards and restores focus without recording (portrait=%s)', portrait => {
    renderStudio(portrait)
    for (const dimension of DIMENSIONS) {
      const trigger = screen.getByRole('button', { name: dimension.card })
      trigger.focus()
      fireEvent.click(trigger)
      const dialog = screen.getByRole('dialog', { name: '使用说明' })
      if (portrait) expect((within(dialog).getByRole('combobox', { name: '选择帮助主题' }) as HTMLSelectElement).value).toBe(dimension.key)
      else expect(within(dialog).getByRole('button', { name: dimension.topic }).getAttribute('aria-pressed')).toBe('true')
      expect(within(dialog).getByRole('heading', { name: dimension.principle })).toBeTruthy()
      expect(within(dialog).getByRole('link', { name: '阅读教学文档' }).getAttribute('href')).toBe('#/manual')
      fireEvent.keyDown(dialog, { key: 'Escape' })
      expect(screen.queryByRole('dialog')).toBeNull()
      expect(document.activeElement).toBe(trigger)
    }
    expect(getUserMedia).not.toHaveBeenCalled()
  })

  it.each(DIMENSIONS)('opens $key learning from the editable desktop target and returns to its trigger', dimension => {
    renderStudio()
    const targets = screen.getByRole('group', { name: '目标频率设置' })
    expect(targets.hasAttribute('open')).toBe(true)
    const trigger = within(targets).getByRole('button', { name: `${dimension.key.toUpperCase()} 目标说明` })
    trigger.focus()
    fireEvent.click(trigger)
    expect(screen.getByRole('button', { name: dimension.topic }).getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: '关闭' }))
    expect(document.activeElement).toBe(trigger)
    expect(getUserMedia).not.toHaveBeenCalled()
  })

  it('keeps source attribution in About while removing personal contact details', () => {
    renderStudio()
    fireEvent.click(screen.getByRole('button', { name: '关于' }))
    const dialog = screen.getByRole('dialog', { name: '关于与来源' })
    expect(dialog.textContent).not.toMatch(/249543142|@qq\.com|联系作者/)
    const urls = within(dialog).getAllByRole('link').map(link => link.getAttribute('href'))
    expect(urls).toEqual(['https://space.bilibili.com/942770', 'https://mtf-voice-training.vercel.app/', 'https://github.com/JPs-git/voice-builder', 'https://voice.starbow.top/'])
    expect(dialog.textContent).toContain('感谢原作者提供的文档与代码')
    expect(dialog.querySelector('a[href^="mailto:"], a[href*="qq.com"]')).toBeNull()
    expect(getUserMedia).not.toHaveBeenCalled()
  })
})
