import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Piano } from '../components/Piano'
import { midiToName } from '../utils/pitch'

describe('Piano', () => {
  it('renders 48 keys (C2-B5 inclusive)', () => {
    render(<Piano onKeyPress={() => {}} />)
    expect(screen.getAllByRole('button')).toHaveLength(48)
  })

  it('plays once on pointer down without repeating on the following click', () => {
    const onKeyPress = vi.fn()
    render(<Piano onKeyPress={onKeyPress} />)
    fireEvent.pointerDown(screen.getByRole('button', { name: 'C4' }))
    fireEvent.click(screen.getByRole('button', { name: 'C4' }))
    expect(onKeyPress).toHaveBeenCalledWith(60)
    expect(onKeyPress).toHaveBeenCalledTimes(1)
  })

  it.each(['Enter', ' '])('plays white and black notes with %s and ignores held-key repeats', key => {
    const onKeyPress = vi.fn()
    render(<Piano onKeyPress={onKeyPress} />)
    for (const name of ['C4', 'C#4']) {
      const note = screen.getByRole('button', { name })
      expect(fireEvent.keyDown(note, { key })).toBe(false)
      fireEvent.keyDown(note, { key, repeat: true })
      fireEvent.keyUp(note, { key })
    }
    expect(onKeyPress.mock.calls).toEqual([[60], [61]])
  })

  it('keeps deferred touch notes silent until a click and does not intercept pointer drags', () => {
    const onKeyPress = vi.fn()
    render(<Piano onKeyPress={onKeyPress} deferKeyPress />)
    const note = screen.getByRole('button', { name: 'C4' })
    fireEvent.pointerDown(note)
    fireEvent.pointerMove(note, { clientX: 120 })
    fireEvent.pointerUp(note)
    expect(onKeyPress).not.toHaveBeenCalled()
    fireEvent.click(note)
    expect(onKeyPress).toHaveBeenCalledExactlyOnceWith(60)
  })

  it('highlights the current midi note', () => {
    render(<Piano currentMidi={61} onKeyPress={() => {}} />)
    const csharp4 = screen.getByRole('button', { name: 'C#4' })
    expect(csharp4.getAttribute('data-active')).toBe('true')
    const c4 = screen.getByRole('button', { name: 'C4' })
    expect(c4.getAttribute('data-active')).toBe('false')
  })

  it('holds no active key when currentMidi is null', () => {
    render(<Piano currentMidi={null} onKeyPress={() => {}} />)
    for (const btn of screen.getAllByRole('button')) {
      expect(btn.getAttribute('data-active')).not.toBe('true')
    }
  })

  it('marks the note label of the highlighted key as active', () => {
    render(<Piano currentMidi={61} onKeyPress={() => {}} />)
    const activeLabel = screen.getByRole('button', { name: 'C#4' }).querySelector('span')
    expect(activeLabel?.getAttribute('data-active')).toBe('true')
    const inactiveLabel = screen.getByRole('button', { name: 'C4' }).querySelector('span')
    expect(inactiveLabel?.getAttribute('data-active')).toBe('false')
  })

  it('marks no note label active when currentMidi is null', () => {
    render(<Piano currentMidi={null} onKeyPress={() => {}} />)
    for (const btn of screen.getAllByRole('button')) {
      const label = btn.querySelector('span')
      expect(label?.getAttribute('data-active')).toBe('false')
    }
  })

  it('labels every white key with its note name', () => {
    render(<Piano onKeyPress={() => {}} />)
    const naturalMidi = [36, 38, 40, 41, 43, 45, 47, 48, 50, 52, 53, 55, 57, 59,
      60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81, 83]
    for (const midi of naturalMidi) {
      const btn = screen.getByRole('button', { name: midiToName(midi) })
      expect(btn.textContent).toContain(midiToName(midi))
    }
  })

  it('keeps labels visible by default only on C-octave keys', () => {
    render(<Piano onKeyPress={() => {}} />)
    for (const midi of [36, 48, 60, 72]) {
      const btn = screen.getByRole('button', { name: midiToName(midi) })
      const label = btn.querySelector('span')
      expect(label?.getAttribute('data-octave-marker')).toBe('true')
    }
    for (const midi of [37, 38, 43, 61, 62, 76, 83]) {
      const btn = screen.getByRole('button', { name: midiToName(midi) })
      const label = btn.querySelector('span')
      expect(label?.getAttribute('data-octave-marker')).toBe('false')
    }
  })

  it('carries hover labels on black keys with their note name', () => {
    render(<Piano onKeyPress={() => {}} />)
    for (const midi of [37, 44, 61, 70, 82]) {
      const btn = screen.getByRole('button', { name: midiToName(midi) })
      const label = btn.querySelector('span')
      expect(label?.getAttribute('data-octave-marker')).toBe('false')
      expect(label?.textContent).toBe(midiToName(midi))
    }
  })
})
