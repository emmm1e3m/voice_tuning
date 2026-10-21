import { beforeEach, describe, expect, it } from 'vitest'
import { useChartDisplayStore, CHART_DISPLAY_STORAGE_KEY } from '../store/chartDisplayStore'
import { frequencyAxis, validFrequency, validFrequencyRange } from '../utils/frequencyChart'
import { getBandCenter } from '../config/targetBandRules'

describe('frequency display settings', () => {
  beforeEach(() => {
    localStorage.removeItem(CHART_DISPLAY_STORAGE_KEY)
    useChartDisplayStore.setState({ frequencyScale: 'log' })
  })

  it('persists a linear choice and restores it after a reload', async () => {
    useChartDisplayStore.getState().setFrequencyScale('linear')
    expect(JSON.parse(localStorage.getItem(CHART_DISPLAY_STORAGE_KEY)!).state.frequencyScale).toBe('linear')
    const saved = localStorage.getItem(CHART_DISPLAY_STORAGE_KEY)!
    useChartDisplayStore.setState({ frequencyScale: 'log' })
    localStorage.setItem(CHART_DISPLAY_STORAGE_KEY, saved)
    await useChartDisplayStore.persist.rehydrate()
    expect(useChartDisplayStore.getState().frequencyScale).toBe('linear')
  })

  it('restores the log default when storage contains an unknown scale', async () => {
    localStorage.setItem(CHART_DISPLAY_STORAGE_KEY, JSON.stringify({ state: { frequencyScale: 'broken' }, version: 0 }))
    await useChartDisplayStore.persist.rehydrate()
    expect(useChartDisplayStore.getState().frequencyScale).toBe('log')
  })
  it('persists the register switch and enables it for older settings', async () => {
    useChartDisplayStore.getState().setShowRegister(false)
    const saved = localStorage.getItem(CHART_DISPLAY_STORAGE_KEY)!
    useChartDisplayStore.setState({ showRegister: true })
    localStorage.setItem(CHART_DISPLAY_STORAGE_KEY, saved)
    await useChartDisplayStore.persist.rehydrate()
    expect(useChartDisplayStore.getState().showRegister).toBe(false)
    localStorage.setItem(CHART_DISPLAY_STORAGE_KEY, JSON.stringify({ state: { frequencyScale: 'linear' }, version: 0 }))
    await useChartDisplayStore.persist.rehydrate()
    expect(useChartDisplayStore.getState().showRegister).toBe(true)
  })
})

describe('frequency chart geometry', () => {
  it('selects a native base-two log axis while keeping tick labels in Hz', () => {
    const axis = frequencyAxis('log', 3500, true, [100, 200, 400, null])
    expect(axis.type).toBe('log')
    expect(axis.logBase).toBe(2)
    expect(axis.axisLabel.formatter(2048)).toBe('2048 Hz')
    const project = (value: number) => Math.log(value / axis.min) / Math.log(axis.max / axis.min)
    expect(project(200) - project(100)).toBeCloseTo(project(400) - project(200))
  })

  it('does not invent valid measurements for invalid input', () => {
    for (const value of [0, -1, NaN, Infinity, -Infinity, null, undefined, '200']) expect(validFrequency(value)).toBeNull()
    expect(validFrequency(123.45)).toBe(123.45)
  })

  it('expands bounds for actual frequencies, but ignores invalid observations', () => {
    const axis = frequencyAxis('log', 500, false, [25, 680, NaN, Infinity, -50, null])
    expect(axis.min).toBe(25)
    expect(axis.max).toBe(700)
    expect(frequencyAxis('linear', 500, false, [25, 680]).min).toBe(0)
  })

  it('keeps a target center in actual Hz rather than moving it to a logarithmic midpoint', () => {
    const range: [number, number] = [100, 400]
    expect(getBandCenter(range)).toBe(250)
    expect(range).toEqual([100, 400])
    expect(validFrequencyRange([0, 300], 'log')).toBe(false)
    expect(validFrequencyRange([0, 300], 'linear')).toBe(true)
    expect(validFrequencyRange([100, Infinity])).toBe(false)
  })
})
