import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, cleanup } from '@testing-library/react'
import { SourceFilterLab } from '../components/SourceFilterLab'
import { VowelMap } from '../components/VowelMap'

describe('声学交互教学', () => {
  it('调 F0 改变泛音间距，元音切换只改变滤波包络', () => {
    render(<SourceFilterLab />)
    const before = screen.getAllByTestId('source-harmonic').map(line => line.getAttribute('d'))
    const envelope = screen.getByTestId('filter-envelope').getAttribute('d')
    fireEvent.change(screen.getByRole('slider', { name: /F0 · 泛音间隔/ }), { target: { value: '300' } })
    expect(screen.getAllByTestId('source-harmonic')).toHaveLength(11)
    expect(screen.getAllByTestId('source-harmonic').map(line => line.getAttribute('d'))).not.toEqual(before)
    expect(screen.getByTestId('filter-envelope').getAttribute('d')).toBe(envelope)
    fireEvent.click(screen.getByRole('button', { name: 'i（衣）' }))
    expect(screen.getByTestId('filter-envelope').getAttribute('d')).not.toBe(envelope)
    expect((screen.getByRole('slider', { name: /F0 · 泛音间隔/ }) as HTMLInputElement).value).toBe('300')
    fireEvent.click(screen.getByRole('button', { name: '复位' }))
    expect(screen.getByTestId('filter-envelope').getAttribute('d')).toBe(envelope)
    cleanup()
  })
  it('元音预设、触屏滑杆与键盘操作保持图中探索点一致', () => {
    render(<VowelMap />)
    fireEvent.click(screen.getByRole('button', { name: 'a 啊' }))
    expect(screen.getByRole('button', { name: /^探索点：F1 800 Hz，F2 1400 Hz/ })).toBeTruthy()
    fireEvent.keyDown(screen.getByRole('button', { name: /^探索点/ }), { key: 'ArrowLeft' })
    expect(screen.getByRole('button', { name: /^探索点：F1 800 Hz，F2 1450 Hz/ })).toBeTruthy()
    fireEvent.keyDown(screen.getByRole('button', { name: /^探索点/ }), { key: 'ArrowUp' })
    expect(screen.getByRole('button', { name: /^探索点：F1 775 Hz，F2 1450 Hz/ })).toBeTruthy()
    fireEvent.change(screen.getByRole('slider', { name: /F2 · 前后/ }), { target: { value: 1000 } })
    expect(screen.getByRole('button', { name: /^探索点：F1 775 Hz，F2 1000 Hz/ })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '复位' }))
    expect(screen.getByRole('button', { name: /^探索点：F1 800 Hz，F2 1400 Hz/ })).toBeTruthy()
    cleanup()
  })
})
