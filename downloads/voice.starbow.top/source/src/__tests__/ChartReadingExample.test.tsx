import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ChartReadingExample } from '../components/ChartReadingExample'
import { FREQUENCY_COLORS } from '../utils/frequencyChart'

describe('ChartReadingExample', () => {
  it('shows labeled logarithmic frequency and time axes, colored curves, target windows and centers', () => {
    render(<ChartReadingExample />)
    expect(screen.getByText('示意数据 · a 元音')).toBeTruthy()
    expect(screen.getByRole('img', { name: '同一张对数频率图中的 F0、F1、F2 曲线和目标窗口' })).toBeTruthy()
    expect(screen.getByText('频率 Hz（对数）')).toBeTruthy()
    expect(screen.getByText('时间 / 秒')).toBeTruthy()
    for (const key of ['f0', 'f1', 'f2'] as const) {
      expect(screen.getByTestId(`example-curve-${key}`).getAttribute('stroke')).toBe(FREQUENCY_COLORS[key])
      expect(Number(screen.getByTestId(`example-target-${key}`).getAttribute('height'))).toBeGreaterThan(0)
      expect(screen.getByTestId(`example-center-${key}`).getAttribute('stroke-dasharray')).toBe('5 5')
    }
    const tickY = (hz: string) => Number(screen.getByText(hz).getAttribute('y'))
    expect(tickY('100') - tickY('200')).toBeCloseTo(tickY('200') - tickY('400'))
    expect(tickY('400') - tickY('800')).toBeCloseTo(tickY('800') - tickY('1600'))
  })
  it('lets a reader hide only the selected illustrative curve and restore it', () => {
    render(<ChartReadingExample />)
    const f1 = screen.getByRole('button', { name: 'F1 示例曲线' })
    fireEvent.click(f1)
    expect(f1.getAttribute('aria-pressed')).toBe('false')
    expect(screen.queryByTestId('example-curve-f1')).toBeNull()
    expect(screen.getByTestId('example-curve-f0')).toBeTruthy()
    expect(screen.getByTestId('example-curve-f2')).toBeTruthy()
    expect(screen.getByTestId('example-target-f1')).toBeTruthy()
    fireEvent.click(f1)
    expect(f1.getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByTestId('example-curve-f1')).toBeTruthy()
  })
})
