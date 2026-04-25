export interface WaveParticleOptions {
  cols: number;
  rows: number;
  width: number;
  height: number;
  waveFrequency: number;
  waveAmplitude: number;
  speed: number;
}

export class ParticleSystem {
  readonly positions: Float32Array;
  readonly colors: Float32Array;
  readonly count: number;

  private time = 0;
  private cols: number;
  private rows: number;
  private opts: WaveParticleOptions;

  constructor(opts: WaveParticleOptions) {
    this.opts = opts;
    this.cols = opts.cols;
    this.rows = opts.rows;
    this.count = opts.cols * opts.rows;
    this.positions = new Float32Array(this.count * 3);
    this.colors = new Float32Array(this.count * 3);
    this.initColors();
    this.update(0, 0);
  }

  private initColors() {
    const { cols, rows } = this;
    for (let j = 0; j < rows; j++) {
      const v = j / (rows - 1);
      const t = 1 - Math.abs(v - 0.5) * 2; // 0 at edges, 1 at center
      const t2 = t * t;
      const t3 = t2 * t;

      // Fire gradient: dark red-brown at edges → bright orange-yellow at center
      const r = 0.28 + t * 0.72;
      const g = 0.04 + t2 * 0.86;
      const b = t3 * 0.38;

      for (let i = 0; i < cols; i++) {
        const idx = (j * cols + i) * 3;
        this.colors[idx] = r;
        this.colors[idx + 1] = g;
        this.colors[idx + 2] = b;
      }
    }
  }

  update(dt: number, audioIntensity = 0) {
    this.time += dt;
    const { cols, rows, opts, time } = this;
    const { width, height, waveFrequency, waveAmplitude, speed } = opts;
    const amp = waveAmplitude * (1 + audioIntensity * 0.8);
    const halfHeight = height * 0.5;

    for (let j = 0; j < rows; j++) {
      const baseY = (j / (rows - 1) - 0.5) * height;
      const twist = Math.sin(time * 0.25) * 0.12 * (baseY / halfHeight);
      const rowOffset = j * cols;

      for (let i = 0; i < cols; i++) {
        const idx = (rowOffset + i) * 3;
        const x = (i / (cols - 1) - 0.5) * width;

        const phase1 = x * waveFrequency + time * speed;
        const phase2 = x * waveFrequency * 0.55 - time * speed * 0.75 + Math.PI * 0.33;

        const y =
          baseY +
          Math.sin(phase1) * amp * 0.68 +
          Math.sin(phase2) * amp * 0.32 +
          twist;

        const z = Math.sin(phase1 * 0.72 + j * 0.11) * 0.18;

        this.positions[idx] = x;
        this.positions[idx + 1] = y;
        this.positions[idx + 2] = z;
      }
    }
  }
}
