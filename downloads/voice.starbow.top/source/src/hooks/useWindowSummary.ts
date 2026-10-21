import { useEffect, useState } from 'react'
import { useAppStore } from '../store/appStore'
import { summarizeFrequencyWindow } from '../utils/windowSummary'

export function useWindowSummary() {
  const read = () => {
    const state = useAppStore.getState()
    return summarizeFrequencyWindow(state.frames, state.config.audioRetentionSeconds)
  }
  const [summary, setSummary] = useState(read)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    // 统计读数每秒最多更新十次，避免跟随每个音频帧重复排序。
    const unsubscribe = useAppStore.subscribe((state, previous) => {
      if (state.frames === previous.frames && state.config.audioRetentionSeconds === previous.config.audioRetentionSeconds) return
      if (timer !== undefined) return
      timer = setTimeout(() => { timer = undefined; setSummary(read()) }, 100)
    })
    setSummary(read())
    return () => { unsubscribe(); if (timer !== undefined) clearTimeout(timer) }
  }, [])
  return summary
}
