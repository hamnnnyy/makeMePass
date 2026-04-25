'use client';

import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { WireframeSphere } from '../components/WireframeSphere';
import { useMicReactive } from '../hooks/useMicReactive';

export function HeroScene() {
  const { start, active, error, getPitch, getSpeechRate, getAmplitude } = useMicReactive();

  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 60 }}
        gl={{ antialias: true }}
        style={{ background: '#080810' }}
      >
        <WireframeSphere
          getPitch={getPitch}
          getSpeechRate={getSpeechRate}
          getAmplitude={getAmplitude}
        />
        <EffectComposer>
          <Bloom intensity={1.8} luminanceThreshold={0.15} luminanceSmoothing={0.9} />
        </EffectComposer>
      </Canvas>

      {!active && !error && (
        <button
          onClick={start}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 px-8 py-3 text-sm tracking-[0.25em] text-white/50 border border-white/15 rounded-full hover:text-white/80 hover:border-white/35 transition-all duration-300"
        >
          TAP TO SPEAK
        </button>
      )}

      {active && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
          </span>
          <span className="text-xs tracking-[0.2em] text-white/40">LISTENING</span>
        </div>
      )}

      {error && (
        <p className="absolute bottom-10 left-1/2 -translate-x-1/2 text-xs text-white/30">
          {error}
        </p>
      )}
    </div>
  );
}
