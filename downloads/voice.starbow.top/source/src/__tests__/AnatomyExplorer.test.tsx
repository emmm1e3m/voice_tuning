import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { AnatomyExplorer } from '../components/AnatomyExplorer'
import { anatomyVowelReference, ANATOMY_VOWELS } from '../utils/anatomyAcoustics'

const changePart = (name: string, value: number) => fireEvent.change(screen.getByRole('slider', { name }), { target: { value } })
const envelope = () => screen.getByTestId('anatomy-current-envelope').getAttribute('d')
const referenceEnvelope = () => screen.getByTestId('anatomy-reference-envelope').getAttribute('d')

beforeEach(() => vi.stubGlobal('PointerEvent', MouseEvent))
afterEach(() => vi.unstubAllGlobals())

function dragCurrentPoint(f1: number) {
  const point = screen.getByTestId('vowel-current-point')
  const svg = point.closest('svg')!
  Object.defineProperties(svg, {
    getScreenCTM: { value: () => ({ inverse: () => ({}) }) },
    createSVGPoint: { value: () => ({ x: 0, y: 0, matrixTransform() { return { x: this.x, y: this.y } } }) },
  })
  Object.defineProperty(point, 'setPointerCapture', { value: vi.fn() })
  fireEvent.pointerDown(point, { clientX: Number(point.getAttribute('cx')), clientY: 50 + f1 / 1500 * 260 })
  fireEvent.pointerUp(point)
}

describe('发声部位与元音空间双向联动', () => {
  it('同时提供六个滑块，切换观察重点后仍保持全部可调', () => {
    render(<AnatomyExplorer />)
    expect(screen.getByRole('img', { name: /发声器官.*声带俯视/ })).toBeTruthy()
    for (const part of ['舌面', '舌根', '软腭', '舌骨', '会厌', '气管']) expect(screen.getByText(part)).toBeTruthy()
    expect(screen.getAllByRole('slider')).toHaveLength(6)
    for (const part of ['声带调节', '喉位', '舌位前后', '舌位高低', '圆唇程度', '下颌开度']) changePart(part, 72)
    for (const name of ['F0', 'F1', 'F2']) {
      fireEvent.click(screen.getByRole('button', { name }))
      expect(screen.getAllByRole('slider')).toHaveLength(6)
      expect((screen.getByRole('slider', { name: '声带调节' }) as HTMLInputElement).value).toBe('72')
    }
  })

  it('选择任一元音时同步结构、图中点和频率参考，复位回到该元音', () => {
    render(<AnatomyExplorer />)
    for (const [key, item] of Object.entries(ANATOMY_VOWELS)) {
      fireEvent.click(screen.getByRole('button', { name: item.name }))
      const reference = anatomyVowelReference(key)
      for (const frequency of ['f0', 'f1', 'f2'] as const) expect(screen.getByTestId(`anatomy-${frequency}-readout`).textContent).toContain(`${reference[frequency]} → ${reference[frequency]}`)
      expect(screen.getByRole('img', { name: `当前点：F1 ${reference.f1} Hz，F2 ${reference.f2} Hz` })).toBeTruthy()
      expect(envelope()).toBe(referenceEnvelope())
    }
    changePart('圆唇程度', 25)
    expect(envelope()).not.toBe(referenceEnvelope())
    fireEvent.click(screen.getByRole('button', { name: '复位' }))
    expect(envelope()).toBe(referenceEnvelope())
  })

  it('按频率灰显无关部位，喉位和圆唇同时关联 F1 与 F2，灰显滑块仍可调整', () => {
    render(<AnatomyExplorer />)
    const parts = ['声带调节', '喉位', '舌位前后', '舌位高低', '圆唇程度', '下颌开度']
    const related: Record<string, string[]> = {
      F0: ['声带调节'], F1: ['喉位', '舌位高低', '圆唇程度', '下颌开度'], F2: ['喉位', '舌位前后', '圆唇程度'], 全部部位: parts,
    }
    for (const [focus, relevant] of Object.entries(related)) {
      fireEvent.click(screen.getByRole('button', { name: focus }))
      for (const name of parts) expect(screen.getByRole('slider', { name }).closest('[data-highlighted]')?.getAttribute('data-highlighted')).toBe(String(relevant.includes(name)))
    }
    fireEvent.click(screen.getByRole('button', { name: 'F0' }))
    const before = envelope()
    changePart('舌位前后', 85)
    expect((screen.getByRole('slider', { name: '舌位前后' }) as HTMLInputElement).disabled).toBe(false)
    expect(envelope()).not.toBe(before)
    expect(screen.getByRole('slider', { name: '舌位前后' }).closest('[data-highlighted]')?.getAttribute('data-highlighted')).toBe('false')
  })

  it('声源改变泛音间距，不移动元音点或共振峰', () => {
    render(<AnatomyExplorer />)
    const beforeEnvelope = envelope()
    const beforePoint = screen.getByTestId('vowel-current-point').getAttribute('aria-label')
    const beforeHarmonic = screen.getAllByTestId('anatomy-harmonic')[0].getAttribute('d')
    changePart('声带调节', 90)
    expect(envelope()).toBe(beforeEnvelope)
    expect(screen.getByTestId('vowel-current-point').getAttribute('aria-label')).toBe(beforePoint)
    expect(screen.getAllByTestId('anatomy-harmonic')[0].getAttribute('d')).not.toBe(beforeHarmonic)
  })

  it('滑块移动元音点，元音点反向移动舌位和下颌，同时更新频谱', () => {
    render(<AnatomyExplorer />)
    const before = envelope()
    const tongue = screen.getByTestId('anatomy-tongue')
    const oldTongue = tongue.getAttribute('d')
    const oldPoint = screen.getByTestId('vowel-current-point').getAttribute('aria-label')
    changePart('舌位前后', 80)
    expect(screen.getByTestId('vowel-current-point').getAttribute('aria-label')).not.toBe(oldPoint)
    expect(tongue.getAttribute('d')).not.toBe(oldTongue)
    expect(envelope()).not.toBe(before)
    const height = Number((screen.getByRole('slider', { name: '舌位高低' }) as HTMLInputElement).value)
    const jaw = Number((screen.getByRole('slider', { name: '下颌开度' }) as HTMLInputElement).value)
    const lip = (screen.getByRole('slider', { name: '圆唇程度' }) as HTMLInputElement).value
    dragCurrentPoint(875)
    expect(Number((screen.getByRole('slider', { name: '舌位高低' }) as HTMLInputElement).value)).toBeGreaterThan(height)
    expect(Number((screen.getByRole('slider', { name: '下颌开度' }) as HTMLInputElement).value)).toBeLessThan(jaw)
    expect((screen.getByRole('slider', { name: '圆唇程度' }) as HTMLInputElement).value).toBe(lip)
    expect(screen.getByTestId('anatomy-f1-readout').textContent).toContain('900 → 875')
    expect(screen.getByTestId('anatomy-f0-readout').textContent).toContain('240 → 240')
    expect(referenceEnvelope()).not.toBe(envelope())
  })

  it('元音参考只显示字母，可以直接选择图中参考点，结构图不再提供参考轮廓', () => {
    render(<AnatomyExplorer />)
    for (const vowel of ['a', 'o', 'e', 'i', 'u', 'ü']) expect(screen.getByRole('button', { name: vowel })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '选择 i 参考' }))
    expect(screen.getByRole('button', { name: 'i' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.queryByRole('checkbox', { name: '参考轮廓' })).toBeNull()
    expect(screen.queryByTestId('anatomy-reference')).toBeNull()
  })

  it('滑块与器官、名称、引线共同强调，悬停结束后恢复焦点或取消强调', () => {
    const { container } = render(<AnatomyExplorer />)
    const tension = screen.getByRole('slider', { name: '声带调节' })
    const lips = screen.getByRole('slider', { name: '圆唇程度' })
    const tensionCard = tension.closest('[data-active]')!
    const lipsCard = lips.closest('[data-active]')!
    const lipStructure = container.querySelector('[data-part="lips"][data-kind="structure"]')!
    const lipAnnotation = container.querySelector('[data-part="lips"][data-kind="annotation"]')!
    fireEvent.focus(tension)
    expect(tensionCard.getAttribute('data-active')).toBe('true')
    fireEvent.pointerEnter(lipsCard)
    expect(lipsCard.getAttribute('data-active')).toBe('true')
    expect(tensionCard.getAttribute('data-active')).toBe('false')
    expect(lipStructure.getAttribute('data-active')).toBe('true')
    expect(lipAnnotation.getAttribute('data-active')).toBe('true')
    expect(lipAnnotation.querySelector('path')).toBeTruthy()
    expect(lipAnnotation.querySelector('text')?.textContent).toBe('嘴唇')
    fireEvent.pointerLeave(lipsCard)
    expect(tensionCard.getAttribute('data-active')).toBe('true')
    fireEvent.blur(tension)
    expect(tensionCard.getAttribute('data-active')).toBe('false')
    fireEvent.mouseEnter(lipAnnotation)
    expect(lipStructure.getAttribute('data-active')).toBe('true')
    expect(lipsCard.getAttribute('data-active')).toBe('true')
    fireEvent.mouseLeave(lipAnnotation)
    expect(lipStructure.getAttribute('data-active')).toBe('false')
    expect(lipsCard.getAttribute('data-active')).toBe('false')
  })
})

