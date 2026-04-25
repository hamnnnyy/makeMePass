export class MicAnalyser {
  private ctx: AudioContext | null = null;
  private node: AnalyserNode | null = null;
  private stream: MediaStream | null = null;
  private freqBuf = new Float32Array(0);
  private timeBuf = new Float32Array(0);
  private rateHistory: Array<{ t: number; v: number }> = [];

  async connect(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    this.ctx = new AudioContext();
    const src = this.ctx.createMediaStreamSource(this.stream);
    this.node = this.ctx.createAnalyser();
    this.node.fftSize = 2048;
    this.node.smoothingTimeConstant = 0.6;
    this.freqBuf = new Float32Array(this.node.frequencyBinCount);
    this.timeBuf = new Float32Array(this.node.fftSize);
    src.connect(this.node);
    // Not connected to destination — no mic feedback
  }

  /** RMS amplitude of the current audio frame (0–1 range approx) */
  getAmplitude(): number {
    if (!this.node) return 0;
    this.node.getFloatTimeDomainData(this.timeBuf);
    let s = 0;
    for (const v of this.timeBuf) s += v * v;
    return Math.sqrt(s / this.timeBuf.length);
  }

  /**
   * Dominant pitch in the human speech range (80–800 Hz), log-normalised to 0–1.
   * Returns 0 when silent.
   */
  getPitch(): number {
    if (!this.node || !this.ctx) return 0;
    this.node.getFloatFrequencyData(this.freqBuf);
    const binHz = this.ctx.sampleRate / this.node.fftSize;
    const lo = Math.floor(80 / binHz);
    const hi = Math.min(Math.floor(800 / binHz), this.freqBuf.length - 1);

    let peak = -Infinity;
    let peakIdx = lo;
    for (let i = lo; i <= hi; i++) {
      if (this.freqBuf[i] > peak) { peak = this.freqBuf[i]; peakIdx = i; }
    }

    if (peak < -55) return 0; // silence threshold
    const freq = peakIdx * binHz;
    return Math.max(0, Math.min(1, Math.log2(freq / 80) / Math.log2(10)));
  }

  /**
   * Estimates speech tempo from amplitude total-variation over the last 1.5 s.
   * 0 = silence / monotone, 1 = fast speech.
   */
  getSpeechRate(): number {
    const now = performance.now();
    const amp = this.getAmplitude();

    this.rateHistory.push({ t: now, v: amp });

    // Trim entries older than 1.5 s
    const cut = now - 1500;
    let start = 0;
    while (start < this.rateHistory.length && this.rateHistory[start].t < cut) start++;
    if (start > 0) this.rateHistory = this.rateHistory.slice(start);

    if (this.rateHistory.length < 4) return 0;

    let tv = 0;
    for (let i = 1; i < this.rateHistory.length; i++) {
      tv += Math.abs(this.rateHistory[i].v - this.rateHistory[i - 1].v);
    }
    return Math.min(tv * 3, 1);
  }

  disconnect(): void {
    this.stream?.getTracks().forEach(t => t.stop());
    this.ctx?.close().catch(() => undefined);
    this.stream = null;
    this.ctx = null;
    this.node = null;
    this.rateHistory = [];
  }
}
