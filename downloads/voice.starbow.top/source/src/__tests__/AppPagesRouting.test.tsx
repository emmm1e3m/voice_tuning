import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Link, Outlet } from 'react-router-dom'

vi.mock('../routes/AppShell', () => ({
  AppShell: () => <><Link to="/">声音分析</Link><Link to="/practice">音高参考</Link><Link to="/statistics">统计分析</Link><Link to="/interactive">交互演示</Link><Link to="/manual">教学文档</Link><Outlet /></>,
}))
vi.mock('../routes/AnalysisPage', () => ({ AnalysisPage: () => <div>analysis-page</div> }))
vi.mock('../routes/PracticePage', () => ({ PracticePage: () => <div>practice-page</div> }))
vi.mock('../routes/InteractivePage', () => ({ InteractivePage: () => <div>interactive-page</div> }))
vi.mock('../routes/ManualPage', () => ({ ManualPage: () => <div>manual-page</div> }))
vi.mock('../routes/StatisticsPage', () => ({ StatisticsPage: () => <div>statistics-page</div> }))

import App from '../App'

afterEach(() => {
  cleanup()
  window.history.replaceState({}, '', '/')
})

describe('GitHub Pages hash routing', () => {
  it.each([
    ['统计分析', 'statistics'],
    ['交互演示', 'interactive'],
    ['教学文档', 'manual'],
  ])('keeps the Pages prefix when opening %s', async (label, path) => {
    window.history.replaceState({}, '', '/voice_tuning/')
    render(<App />)
    fireEvent.click(screen.getByRole('link', { name: label }))
    expect(await screen.findByText(`${path}-page`)).toBeTruthy()
    expect(window.location.pathname).toBe('/voice_tuning/')
    expect(window.location.hash).toBe(`#/${path}`)
  })

  it.each(['statistics', 'interactive', 'manual'])('opens a %s deep link without a server-side route', async path => {
    window.history.replaceState({}, '', `/voice_tuning/#/${path}`)
    render(<App />)
    expect(await screen.findByText(`${path}-page`)).toBeTruthy()
  })

  it('keeps the repository prefix when switching pages', () => {
    window.history.replaceState({}, '', '/voice_tuning/')
    render(<App />)
    expect(screen.getByText('analysis-page')).toBeTruthy()
    fireEvent.click(screen.getByText('音高参考'))
    expect(screen.getByText('practice-page')).toBeTruthy()
    expect(window.location.pathname).toBe('/voice_tuning/')
    expect(window.location.hash).toBe('#/practice')
  })

  it('opens a practice deep link without a server-side route', () => {
    window.history.replaceState({}, '', '/voice_tuning/#/practice')
    render(<App />)
    expect(screen.getByText('practice-page')).toBeTruthy()
  })
})
