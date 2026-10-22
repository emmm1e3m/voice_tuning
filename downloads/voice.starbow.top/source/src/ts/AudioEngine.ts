export interface AudioEngineOptions {
  sampleRate?: number
}

export interface CaptureOptions {
  signal?: AbortSignal
  onInterrupted?: () => void
}

export class AudioEngine {
  private _audioContext: AudioContext | null = null
  private _stream: MediaStream | null = null
  private _source: MediaStreamAudioSourceNode | null = null
  private _processor: ScriptProcessorNode | null = null
  private _silentGain: GainNode | null = null
  private _sampleRate: number
  private _isCapturing: boolean = false
  private _captureRequest = 0
  private _captureAbortCleanup: (() => void) | null = null
  private _trackCleanup: (() => void) | null = null

  constructor(options: AudioEngineOptions = {}) {
    this._sampleRate = options.sampleRate ?? 16000
  }

  get sampleRate(): number { return this._sampleRate }
  get isCapturing(): boolean { return this._isCapturing }
  get audioContext(): AudioContext {
    if (!this._audioContext) {
      this._audioContext = new AudioContext({ sampleRate: this._sampleRate })
    }
    return this._audioContext
  }

  async startCapture(onChunk: (chunk: Float32Array, rate: number) => void, options: CaptureOptions = {}): Promise<void> {
    options.signal?.throwIfAborted()
    if (this._isCapturing) return

    const request = ++this._captureRequest
    this._captureAbortCleanup?.()
    const cancel = () => { if (request === this._captureRequest) this.stopCapture() }
    options.signal?.addEventListener('abort', cancel, { once: true })
    this._captureAbortCleanup = () => options.signal?.removeEventListener('abort', cancel)

    // 关闭会逐渐压低麦克风信号的回声消除、降噪及自动增益。
    let stream: MediaStream | null = null
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      })
      // 权限对话框无法由网页关闭；取消后迟到的授权不得留下麦克风流。
      if (request !== this._captureRequest || options.signal?.aborted) {
        throw new DOMException('录音请求已取消', 'AbortError')
      }
      this._stream = stream

      const ctx = this.audioContext
      await ctx.resume()
      if (request !== this._captureRequest || options.signal?.aborted) {
        throw new DOMException('录音请求已取消', 'AbortError')
      }

      const interrupted = () => {
        if (request !== this._captureRequest) return
        this.stopCapture()
        options.onInterrupted?.()
      }
      stream.getTracks().forEach(track => track.addEventListener('ended', interrupted))
      const activeStream = stream
      this._trackCleanup = () => activeStream.getTracks().forEach(track => track.removeEventListener('ended', interrupted))

      this._source = ctx.createMediaStreamSource(stream)
      this._processor = ctx.createScriptProcessor(1024, 1, 1)
      this._processor.onaudioprocess = (event) => {
        const chunk = event.inputBuffer.getChannelData(0)
        onChunk(chunk, ctx.sampleRate)
      }
      this._source.connect(this._processor)
      // 静音输出保持处理节点工作，同时避免麦克风回授到扬声器。
      const silentGain = ctx.createGain()
      silentGain.gain.value = 0
      this._processor.connect(silentGain)
      silentGain.connect(ctx.destination)
      this._silentGain = silentGain

      this._isCapturing = true
    } catch (error) {
      stream?.getTracks().forEach(track => track.stop())
      if (request === this._captureRequest) this.stopCapture()
      throw error
    }
  }

  stopCapture(): void {
    this._captureRequest++
    this._captureAbortCleanup?.()
    this._captureAbortCleanup = null
    this._trackCleanup?.()
    this._trackCleanup = null
    this._isCapturing = false
    if (this._processor) {
      this._processor.disconnect()
      this._processor = null
    }
    if (this._silentGain) {
      this._silentGain.disconnect()
      this._silentGain = null
    }
    if (this._source) {
      this._source.disconnect()
      this._source = null
    }
    if (this._stream) {
      this._stream.getTracks().forEach(t => t.stop())
      this._stream = null
    }
  }

  createPlaybackSource(samples: Float32Array): {
    source: AudioBufferSourceNode
    totalDuration: number
  } {
    const ctx = this.audioContext
    ctx.resume()
    const buffer = ctx.createBuffer(1, samples.length, this._sampleRate)
    buffer.getChannelData(0).set(samples)

    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)

    return {
      source,
      totalDuration: samples.length / this._sampleRate,
    }
  }

  destroy(): void {
    this.stopCapture()
    if (this._audioContext) {
      this._audioContext.close()
      this._audioContext = null
    }
  }
}
