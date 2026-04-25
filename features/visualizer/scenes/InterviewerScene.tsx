'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { InterviewerOrb } from '../components/InterviewerOrb';
import { useSystemAudioReactive } from '../hooks/useSystemAudioReactive';

const COLOR_PRESETS = [
  { label: 'WHITE', hex: '#ffffff' },
  { label: 'CYAN', hex: '#7ff8ff' },
  { label: 'AQUA', hex: '#64ffd8' },
  { label: 'ROSE', hex: '#ff9ecf' },
  { label: 'VIOLET', hex: '#baa7ff' },
  { label: 'AMBER', hex: '#ffd18a' },
] as const;

function hexToLinearColor(hex: string): readonly [number, number, number] {
  const col = new THREE.Color(hex);
  col.convertSRGBToLinear();
  return [col.r, col.g, col.b];
}

// 마우스 팔로우 카메라
function CameraRig() {
  const { camera } = useThree();
  const mouseX = useRef(0);
  const mouseY = useRef(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseX.current = (e.clientX - window.innerWidth  / 2) / 100;
      mouseY.current = (e.clientY - window.innerHeight / 2) / 100;
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  useFrame(() => {
    camera.position.x += (mouseX.current  - camera.position.x) * 0.05;
    camera.position.y += (-mouseY.current - camera.position.y) * 0.50;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

// 포스트프로세싱 — CA ref를 쓰면 React 19에서 ref가 props에 포함되어
// P 래퍼의 JSON.stringify(a)가 scene 순환참조로 터지므로 ref 없이 정적 사용
function SceneEffects() {
  const caOffset = useMemo(() => new THREE.Vector2(0.0018, 0.0018), []);

  return (
    <EffectComposer>
      <Bloom
        intensity={2.4}
        luminanceThreshold={0.15}
        luminanceSmoothing={0.9}
      />
      <ChromaticAberration offset={caOffset} />
      <Vignette eskil={false} offset={0.4} darkness={0.88} />
    </EffectComposer>
  );
}

export function InterviewerScene({color}: {color?: String}) {
  const { start, stop, active, error, getFrequencyData, getAmplitude } = useSystemAudioReactive();
  const [accentHex, setAccentHex] = useState<string>(color as String);
  const activeHex = accentHex.toLowerCase();
  const orbColor = useMemo(() => hexToLinearColor(accentHex), [accentHex]);

  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [0, -2, 14], fov: 45 }}
        gl={{
          antialias: true,
          outputColorSpace: THREE.SRGBColorSpace,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        style={{ background: '#000000' }}
      >
        <CameraRig />

        {/* 배경 별 파티클 */}
        <Stars radius={120} depth={60} count={3000} factor={4} saturation={0} fade speed={0.5} />

        <InterviewerOrb
          getFrequencyData={getFrequencyData}
          getAmplitude={getAmplitude}
          color={orbColor}
        />

        <SceneEffects />
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
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
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

      {!active && !error && (
        <p className="absolute top-6 left-1/2 -translate-x-1/2 text-[10px] tracking-widest text-white/20 select-none">
          탭 공유 시 &quot;오디오 공유&quot; 활성화 필요
        </p>
      )}

      <div className="absolute top-6 right-6 z-20 w-60 rounded-2xl border border-white/15 bg-black/45 p-4 backdrop-blur-md">
        <p className="text-[10px] tracking-[0.24em] text-white/45">COLOR SHIFT</p>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {COLOR_PRESETS.map((preset) => {
            const selected = activeHex === preset.hex;
            return (
              <button
                key={preset.hex}
                type="button"
                onClick={() => setAccentHex(preset.hex)}
                className={`relative h-8 rounded-md border transition-colors ${
                  selected ? 'border-white/70' : 'border-white/15 hover:border-white/35'
                }`}
                aria-label={`${preset.label} color`}
              >
                <span
                  className="absolute inset-1 rounded-[5px]"
                  style={{ background: preset.hex }}
                />
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between rounded-md border border-white/10 bg-white/[0.03] px-2 py-1.5">
          <span className="text-[10px] tracking-[0.18em] text-white/45">CUSTOM</span>
          <input
            type="color"
            value={accentHex}
            onChange={(e) => setAccentHex(e.target.value.toLowerCase())}
            className="h-6 w-8 cursor-pointer rounded border border-white/20 bg-transparent p-0"
            aria-label="Choose custom orb color"
          />
        </div>
      </div>
    </div>
  );
}
