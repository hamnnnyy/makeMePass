export class SystemAudioAnalyser {
  private ctx: AudioContext | null = null;
  private node: AnalyserNode | null = null;
  private stream: MediaStream | null = null;
  private freqBuf: Uint8Array<ArrayBuffer> = new Uint8Array(0);

  get binCount(): number {
    return this.node?.frequencyBinCount ?? 0;
  }

  async connect(): Promise<void> {
    // macOS + Chrome requires video:true for getDisplayMedia
    const stream = await navigator.mediaDevices.getDisplayMedia({
      audio: true,
      video: { width: 1, height: 1, frameRate: 1 },
    });

    // Stop video immediately — we only need the audio track
    stream.getVideoTracks().forEach((t) => t.stop());

    if (stream.getAudioTracks().length === 0) {
      stream.getTracks().forEach((t) => t.stop());
      throw new Error(
        '오디오 트랙이 없습니다. 화면 공유 시 "오디오 공유"를 활성화해주세요.'
      );
    }

    this.stream = stream;
    this.ctx = new AudioContext();
    const src = this.ctx.createMediaStreamSource(stream);
    this.node = this.ctx.createAnalyser();
    this.node.fftSize = 1024;
    this.node.smoothingTimeConstant = 0.8;
    this.freqBuf = new Uint8Array(this.node.frequencyBinCount);
    src.connect(this.node);
    // Not connected to destination — no echo
  }

  /** Uint8Array(512) of frequency magnitudes, 0–255 per bin */
  getFrequencyData(): Uint8Array<ArrayBuffer> {
    if (!this.node) return this.freqBuf;
    this.node.getByteFrequencyData(this.freqBuf);
    return this.freqBuf;
  }

  /** Average magnitude across all bins, normalised 0–1 */
  getAmplitude(): number {
    const freq = this.getFrequencyData();
    if (!freq.length) return 0;
    let sum = 0;
    for (const v of freq) sum += v;
    return sum / (freq.length * 255);
  }

  disconnect(): void {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.ctx?.close().catch(() => undefined);
    this.stream = null;
    this.ctx = null;
    this.node = null;
  }
}
