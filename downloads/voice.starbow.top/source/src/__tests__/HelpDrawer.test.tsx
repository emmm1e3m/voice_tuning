import { useRef, useState } from 'react'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { HelpDrawer } from '../components/HelpDrawer'
import type { HelpTopic } from '../content/helpContent'
import { Modal } from '../components/Modal'

function Harness({ initial = 'quick-start' }: { initial?: HelpTopic }) {
  const [open, setOpen] = useState(false)
  const [topic, setTopic] = useState(initial)
  return <><button onClick={() => setOpen(true)}>打开帮助</button><HelpDrawer open={open} onClose={() => setOpen(false)} topic={topic} onTopicChange={setTopic} /></>
}
function matchMedia() {
  const listeners = new Set<(event: { matches: boolean }) => void>()
  const mql = { matches: false, addEventListener: (_: string, listener: (e: { matches: boolean }) => void) => listeners.add(listener), removeEventListener: (_: string, listener: (e: { matches: boolean }) => void) => listeners.delete(listener) }
  vi.stubGlobal('matchMedia', vi.fn(() => mql))
  return (matches: boolean) => act(() => { mql.matches = matches; listeners.forEach(listener => listener({ matches })) })
}

describe('program help', () => {
  it('opens statistics guidance from the help directory', () => {
    matchMedia()
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: '打开帮助' }))
    fireEvent.click(within(screen.getByRole('navigation', { name: '帮助目录' })).getByRole('button', { name: '统计分析' }))
    expect(screen.getByRole('heading', { name: '统计分析' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: '中位数、P10/P90 与音高分布' })).toBeTruthy()
    expect(screen.getByText(/统计只纳入 60–500 Hz/)).toBeTruthy()
  })
  it('places an interactive time-frequency example directly in the chart-reading chapter', () => {
    matchMedia()
    render(<Harness initial="charts" />)
    fireEvent.click(screen.getByRole('button', { name: '打开帮助' }))
    const heading = screen.getByRole('heading', { name: '一张图看 F0、F1、F2' })
    const firstSection = heading.closest('section')!
    expect(within(firstSection).getByRole('figure', { name: 'F0、F1、F2 读图示例' })).toBeTruthy()
    expect(within(firstSection).getByText(/图内游标仍可查看频率与声区/)).toBeTruthy()
    fireEvent.click(within(firstSection).getByRole('button', { name: 'F0 示例曲线' }))
    expect(within(firstSection).queryByTestId('example-curve-f0')).toBeNull()
  })
  it('uses latest fallback for a connected trigger hidden with display:none', () => {
    function Probe() {
      const [open, setOpen] = useState(false)
      const [hidden, setHidden] = useState(false)
      const fallback = useRef<HTMLButtonElement>(null)
      return <><button style={{ display: hidden ? 'none' : undefined }} onClick={() => setOpen(true)}>原入口</button><button ref={fallback}>备用入口</button><Modal open={open} title="焦点检查" onClose={() => setOpen(false)} getFallbackFocus={() => fallback.current}><button onClick={() => setHidden(true)}>隐藏原入口</button></Modal></>
    }
    render(<Probe />)
    const original = screen.getByRole('button', { name: '原入口' })
    original.focus(); fireEvent.click(original)
    fireEvent.click(screen.getByRole('button', { name: '隐藏原入口' }))
    expect(original.isConnected).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: '关闭' }))
    expect(document.activeElement).toBe(screen.getByRole('button', { name: '备用入口' }))
  })
  it('opens on request, navigates chapters and restores the trigger on Escape', () => {
    matchMedia()
    render(<Harness />)
    expect(screen.queryByRole('dialog')).toBeNull()
    const trigger = screen.getByRole('button', { name: '打开帮助' })
    trigger.focus(); fireEvent.click(trigger)
    const dialog = screen.getByRole('dialog', { name: '使用说明' })
    expect(document.activeElement).toBe(dialog)
    fireEvent.click(within(screen.getByRole('navigation', { name: '帮助目录' })).getByRole('button', { name: '训练目标' }))
    expect(screen.getByRole('table', { name: /默认目标中心/ })).toBeTruthy()
    fireEvent.keyDown(dialog, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })
  it('keeps operation help separate from the manual and interactive demonstration', () => {
    matchMedia()
    render(<Harness initial="f2" />)
    fireEvent.click(screen.getByRole('button', { name: '打开帮助' }))
    expect(screen.getByRole('heading', { name: '在程序中观察 F2' })).toBeTruthy()
    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.queryByRole('region', { name: '发声部位交互图' })).toBeNull()
    expect(screen.getByRole('link', { name: '阅读教学文档' }).getAttribute('href')).toBe('#/manual')
    expect(screen.getByRole('link', { name: '打开交互演示' }).getAttribute('href')).toBe('#/interactive')
    fireEvent.click(screen.getByRole('button', { name: /下一项 F1/ }))
    expect(screen.getByRole('heading', { name: '在程序中观察 F1' })).toBeTruthy()
  })
  it('uses a single mobile selector and preserves logical directory focus across breakpoints', () => {
    const resize = matchMedia()
    render(<Harness initial="audio" />)
    fireEvent.click(screen.getByRole('button', { name: '打开帮助' }))
    const current = within(screen.getByRole('navigation', { name: '帮助目录' })).getByRole('button', { name: '录音与导入' })
    current.focus()
    expect(screen.getByText(/通过顶栏「导入音频」/)).toBeTruthy()
    resize(true)
    expect(screen.queryByRole('navigation', { name: '帮助目录' })).toBeNull()
    const selector = screen.getByRole('combobox', { name: '选择帮助主题' }) as HTMLSelectElement
    expect(selector.value).toBe('audio')
    expect(document.activeElement).toBe(selector)
    expect(screen.getByText(/更多 → 导入音频/)).toBeTruthy()
    fireEvent.change(selector, { target: { value: 'f0' } })
    expect(screen.getByRole('heading', { name: '在程序中观察 F0' })).toBeTruthy()
    resize(false)
    expect(document.activeElement).toBe(within(screen.getByRole('navigation', { name: '帮助目录' })).getByRole('button', { name: 'F0 · 音高' }))
    vi.unstubAllGlobals()
  })
})
