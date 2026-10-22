import { afterEach, describe, expect, it, vi } from 'vitest'
import { StatisticsSessionController, type StatisticsDependencies } from '../statistics/sessionController'
import type { StatisticsAnalysis, StatisticsClip } from '../statistics/types'

const analysis: StatisticsAnalysis = {
  frames: [],
  summary: {
    median: 200, p10: 180, p90: 220, validDuration: 4, coverage: 1,
    excludedCount: 0, histogram: [], aboveLimitCount: 0, aboveLimitDuration: 0,
    aboveLimitProportion: 0, candidateDuration: 4,
  },
  settings: {
    sampleRate: 16000, frameSize: 800, hopSize: 160,
    f0Range: [60, 1000], statisticsRange: [60, 500], version: 'test',
  },
}

function createSession(overrides: Partial<StatisticsDependencies> = {}) {
  let chunk: ((input: Float32Array, rate: number) => void) | undefined
  const engine = {
    startCapture: vi.fn(async (callback: (input: Float32Array, rate: number) => void) => { chunk = callback }),
    stopCapture: vi.fn(),
  }
  const analyze = vi.fn<StatisticsDependencies['analyze']>(async () => analysis)
  const session = new StatisticsSessionController({
    engine, analyze, importFile: vi.fn(), ...overrides,
  })
  sessions.push(session)
  return { session, engine, analyze, input: (samples: Float32Array, rate = 1000) => chunk!(samples, rate) }
}

const sessions: StatisticsSessionController[] = []
afterEach(() => { sessions.splice(0).forEach(session => session.destroy()) })

describe('whole-clip statistics session', () => {
  it('copies microphone buffers, joins paused segments and preserves material metadata', async () => {
    const { session, input, analyze } = createSession()
    const material = { id: 'practice-zh', title: '说话练习' }
    await session.start(material)
    const original = new Float32Array(200).fill(0.25)
    input(original)
    original.fill(0)
    session.leave()
    expect(session.getSnapshot()).toMatchObject({ phase: 'paused', elapsed: 0.2, material })
    await session.resume()
    input(new Float32Array(300).fill(0.5))
    session.pause()
    session.finish()
    await vi.waitFor(() => expect(session.getSnapshot().report).not.toBeNull())
    const clip = analyze.mock.calls[0][0] as StatisticsClip
    expect(clip.duration).toBe(0.5)
    expect(clip.samples.length).toBe(500)
    expect(clip.samples[0]).toBe(0.25)
    expect(clip.samples[200]).toBe(0.5)
    expect(session.getSnapshot().report?.clip.material).toEqual(material)
  })

  it('caps recording at exactly 60 seconds and pauses for explicit completion', async () => {
    const { session, input } = createSession()
    await session.start(null)
    input(new Float32Array(61000))
    expect(session.getSnapshot()).toMatchObject({ phase: 'paused', elapsed: 60, atLimit: true, report: null })
    await session.resume()
    expect(session.getSnapshot().phase).toBe('paused')
    session.finish()
    await vi.waitFor(() => expect(session.getSnapshot().report?.clip.samples.length).toBe(60000))
  })

  it('cancels a pending permission request when leaving before any audio arrives', async () => {
    let grant!: () => void
    let signal: AbortSignal | undefined
    const engine = {
      startCapture: vi.fn((_callback, options) => {
        signal = options?.signal
        return new Promise<void>(resolve => { grant = resolve })
      }),
      stopCapture: vi.fn(),
    }
    const { session } = createSession({ engine })
    const pending = session.start(null)
    session.leave()
    expect(signal?.aborted).toBe(true)
    grant()
    await pending
    expect(session.getSnapshot().phase).toBe('ready')
  })

  it('discards late import and analysis results after cancellation', async () => {
    let resolveImport!: (clip: StatisticsClip) => void
    const { session, analyze } = createSession({
      importFile: () => new Promise(resolve => { resolveImport = resolve }),
    })
    const importing = session.importFile(new File([], 'voice.wav'))
    session.cancel()
    resolveImport({ samples: new Float32Array(1000), sampleRate: 1000, duration: 1, source: 'file', name: 'voice.wav', material: null })
    await importing
    expect(analyze).not.toHaveBeenCalled()
    expect(session.getSnapshot()).toMatchObject({ phase: 'ready', report: null })

    let resolveAnalysis!: (value: StatisticsAnalysis) => void
    const task = createSession({ analyze: () => new Promise(resolve => { resolveAnalysis = resolve }) })
    await task.session.start(null)
    task.input(new Float32Array(1000))
    task.session.pause()
    task.session.finish()
    task.session.cancel()
    resolveAnalysis(analysis)
    await Promise.resolve()
    expect(task.session.getSnapshot()).toMatchObject({ phase: 'ready', report: null })
  })

  it('retains a failed clip for retry and publishes only a successful analysis', async () => {
    const analyze = vi.fn().mockRejectedValueOnce(new Error('分析失败')).mockResolvedValueOnce(analysis)
    const { session, input } = createSession({ analyze })
    await session.start(null)
    input(new Float32Array(4000))
    session.pause()
    session.finish()
    await vi.waitFor(() => expect(session.getSnapshot().phase).toBe('error'))
    expect(session.getSnapshot().report).toBeNull()
    session.retry()
    await vi.waitFor(() => expect(session.getSnapshot().report).not.toBeNull())
    expect(analyze.mock.calls[0][0]).toBe(analyze.mock.calls[1][0])
  })
})
