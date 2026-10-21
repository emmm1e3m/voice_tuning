import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type FrequencyScale = 'log' | 'linear'
export const CHART_DISPLAY_STORAGE_KEY = 'voicebuilder-chart-display'

interface ChartDisplayState {
  frequencyScale: FrequencyScale
  showRegister: boolean
  setShowRegister: (show: boolean) => void
  setFrequencyScale: (scale: FrequencyScale) => void
}

export const useChartDisplayStore = create<ChartDisplayState>()(
  persist(
    (set) => ({
      frequencyScale: 'log',
      showRegister: true,
      setShowRegister: (showRegister) => set({ showRegister }),
      setFrequencyScale: (frequencyScale) => set({ frequencyScale }),
    }),
    {
      name: CHART_DISPLAY_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ frequencyScale, showRegister }) => ({ frequencyScale, showRegister }),
      // 旧值或损坏的设置不能使图表进入未知坐标模式。
      merge: (persisted, current) => ({
        ...current,
        showRegister: (persisted as Partial<ChartDisplayState> | undefined)?.showRegister !== false,
        frequencyScale: (persisted as Partial<ChartDisplayState> | undefined)?.frequencyScale === 'linear'
          ? 'linear' : 'log',
      }),
    },
  ),
)
