import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { buildRegisterCalibration, isPersonalRegisterCalibration } from '../dsp/register-calibration'
import type { PersonalRegisterCalibration, RegisterCalibrationSample } from '../dsp/register-calibration'

export const REGISTER_CALIBRATION_STORAGE_KEY = 'voicebuilder-register-calibration'

interface RegisterCalibrationState {
  calibration: PersonalRegisterCalibration | null
  saveSamples: (samples: RegisterCalibrationSample[]) => boolean
  clearCalibration: () => void
}

export const useRegisterCalibrationStore = create<RegisterCalibrationState>()(
  persist((set) => ({
    calibration: null,
    saveSamples: (samples) => {
      const calibration = buildRegisterCalibration(samples)
      if (!calibration) return false
      set({ calibration })
      return true
    },
    clearCalibration: () => set({ calibration: null }),
  }), {
    name: REGISTER_CALIBRATION_STORAGE_KEY,
    storage: createJSONStorage(() => localStorage),
    partialize: ({ calibration }) => ({ calibration }),
    merge: (persisted, current) => {
      const calibration = (persisted as Partial<RegisterCalibrationState> | undefined)?.calibration
      return { ...current, calibration: isPersonalRegisterCalibration(calibration) ? calibration : null }
    },
  }),
)
