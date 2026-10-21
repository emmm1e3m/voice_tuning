import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { AnatomyExplorer } from '../components/AnatomyExplorer'
import { anatomyVowelReference, ANATOMY_VOWELS } from '../utils/anatomyAcoustics'

const selectPart = (name: string) => fireEvent.click(screen.getByRole('button', { name }))
const changePart = (name: string, value: number) => {
  selectPart(name)
  fireEvent.change(screen.getByRole('slider', { name: new RegExp(name) }), { target: { value } })
}
const envelope = () => screen.getByTestId('anatomy-current-envelope').getAttribute('d')
const referenceEnvelope = () => screen.getByTestId('anatomy-reference-envelope').getAttribute('d')

describe('AnatomyExplorer', () => {
  it('labels the vocal tract and keeps every control available in a compact single-slider panel', () => {
    render(<AnatomyExplorer />)
    expect(screen.getByRole('img', { name: /侧面声道与声带俯视示意/ })).toBeTruthy()
    for (const part of ['舌面', '舌根', '软腭', '舌骨', '会厌', '喉部／声带', '气管']) expect(screen.getByText(part)).toBeTruthy()
    for (const part of ['声带张力', '喉位', '舌位前后', '舌位高低', '圆唇程度', '下颌开度']) {
      changePart(part, 72)
      expect(screen.getAllByRole('slider')).toHaveLength(1)
    }
    selectPart('声带张力')
    expect((screen.getByRole('slider') as HTMLInputElement).value).toBe('72')
    expect(screen.getByTestId('anatomy-f0-readout').closest('[aria-label="动作对应的频率变化"]')?.parentElement?.contains(screen.getByRole('slider'))).toBe(true)
  })

  it('selects each vowel as a new articulation and frequency reference with coincident curves', () => {
    render(<AnatomyExplorer />)
    let previousTongue = ''
    for (const [key, item] of Object.entries(ANATOMY_VOWELS)) {
      selectPart(item.name)
      expect(screen.getByRole('button', { name: item.name }).getAttribute('aria-pressed')).toBe('true')
      const reference = anatomyVowelReference(key)
      for (const frequency of ['f0', 'f1', 'f2'] as const) expect(screen.getByTestId(`anatomy-${frequency}-readout`).textContent).toContain(`${reference[frequency]} → ${reference[frequency]}+0 Hz`)
      expect(envelope()).toBe(referenceEnvelope())
      const tongue = screen.getByTestId('anatomy-tongue').getAttribute('d')!
      expect(tongue).not.toBe(previousTongue)
      expect(screen.getByTestId('anatomy-reference').querySelector('path')?.getAttribute('d')).toBe(tongue)
      previousTongue = tongue
    }
  })

  it('moves the source harmonics and F0 marker without shifting the formant envelope', () => {
    render(<AnatomyExplorer />)
    const beforeEnvelope = envelope()
    const beforeHarmonic = screen.getAllByTestId('anatomy-harmonic')[0].getAttribute('d')
    const beforeMarker = screen.getByTestId('anatomy-f0-marker').getAttribute('d')
    const referenceMarker = screen.getByTestId('anatomy-reference-f0-marker').getAttribute('d')
    changePart('声带张力', 90)
    expect(envelope()).toBe(beforeEnvelope)
    expect(screen.getAllByTestId('anatomy-harmonic')[0].getAttribute('d')).not.toBe(beforeHarmonic)
    expect(screen.getByTestId('anatomy-f0-marker').getAttribute('d')).not.toBe(beforeMarker)
    expect(screen.getByTestId('anatomy-reference-f0-marker').getAttribute('d')).toBe(referenceMarker)
    expect(screen.getByTestId('anatomy-f1-readout').textContent).toContain('900 → 900+0 Hz')
    expect(screen.getByText(/元音本身不限定音高/)).toBeTruthy()
  })

  it('links tongue and larynx geometry to moving spectral peaks while keeping the chosen reference', () => {
    render(<AnatomyExplorer />)
    const tongue = screen.getByTestId('anatomy-tongue')
    const tongueStart = tongue.getAttribute('d')
    const before = envelope()
    const reference = referenceEnvelope()
    changePart('舌位前后', 90)
    expect(tongue.getAttribute('d')).not.toBe(tongueStart)
    expect(envelope()).not.toBe(before)
    expect(referenceEnvelope()).toBe(reference)
    const larynx = screen.getByTestId('anatomy-larynx')
    const transform = larynx.getAttribute('transform')
    changePart('喉位', 90)
    expect(larynx.getAttribute('transform')).not.toBe(transform)
    expect(screen.getByTestId('anatomy-f0-readout').textContent).toContain('240 → 240+0 Hz')
  })

  it('retains the chosen vowel through F0/F1/F2 focus switches and resets to that vowel', () => {
    render(<AnatomyExplorer />)
    selectPart('u（乌）')
    selectPart('F2')
    changePart('圆唇程度', 30)
    expect(envelope()).not.toBe(referenceEnvelope())
    selectPart('F0')
    expect(screen.getByRole('button', { name: 'u（乌）' }).getAttribute('aria-pressed')).toBe('true')
    selectPart('F1')
    selectPart('复位')
    expect(envelope()).toBe(referenceEnvelope())
    expect((screen.getByRole('slider', { name: /舌位高低/ }) as HTMLInputElement).value).toBe('80')
    expect(screen.getByTestId('anatomy-f2-readout').textContent).toContain('750 → 750+0 Hz')
  })

  it('shows a labeled relative-intensity versus Hz plot and permits hiding the anatomy reference', () => {
    render(<AnatomyExplorer initialFocus="f2" />)
    const start = screen.getByTestId('anatomy-lips').getAttribute('d')
    changePart('圆唇程度', 95)
    expect(screen.getByTestId('anatomy-lips').getAttribute('d')).not.toBe(start)
    expect(screen.getByRole('img', { name: /元音的强度与频率示意图/ })).toBeTruthy()
    expect(screen.getByText('相对强度')).toBeTruthy()
    expect(screen.getByText('频率（Hz）')).toBeTruthy()
    expect(screen.getByText(/不代表个人正常值或实测结果/)).toBeTruthy()
    fireEvent.click(screen.getByRole('checkbox', { name: '参考轮廓' }))
    expect(screen.queryByTestId('anatomy-reference')).toBeNull()
  })
})
