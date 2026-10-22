import { useMemo, useCallback } from 'react'
import { useAppStore } from '../store/appStore'
import { useAnalysis } from './useAnalysis'
import { usePlayback } from './usePlayback'
import { recordingBuffer } from '../audio/recordingBuffer'
import { encodeWav } from '../audio/wavExport'
import { useToastStore } from '../store/toastStore'

export interface ToolItem {
  id: string
  variant: 'primary' | 'ghost'
  icon: string
  label: string
  recording?: boolean
  disabled?: boolean
}

// 音频操作先统一停止回放，配置、帮助与关于不触发音频状态变化。
const AUDIO_ACTIONS = new Set(['record', 'import', 'playback', 'export', 'clear'])

export function useToolbar(
  onConfig: () => void,
  onHelp: () => void,
  onAbout: () => void,
) {
  const frameCount = useAppStore(s => s.frames.length)
  const {
    onRecord: analysisRecord,
    onImport: analysisImport,
    onClear: analysisClear,
    isCapturing,
    isRequesting,
    dataSource,
    fileInputRef,
    handleFileChange,
    onSuspend,
  } = useAnalysis()
  const { play, stop, isPlaying, cursorTime } = usePlayback()
  const suspend = useCallback(() => {
    stop()
    onSuspend()
  }, [stop, onSuspend])

  const hasData = isCapturing || frameCount > 0

  // ── Constrained callbacks (纯操作) ──

  const handleRecord = useCallback(() => {
    analysisRecord()
  }, [analysisRecord])

  const handleImport = useCallback(() => {
    analysisImport()
  }, [analysisImport])

  const handlePlayback = useCallback(() => {
    isPlaying ? stop() : play()
  }, [isPlaying, play, stop])

  const handleClear = useCallback(() => {
    analysisClear()
  }, [analysisClear])

  const handleExport = useCallback(() => {
    const samples = recordingBuffer.read()
    if (samples.length === 0) {
      useToastStore.getState().showToast('info', '还没有可下载的音频，请先录音或导入音频。')
      return
    }
    try {
      const blob = new Blob([encodeWav(samples)], { type: 'audio/wav' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      const date = new Date()
      const pad = (value: number) => String(value).padStart(2, '0')
      anchor.download = `voice-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}.wav`
      anchor.href = url
      document.body.appendChild(anchor)
      try { anchor.click() } finally {
        anchor.remove()
        // 为浏览器启动下载留出时间，同时释放音频 Blob 所占内存。
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
      }
    } catch {
      useToastStore.getState().showToast('error', '下载音频失败，请重试。')
    }
  }, [])

  // ── 统一约束入口（仅对音频操作生效） ──

  const handleClickTool = useCallback(async (toolId: string) => {
    if (toolId === 'export' && isRequesting) return
    if (!AUDIO_ACTIONS.has(toolId)) {
      // config / help / about — no pre-checks
      if (toolId === 'config') onConfig()
      else if (toolId === 'help') onHelp()
      else if (toolId === 'about') onAbout()
      return
    }

    // 音频操作：统一前置检查
    if (isPlaying) stop()
    if (toolId !== 'record' && isCapturing) {
      const stopped = analysisRecord()
      // 导出在录音管线收尾后读取缓冲，避免遗漏最后一段真实采样。
      if (toolId === 'export') await stopped
    }

    switch (toolId) {
      case 'record':   handleRecord(); break
      case 'import':   handleImport(); break
      case 'playback': handlePlayback(); break
      case 'export':   handleExport(); break
      case 'clear':    handleClear(); break
    }
  }, [isPlaying, isCapturing, isRequesting, stop, analysisRecord,
      handleRecord, handleImport, handlePlayback, handleExport, handleClear,
      onConfig, onHelp, onAbout])

  // ── Resolved tool items ──

  const recorderLabel = isRequesting
    ? '麦克风授权中…'
    : isCapturing
      ? '停止录音'
      : hasData && dataSource === 'mic'
        ? '继续录音'
        : '开始录音'

  const toolItems: ToolItem[] = useMemo(() => [
    {
      id: 'record',
      variant: 'primary',
      icon: isCapturing ? '■' : '●',
      label: recorderLabel,
      recording: isCapturing,
      disabled: isRequesting,
    },
    {
      id: 'import',
      variant: 'ghost',
      icon: '↥',
      label: '导入音频',
    },
    {
      id: 'playback',
      variant: 'ghost',
      icon: isPlaying ? '■' : '♫',
      label: isPlaying ? '停止' : '回放',
      disabled: isRequesting || !(hasData || isCapturing),
    },
    {
      id: 'export',
      variant: 'ghost',
      icon: '↓',
      label: '下载 WAV',
      disabled: !hasData || isRequesting,
    },
    {
      id: 'clear',
      variant: 'ghost',
      icon: '↺',
      label: '清空',
      disabled: !(hasData || isCapturing),
    },
    {
      id: 'config',
      variant: 'ghost',
      icon: '⚙',
      label: '配置',
    },
    {
      id: 'help',
      variant: 'ghost',
      icon: '?',
      label: '帮助',
    },
    {
      id: 'about',
      variant: 'ghost',
      icon: 'ⓘ',
      label: '关于',
    },
  ], [isCapturing, isRequesting, isPlaying, hasData, dataSource, recorderLabel])

  return {
    suspend,
    toolItems,
    handleClickTool,
    hasData,
    cursorTime,
    fileInputRef,
    handleFileChange,
    isCapturing,
    isRequesting,
  }
}
