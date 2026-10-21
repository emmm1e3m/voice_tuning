import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { BandRangeSlider } from '../components/mobile/BandRangeSlider'
import { useAppStore } from '../store/appStore'

beforeEach(() => {
  useAppStore.getState().reset()
  useAppStore.getState().switchPreset('vowel-i')
  vi.stubGlobal('PointerEvent', MouseEvent)
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({ width: 250, height: 40, left: 0, right: 250, top: 0, bottom: 40, x: 0, y: 0, toJSON() {} }))
})
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('single center slider', () => {
  it('has exactly one accessible thumb with valid center boundaries', () => {
    render(<BandRangeSlider bandKey="f1" value={330} onChange={vi.fn()} onBoundary={vi.fn()} />)
    const thumb = screen.getByRole('slider', { name: 'F1中心滑杆' })
    expect(screen.getAllByRole('slider')).toHaveLength(1)
    expect(thumb.getAttribute('aria-valuemin')).toBe('100')
    expect(thumb.getAttribute('aria-valuemax')).toBe('2500')
    expect(thumb.getAttribute('aria-valuenow')).toBe('330')
  })
  it('supports arrow and page keys while preserving decimal centers', () => {
    const change = vi.fn()
    render(<BandRangeSlider bandKey="f1" value={330.25} onChange={change} onBoundary={vi.fn()} />)
    const thumb = screen.getByRole('slider')
    fireEvent.keyDown(thumb, { key: 'ArrowRight' })
    expect(change).toHaveBeenLastCalledWith(340.25)
    fireEvent.keyDown(thumb, { key: 'ArrowLeft' })
    expect(change).toHaveBeenLastCalledWith(320.25)
    fireEvent.keyDown(thumb, { key: 'PageUp' })
    expect(change).toHaveBeenLastCalledWith(430.25)
  })
  it('supports Home and End and explains the center boundary', () => {
    const change = vi.fn()
    const boundary = vi.fn()
    render(<BandRangeSlider bandKey="f0" value={260} onChange={change} onBoundary={boundary} />)
    fireEvent.keyDown(screen.getByRole('slider'), { key: 'Home' })
    expect(change).toHaveBeenLastCalledWith(40)
    expect(boundary).toHaveBeenLastCalledWith('已到中心下限 40 Hz')
    fireEvent.keyDown(screen.getByRole('slider'), { key: 'End' })
    expect(change).toHaveBeenLastCalledWith(460)
    expect(boundary).toHaveBeenLastCalledWith('已到中心上限 460 Hz')
  })
  it('starts a drag from the grabbed center without a backwards snap', () => {
    const change = vi.fn()
    render(<BandRangeSlider bandKey="f1" value={330.25} onChange={change} onBoundary={vi.fn()} />)
    const track = screen.getByRole('group', { name: 'F1中心调节' })
    Object.defineProperties(track, { setPointerCapture: { value: vi.fn() }, hasPointerCapture: { value: () => true }, releasePointerCapture: { value: vi.fn() } })
    fireEvent.pointerDown(screen.getByRole('slider'), { button: 0, clientX: 30, clientY: 20 })
    expect(change).not.toHaveBeenCalled()
    fireEvent.pointerMove(track, { clientX: 31, clientY: 20 })
    expect(change).toHaveBeenLastCalledWith(340.25)
    fireEvent.pointerMove(track, { clientX: 29, clientY: 20 })
    expect(change).toHaveBeenLastCalledWith(320.25)
    fireEvent.pointerUp(track, { clientX: 29, clientY: 20 })
    const count = change.mock.calls.length
    fireEvent.pointerMove(track, { clientX: 100, clientY: 20 })
    expect(change.mock.calls).toHaveLength(count)
  })
  it('stops F1 at the current F2 band without moving F2', () => {
    const change = vi.fn()
    const f2 = useAppStore.getState().bands.f2
    render(<BandRangeSlider bandKey="f1" value={330} onChange={change} onBoundary={vi.fn()} />)
    fireEvent.keyDown(screen.getByRole('slider'), { key: 'End' })
    expect(change).toHaveBeenCalledWith(2500)
    expect(useAppStore.getState().bands.f2).toBe(f2)
  })
})
