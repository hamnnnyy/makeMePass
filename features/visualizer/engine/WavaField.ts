export interface WaveConfig {
    radius: number;
    helixPitch: number;
    particleCount: number;
    amplitudeX: number;
    amplitudeY: number;
    frequency: number;
}

export function getParticlePosition(
    i: number,
    t: number,
    config: WaveConfig
) : { x: number; y: number; z: number } {
    const theta = (i / config.particleCount) * Math.PI * 2;
    const z = (i / config.particleCount - 0.5) * config.helixPitch;
    const x = Math.cos(theta + t) * config.radius
            + Math.sin(z * config.frequency + t) * config.amplitudeX;
    const y = Math.sin(theta + t) * config.radius
            + Math.cos(z * config.frequency + t) * config.amplitudeY;
    
    return { x, y, z };
}