import { useState, useRef, useCallback, useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import { useToastStore } from '../store/toastStore'
import { getAudioEngine } from '../ts'
import { recordingBuffer } from '../audio/recordingBuffer'
import { AnalysisPipeline, parseWav, isWavFile, Resampler } from '../dsp'
import { AudioTooLongError, decodeAudioFile, probeAudioDuration, probeWavDuration } from '../audio/audioDecoder'
import type { AnalysisFrame } from '../types'
import { AUDIO_SAMPLE_RATE } from '../config/audioLimits'
import { getAnalyticsPage, track } from '../analytics/analytics'
import { recordPracticeSamples } from '../analytics/practiceProgress'
import { useRegisterCalibrationStore } from '../store/registerCalibrationStore'
import { registerOptionsForCalibration } from '../dsp/register-calibration'
import { RegisterDetector } from '../dsp/register-detector'

const STEREO_NOTICE = '该音频为双声道，仅使用第 0 声道进行分析'

function recordingErrorReason(err: unknown): 'permission' | 'device' | 'unsupported' | 'unknown' {
  if (!(err instanceof DOMException)) return 'unknown'
  if (['NotAllowedError', 'SecurityError'].includes(err.name)) return 'permission'
  if (['NotFoundError', 'NotReadableError', 'AbortError'].includes(err.name)) return 'device'
  return err.name === 'NotSupportedError' ? 'unsupported' : 'unknown'
}

function importErrorReason(err: unknown): 'too_long' | 'unsupported_or_corrupt' | 'unknown' {
  if (err instanceof AudioTooLongError) return 'too_long'
  if (err instanceof DOMException) return 'unsupported_or_corrupt'
  if (err instanceof Error && /Not a RIFF file|Not a WAV file|chunk not found|Unsupported bitsPerSample|Failed to load audio metadata|Failed to read audio duration/.test(err.message)) {
    return 'unsupported_or_corrupt'
  }
  return 'unknown'
}

function importErrorMessage(err: unknown): string {
  if (err instanceof AudioTooLongError) {
    return `音频不能超过 ${useAppStore.getState().config.audioRetentionSeconds} 秒，请裁剪后重试。`
  }
  if (err instanceof DOMException) {
    return '浏览器不支持该音频格式或文件已损坏，请尝试 wav/mp3/m4a。'
  }
  const message = err instanceof Error ? err.message : ''
  if (/Not a RIFF file|Not a WAV file/.test(message)) {
    return '不支持的文件格式，请选择 .wav 文件。'
  }
  if (/chunk not found/.test(message)) {
    return '文件已损坏或不是有效的 WAV 文件。'
  }
  if (/Unsupported bitsPerSample/.test(message)) {
    return '不支持的编码，仅支持 8/16/24/32 位 PCM。'
  }
  if (/Failed to load audio metadata|Failed to read audio duration/.test(message)) {
    return '无法读取音频信息，请检查文件。'
  }
  return '导入失败，请检查文件后重试。'
}

export function useAnalysis() {
  const pipelineRef = useRef<InstanceType<typeof AnalysisPipeline> | null>(null)
  const captureAbortRef = useRef<AbortController | null>(null)
  const frameOffsetRef = useRef(0)
  const dataSourceRef = useRef<'mic' | 'file'>('mic')
  const [dataSource, setDataSource] = useState<'mic' | 'file'>('mic')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  useEffect(() => useRegisterCalibrationStore.subscribe((state, previous) => {
    if (state.calibration !== previous.calibration) {
      const options = registerOptionsForCalibration(state.calibration)
      pipelineRef.current?.setRegisterOptions(options)
      // 已显示的录音也用新边界重新着色，避免同一图表混用两套标定。
      const store = useAppStore.getState()
      const detector = new RegisterDetector(options)
      const frames = store.frames.map(frame => {
        const result = detector.push({ f0: frame.f0, voiced: frame.voiced ?? false, magnitudes: frame.magnitudes, sampleRate: AUDIO_SAMPLE_RATE })
        return { ...frame, register: result.register, registerConfidence: result.confidence }
      })
      store.setFrames(frames)
      if (store.latestFrame) store.setLatestFrame(frames.find(frame => frame.time === store.latestFrame!.time) ?? null)
    }
  }), [])

  // ── Shared stop-recording helper ──

  const stopRecording = useCallback((flush: boolean) => {
    captureAbortRef.current?.abort()
    captureAbortRef.current = null
    const pipeline = pipelineRef.current
    if (pipeline) {
      if (flush) {
        const store = useAppStore.getState()
        const lastComplete = store.latestFrame
        pipeline.flush()
        frameOffsetRef.current += pipeline.frameCount
        store.setLatestFrame(lastComplete)
      }
      pipeline.reset()
      pipelineRef.current = null
    }
    getAudioEngine().stopCapture()
    setIsCapturing(false)
    setIsRequesting(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      captureAbortRef.current?.abort()
      pipelineRef.current?.reset()
      pipelineRef.current = null
      getAudioEngine().stopCapture()
    }
  }, [])

  // ── Audio chunk handler ──

  const onAudioChunk = useCallback((chunk: Float32Array, rate: number) => {
    recordingBuffer.write(chunk)
    pipelineRef.current?.pushChunk(chunk, rate)
    recordPracticeSamples(chunk.length, rate)
  }, [])

  // ── Import commit (shared by WAV & decoded paths) ──

  const commitImport = useCallback((samples: Float32Array) => {
    const config = useAppStore.getState().config
    if (samples.length > config.audioRetentionSeconds * AUDIO_SAMPLE_RATE) {
      throw new AudioTooLongError()
    }
    const frames = AnalysisPipeline.analyze(
      samples, AUDIO_SAMPLE_RATE, config.formantMethod, config.formantSmoothing, config.formantSmoothingWindow,
      registerOptionsForCalibration(useRegisterCalibrationStore.getState().calibration),
    )
    recordingBuffer.clear()
    recordingBuffer.write(samples)
    useAppStore.getState().clearFrames()
    useAppStore.getState().setFrames(frames)
    dataSourceRef.current = 'file'
    setDataSource('file')
    frameOffsetRef.current = 0
    const page = getAnalyticsPage()
    if (page) track('audio_import', { page, result: 'success' })
  }, [])

  // ── Record ──

  const onRecord = useCallback(async () => {
    if (isCapturing) {
      stopRecording(true)
      return
    }

    // Guard: already requesting permission
    if (isRequesting) return

    setIsRequesting(true)
    const captureAbort = new AbortController()
    captureAbortRef.current = captureAbort

    const config = useAppStore.getState().config  // 快照

    // dataSource='file' → clear frames and start fresh
    if (dataSourceRef.current === 'file') {
      frameOffsetRef.current = 0
      recordingBuffer.clear()
      useAppStore.getState().clearFrames()
    }

    try {
      await getAudioEngine().startCapture(onAudioChunk, { signal: captureAbort.signal })
      if (captureAbort.signal.aborted) return

      // Only create pipeline AFTER capture succeeds
      pipelineRef.current = new AnalysisPipeline({
        onFrame: (frame: AnalysisFrame) => {
          useAppStore.getState().appendFrame(frame)
        },
        formantMethod: config.formantMethod,
        formantSmoothing: config.formantSmoothing,
        formantSmoothingWindow: config.formantSmoothingWindow,
        frameOffset: frameOffsetRef.current,
        registerOptions: registerOptionsForCalibration(useRegisterCalibrationStore.getState().calibration),
      })

      dataSourceRef.current = 'mic'
      setDataSource('mic')
      setIsCapturing(true)
      setIsRequesting(false)
      const page = getAnalyticsPage()
      if (page) track('record_start', { page })
    } catch (err) {
      if (captureAbort.signal.aborted) return
      const page = getAnalyticsPage()
      if (page) track('record_error', { page, reason: recordingErrorReason(err) })
      console.error('Failed to start recording:', err)
      // Firefox rejects mic streams whose device rate differs from a custom
      // AudioContext rate (NotSupportedError); guide users instead of a
      // generic permission toast.
      if (
        err instanceof DOMException &&
        err.name === 'NotSupportedError' &&
        /different sample-rate/.test(err.message)
      ) {
        useToastStore.getState().showToast('error', '当前 Firefox 无法以所需采样率连接麦克风，请升级 Firefox（≥148）或改用 Chrome/Edge。')
      } else {
        useToastStore.getState().showToast('error', '无法启动录音,请检查麦克风权限。')
      }
      setIsRequesting(false)
    }
  }, [isCapturing, isRequesting, stopRecording, onAudioChunk])

  // ── Clear ──

  const onClear = useCallback(() => {
    stopRecording(false)
    recordingBuffer.clear()
    useAppStore.getState().clearFrames()
    frameOffsetRef.current = 0
    dataSourceRef.current = 'mic'
    setDataSource('mic')
  }, [stopRecording])

  // ── WAV import ──

  const onImport = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (isImporting) return

    setIsImporting(true)
    stopRecording(false)

    try {
      const head = await file.slice(0, 12).arrayBuffer()

      if (isWavFile(head)) {
        // 优先读取 WAV 头拒绝超长文件；无法读取时仍由采样数检查兜底。
        const duration = await probeWavDuration(file)
        if (duration !== null && duration > useAppStore.getState().config.audioRetentionSeconds) {
          throw new AudioTooLongError()
        }
        const buf = await file.arrayBuffer()
        const parsed = parseWav(buf)
        if (parsed.numChannels > 1) {
          useToastStore.getState().showToast('info', STEREO_NOTICE)
        }
        let samples = parsed.samples
        if (parsed.sampleRate !== AUDIO_SAMPLE_RATE) {
          samples = new Resampler(parsed.sampleRate, AUDIO_SAMPLE_RATE).process(samples)
        }
        commitImport(samples)
        return
      }

      // 压缩音频先检查时长，避免为超长文件执行完整解码。
      const duration = await probeAudioDuration(file)
      if (duration > useAppStore.getState().config.audioRetentionSeconds) {
        throw new AudioTooLongError()
      }

      const buf = await file.arrayBuffer()
      const decoded = await decodeAudioFile(buf)
      if (decoded.numChannels > 1) {
        useToastStore.getState().showToast('info', STEREO_NOTICE)
      }
      let samples = decoded.samples
      if (decoded.sampleRate !== AUDIO_SAMPLE_RATE) {
        samples = new Resampler(decoded.sampleRate, AUDIO_SAMPLE_RATE).process(samples)
      }
      commitImport(samples)
    } catch (err) {
      console.error('Audio import failed:', err)
      const page = getAnalyticsPage()
      if (page) track('audio_import', { page, result: 'failure', reason: importErrorReason(err) })
      useToastStore.getState().showToast('error', importErrorMessage(err))
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [stopRecording, commitImport, isImporting])

  const onSuspend = useCallback(() => stopRecording(true), [stopRecording])

  return {
    onSuspend,
    onRecord,
    onImport,
    onClear,
    isCapturing,
    isRequesting,
    dataSource,
    fileInputRef,
    handleFileChange,
  }
}
