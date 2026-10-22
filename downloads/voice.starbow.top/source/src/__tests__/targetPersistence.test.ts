import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from '../store/appStore'
import { getBandCenter } from '../config/targetBandRules'

beforeEach(() => useAppStore.getState().reset())

async function reloadSavedTargets() {
  const saved = localStorage.getItem('voicebuilder-presets')!
  useAppStore.getState().reset()
  localStorage.setItem('voicebuilder-presets', saved)
  await useAppStore.persist.rehydrate()
}

describe('当前元音与目标持久化', () => {
  it('推荐模式经历手调、恢复推荐和切换元音后，刷新保留当前元音与 F0', async () => {
    useAppStore.getState().switchPreset('vowel-i')
    useAppStore.getState().setBandCenter('f0', 260)
    useAppStore.getState().setBandCenter('f1', 400)
    useAppStore.getState().setBandCenter('f0', 280)
    useAppStore.getState().setTargetMode('vowel')
    useAppStore.getState().switchPreset('vowel-u')
    await reloadSavedTargets()
    const state = useAppStore.getState()
    expect(state.activePreset).toBe('vowel-u')
    expect(state.targetMode).toBe('vowel')
    expect(getBandCenter(state.bands.f0.range)).toBe(280)
    expect(state.bands.f1.range).toEqual([362, 562])
    expect(state.bands.f2.range).toEqual([800, 1100])
  })

  it('手动模式刷新保留当前元音、F0/F1/F2 与模式，不依赖覆盖保存的调用时机', async () => {
    useAppStore.getState().switchPreset('vowel-i')
    useAppStore.getState().setBandCenter('f0', 280)
    useAppStore.getState().setBandCenter('f1', 400)
    useAppStore.getState().setBandCenter('f2', 2500)
    const before = useAppStore.getState().bands
    await reloadSavedTargets()
    expect(useAppStore.getState().activePreset).toBe('vowel-i')
    expect(useAppStore.getState().targetMode).toBe('manual')
    expect(useAppStore.getState().bands).toEqual(before)
  })

  it('旧数据继续恢复覆盖并选用手动模式，损坏的当前元音与目标安全回退', async () => {
    localStorage.setItem('voicebuilder-presets', JSON.stringify({ state: {
      activePreset: '__proto__', bands: { f0: { range: ['240', 300] }, f1: { range: [900, 500] } },
      presetOverrides: [{ key: 'vowel-a', f0: [220, 300], f1: [600, 800], f2: [1200, 1500] }],
    }, version: 0 }))
    await useAppStore.persist.rehydrate()
    expect(useAppStore.getState().activePreset).toBe('vowel-a')
    expect(useAppStore.getState().targetMode).toBe('manual')
    expect(useAppStore.getState().bands.f0.range).toEqual([220, 300])
    expect(useAppStore.getState().bands.f1.range).toEqual([600, 800])
  })
})
