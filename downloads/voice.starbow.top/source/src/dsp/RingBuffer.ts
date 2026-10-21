export class RingBuffer {
  private buffer: Float32Array
  private _capacity: number
  private writePos: number = 0

  constructor(capacity: number) {
    this._capacity = capacity
    this.buffer = new Float32Array(capacity)
  }

  get capacity(): number {
    return this._capacity
  }

  get size(): number {
    return Math.min(this.writePos, this._capacity)
  }

  write(samples: Float32Array): void {
    let offset = 0
    while (offset < samples.length) {
      const idx = this.writePos % this._capacity
      const available = this._capacity - idx
      const toWrite = Math.min(samples.length - offset, available)
      this.buffer.set(samples.subarray(offset, offset + toWrite), idx)
      this.writePos += toWrite
      offset += toWrite
    }
  }

  read(): Float32Array {
    const size = this.size
    if (size === 0) return new Float32Array(0)
    if (this.writePos < this._capacity) {
      return this.buffer.slice(0, size)
    }
    const idx = this.writePos % this._capacity
    const result = new Float32Array(this._capacity)
    const firstPart = this._capacity - idx
    result.set(this.buffer.subarray(idx))
    result.set(this.buffer.subarray(0, idx), firstPart)
    return result
  }

  resize(capacity: number): void {
    if (!Number.isInteger(capacity) || capacity <= 0) throw new RangeError('缓冲容量必须为正整数')
    if (capacity === this._capacity) return
    // 调整原实例的容量，保留最新真实样本；扩容不会补入静音或恢复已丢弃音频。
    const retained = this.read().slice(-capacity)
    this._capacity = capacity
    this.buffer = new Float32Array(capacity)
    this.writePos = 0
    this.write(retained)
  }

  clear(): void {
    this.buffer.fill(0)
    this.writePos = 0
  }
}
