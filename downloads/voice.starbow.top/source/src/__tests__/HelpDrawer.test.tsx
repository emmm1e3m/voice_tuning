import { useRef, useState } from 'react'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { HelpDrawer } from '../components/HelpDrawer'
import { getHelpSections, type HelpTopic } from '../content/helpContent'
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

describe('integrated manual tutorial', () => {
  it('places an interactive time-frequency example directly in the chart-reading chapter', () => {
    matchMedia()
    render(<Harness initial="charts" />)
    fireEvent.click(screen.getByRole('button', { name: '打开帮助' }))
    const heading = screen.getByRole('heading', { name: '一张图看 F0、F1、F2' })
    const firstSection = heading.closest('section')!
    expect(within(firstSection).getByRole('figure', { name: 'F0、F1、F2 读图示例' })).toBeTruthy()
    expect(within(firstSection).getByText(/关键实时反馈始终显示/)).toBeTruthy()
    fireEvent.click(within(firstSection).getByRole('button', { name: 'F0 示例曲线' }))
    expect(within(firstSection).queryByTestId('example-curve-f0')).toBeNull()
  })
  it.each(['anatomy', 'source-filter', 'perception'] as const)('keeps every %s review answer closed until its question is selected', topic => {
    matchMedia()
    render(<Harness initial={topic} />)
    fireEvent.click(screen.getByRole('button', { name: '打开帮助' }))
    const questions = getHelpSections(topic, 'landscape').flatMap(section => [...(section.questions ?? [])])
    const details = [...document.querySelectorAll<HTMLDetailsElement>('details[data-review-question]')]
    expect(details.length).toBe(questions.length)
    for (const [index, item] of questions.entries()) {
      expect(details[index].open).toBe(false)
      expect(details[index].querySelector('summary')?.textContent).toContain(item.question)
      expect(details[index].querySelector('p')?.textContent).toBe(item.answer)
    }
    fireEvent.click(details[0].querySelector('summary')!)
    expect(details[0].open).toBe(true)
    expect(details.slice(1).every(item => !item.open)).toBe(true)
    fireEvent.click(details[0].querySelector('summary')!)
    expect(details[0].open).toBe(false)
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
    fireEvent.click(within(screen.getByRole('navigation', { name: '教程目录' })).getByRole('button', { name: '训练目标' }))
    expect(screen.getByRole('table', { name: /默认目标中心/ })).toBeTruthy()
    fireEvent.keyDown(dialog, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })
  it('includes real F2 exercises, original illustrations and related anatomy without a source detour', () => {
    matchMedia()
    render(<Harness initial="f2" />)
    fireEvent.click(screen.getByRole('button', { name: '打开帮助' }))
    expect(screen.getByRole('heading', { name: 'F2 的机制：喉位、舌位与唇形' })).toBeTruthy()
    expect(screen.getByRole('img', { name: /wow 训练中/ })).toBeTruthy()
    expect(screen.getByRole('img', { name: '大狗小狗训练' })).toBeTruthy()
    fireEvent.click(screen.getByText('查看相关发声部位'))
    expect(screen.getByRole('slider', { name: /舌位前后/ })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'MTF 手册原文（离线）' }).getAttribute('href')).toMatch(/manual\/index\.html$/)
    fireEvent.click(screen.getByRole('button', { name: /下一章 F1/ }))
    expect(screen.getByRole('heading', { name: 'F1 的机制：开口与舌位' })).toBeTruthy()
    expect(screen.getByRole('img', { name: /小嘴型与大嘴型发/ })).toBeTruthy()
  })
  it('uses a single mobile selector and preserves logical directory focus across breakpoints', () => {
    const resize = matchMedia()
    render(<Harness initial="audio" />)
    fireEvent.click(screen.getByRole('button', { name: '打开帮助' }))
    const current = within(screen.getByRole('navigation', { name: '教程目录' })).getByRole('button', { name: '录音与导入' })
    current.focus()
    expect(screen.getByText(/通过顶栏「导入音频」/)).toBeTruthy()
    resize(true)
    expect(screen.queryByRole('navigation', { name: '教程目录' })).toBeNull()
    const selector = screen.getByRole('combobox', { name: '选择教程章节' }) as HTMLSelectElement
    expect(selector.value).toBe('audio')
    expect(document.activeElement).toBe(selector)
    expect(screen.getByText(/更多 → 导入音频/)).toBeTruthy()
    fireEvent.change(selector, { target: { value: 'anatomy' } })
    expect(screen.getByRole('region', { name: '发声部位交互图' })).toBeTruthy()
    resize(false)
    expect(document.activeElement).toBe(within(screen.getByRole('navigation', { name: '教程目录' })).getByRole('button', { name: '发声部位与动作' }))
    vi.unstubAllGlobals()
  })
})
