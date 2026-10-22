import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, cleanup } from '@testing-library/react'
import { VowelMap } from '../components/VowelMap'

describe('声学交互教学', () => {
  it('元音预设与滑杆保持当前点一致，方向键不再移动元音点', () => {
    render(<VowelMap />)
    fireEvent.click(screen.getByRole('button', { name: 'a' }))
    const point = screen.getByTestId('vowel-current-point')
    expect(point.getAttribute('aria-label')).toBe('当前点：F1 900 Hz，F2 1250 Hz')
    for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']) fireEvent.keyDown(point, { key })
    expect(point.getAttribute('aria-label')).toBe('当前点：F1 900 Hz，F2 1250 Hz')
    expect(point.hasAttribute('tabindex')).toBe(false)
    expect(screen.queryByText(/方向键/)).toBeNull()
    fireEvent.change(screen.getByRole('slider', { name: /F2 · 前后/ }), { target: { value: 1200 } })
    expect(point.getAttribute('aria-label')).toBe('当前点：F1 900 Hz，F2 1200 Hz')
    fireEvent.click(screen.getByRole('button', { name: '复位' }))
    expect(point.getAttribute('aria-label')).toBe('当前点：F1 900 Hz，F2 1250 Hz')
    cleanup()
  })
})
