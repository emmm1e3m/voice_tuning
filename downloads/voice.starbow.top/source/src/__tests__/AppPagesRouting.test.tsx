import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Link, Outlet } from 'react-router-dom'

vi.mock('../routes/AppShell', () => ({
  AppShell: () => <><Link to="/">声音分析</Link><Link to="/practice">音高参考</Link><Outlet /></>,
}))
vi.mock('../routes/AnalysisPage', () => ({ AnalysisPage: () => <div>analysis-page</div> }))
vi.mock('../routes/PracticePage', () => ({ PracticePage: () => <div>practice-page</div> }))

import App from '../App'

afterEach(() => {
  cleanup()
  window.history.replaceState({}, '', '/')
})

describe('GitHub Pages hash routing', () => {
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
