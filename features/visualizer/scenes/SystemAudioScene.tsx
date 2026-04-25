'use client';

import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { CircularMatrix } from '../components/CircularMatrix';
import { useSystemAudioReactive } from '../hooks/useSystemAudioReactive';

export function SystemAudioScene() {
  const { start, stop, active, error, getFrequencyData } = useSystemAudioReactive();

  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [0, 5, 9], fov: 55 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
        style={{ background: '#04040a' }}
      >
        <CircularMatrix getFrequencyData={getFrequencyData} />
        <OrbitControls
          enablePan={false}
          minDistance={4}
          maxDistance={16}
          maxPolarAngle={Math.PI * 0.78}
        />
        <EffectComposer>
          <Bloom
            intensity={2.8}
            luminanceThreshold={0.0}
            luminanceSmoothing={0.85}
          />
        </EffectComposer>
      </Canvas>

      {!active && !error && (
        <button
          onClick={start}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 px-8 py-3 text-sm tracking-[0.25em] text-white/50 border border-white/15 rounded-full hover:text-white/80 hover:border-white/35 transition-all duration-300"
        >
          SHARE AUDIO
        </button>
      )}

      {active && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
          </span>
          <span className="text-xs tracking-[0.2em] text-white/40">CAPTURING</span>
          <button
            onClick={stop}
            className="ml-2 text-xs text-white/25 hover:text-white/55 transition-colors"
          >
            STOP
          </button>
        </div>
      )}

      {error && (
        <p className="absolute bottom-10 left-1/2 -translate-x-1/2 text-xs text-red-400/70 max-w-xs text-center leading-relaxed">
          {error}
        </p>
      )}

      {/* Hint — only shown before capture starts */}
      {!active && !error && (
        <p className="absolute top-6 left-1/2 -translate-x-1/2 text-[10px] tracking-widest text-white/20 select-none">
          탭 공유 시 &quot;오디오 공유&quot; 활성화 필요 · 드래그로 회전
        </p>
      )}
    </div>
  );
}
