import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type FrequencyScale = 'log' | 'linear'
export const CHART_DISPLAY_STORAGE_KEY = 'voicebuilder-chart-display'

interface ChartDisplayState {
  frequencyScale: FrequencyScale
  setFrequencyScale: (scale: FrequencyScale) => void
}

export const useChartDisplayStore = create<ChartDisplayState>()(
  persist(
    (set) => ({
      frequencyScale: 'log',
      setFrequencyScale: (frequencyScale) => set({ frequencyScale }),
    }),
    {
      name: CHART_DISPLAY_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ frequencyScale }) => ({ frequencyScale }),
      // 旧值或损坏的设置不能使图表进入未知坐标模式。
      merge: (persisted, current) => ({
        ...current,
        frequencyScale: (persisted as Partial<ChartDisplayState> | undefined)?.frequencyScale === 'linear'
          ? 'linear' : 'log',
      }),
    },
  ),
)
