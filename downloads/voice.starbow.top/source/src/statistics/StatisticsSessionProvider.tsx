import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { AudioEngine } from '../ts/AudioEngine'
import { importStatisticsFile } from './importClip'
import { StatisticsSessionController } from './sessionController'
import { runStatisticsAnalysis } from './workerClient'

const StatisticsContext = createContext<StatisticsSessionController | null>(null)

export function StatisticsSessionProvider({ children, active }: { children: ReactNode; active: boolean }) {
  const [session] = useState(() => {
    const engine = new AudioEngine()
    const controller = new StatisticsSessionController({
      engine,
      analyze: runStatisticsAnalysis,
      importFile: importStatisticsFile,
    })
    return { controller, engine }
  })
  const lifecycle = useRef(0)

  useEffect(() => {
    if (!active) session.controller.leave()
  }, [active, session])

  useEffect(() => {
    const generation = ++lifecycle.current
    return () => {
      // StrictMode 重放 effect 时继续复用同一会话，真实卸载时再释放音频资源。
      queueMicrotask(() => {
        if (generation !== lifecycle.current) return
        session.controller.destroy()
        session.engine.destroy()
      })
    }
  }, [session])

  return <StatisticsContext.Provider value={session.controller}>{children}</StatisticsContext.Provider>
}

export function useStatisticsSession() {
  const controller = useContext(StatisticsContext)
  if (!controller) throw new Error('统计页面需要 StatisticsSessionProvider')
  const snapshot = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot)
  return {
    snapshot,
    start: controller.start,
    pause: controller.pause,
    resume: controller.resume,
    finish: controller.finish,
    importFile: controller.importFile,
    cancel: controller.cancel,
    retry: controller.retry,
  }
}
