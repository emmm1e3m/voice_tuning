import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { AnatomyExplorer } from '../components/AnatomyExplorer'

describe('AnatomyExplorer', () => {
  it('labels a real side-view vocal tract and relates it to all three voice parameters', () => {
    render(<AnatomyExplorer />)
    expect(screen.getByRole('img', { name: /侧面声道与声带俯视示意/ })).toBeTruthy()
    for (const part of ['舌面', '舌根', '软腭', '舌骨', '会厌', '喉部／声带', '气管']) expect(screen.getByText(part)).toBeTruthy()
    expect(screen.getAllByRole('slider')).toHaveLength(6)
    fireEvent.click(screen.getByRole('button', { name: 'F0' }))
    expect(screen.getByText(/F0 主要来自声带周期性振动/)).toBeTruthy()
    expect(screen.getAllByRole('slider')).toHaveLength(1)
    expect(screen.getByRole('slider', { name: /声带张力/ })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'F2' }))
    expect(screen.getByText(/F2 与元音前后/)).toBeTruthy()
    expect(screen.getAllByRole('slider')).toHaveLength(3)
  })
  it('moves the tongue and larynx, with relative acoustic explanations rather than fake Hz results', () => {
    render(<AnatomyExplorer />)
    const tongue = screen.getByTestId('anatomy-tongue')
    const start = tongue.getAttribute('d')
    fireEvent.change(screen.getByRole('slider', { name: /舌位前后/ }), { target: { value: 90 } })
    expect(tongue.getAttribute('d')).not.toBe(start)
    expect(screen.getByText(/舌体靠前：向前元音方向变化/)).toBeTruthy()
    const larynx = screen.getByTestId('anatomy-larynx')
    const transform = larynx.getAttribute('transform')
    fireEvent.change(screen.getByRole('slider', { name: /^喉位/ }), { target: { value: 90 } })
    expect(larynx.getAttribute('transform')).not.toBe(transform)
    expect(screen.queryByText(/\d+\s*Hz/)).toBeNull()
  })
  it('shows contrasting vowel shapes and resets all positions', () => {
    render(<AnatomyExplorer />)
    fireEvent.click(screen.getByRole('button', { name: 'i（衣）' }))
    const tongueHigh = screen.getByRole('slider', { name: /舌位高低/ }) as HTMLInputElement
    expect(tongueHigh.value).toBe('85')
    fireEvent.click(screen.getByRole('button', { name: 'u（乌）' }))
    expect((screen.getByRole('slider', { name: /圆唇程度/ }) as HTMLInputElement).value).toBe('90')
    fireEvent.click(screen.getByRole('button', { name: '复位' }))
    expect(tongueHigh.value).toBe('45')
  })
})
