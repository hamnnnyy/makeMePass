export class AudioAnalyser {
  private context: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private data: Uint8Array<ArrayBuffer> = new Uint8Array(0);

  connect(element: HTMLAudioElement) {
    this.context = new AudioContext();
    const source = this.context.createMediaElementSource(element);
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 256;
    this.data = new Uint8Array(this.analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
    source.connect(this.analyser);
    this.analyser.connect(this.context.destination);
  }

  getIntensity(): number {
    if (!this.analyser) return 0;
    this.analyser.getByteFrequencyData(this.data);
    let sum = 0;
    const len = this.data.length;
    for (let i = 0; i < len; i++) sum += this.data[i];
    return sum / len / 255;
  }

  getBassIntensity(): number {
    if (!this.analyser) return 0;
    this.analyser.getByteFrequencyData(this.data);
    const bassEnd = Math.floor(this.data.length * 0.1);
    let sum = 0;
    for (let i = 0; i < bassEnd; i++) sum += this.data[i];
    return sum / bassEnd / 255;
  }

  disconnect() {
    this.context?.close();
    this.context = null;
    this.analyser = null;
  }
}
