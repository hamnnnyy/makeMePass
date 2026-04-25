'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Ring config — bass (inner) → mids → highs (outer)
// hdr: base color in HDR space (values > 1 feed the bloom pass)
// binStart/binStep: how to sample the 512 FFT bins for this ring
// ---------------------------------------------------------------------------
interface RingConfig {
  radius: number;
  count: number;
  maxHeight: number;
  binStart: number;
  binStep: number;
  hdr: readonly [number, number, number];
}

const RINGS: readonly RingConfig[] = [
  // bass  0–63  Hz range  → inner ring, orange-red
  { radius: 1.3, count: 64, maxHeight: 2.8, binStart: 0,   binStep: 1, hdr: [2.2, 0.55, 0.05] },
  // mids  64–191 Hz range → middle ring, cyan-green
  { radius: 2.15, count: 64, maxHeight: 2.2, binStart: 64,  binStep: 2, hdr: [0.05, 2.0, 1.6] },
  // highs 192–511 Hz range → outer ring, violet-purple
  { radius: 3.0, count: 64, maxHeight: 1.6, binStart: 192, binStep: 5, hdr: [1.3, 0.15, 2.8] },
] as const;

// ---------------------------------------------------------------------------
// Single ring of vertical instanced bars
// ---------------------------------------------------------------------------
interface RingBarsProps {
  cfg: RingConfig;
  getFrequencyData: () => Uint8Array<ArrayBuffer>;
}

function RingBars({ cfg, getFrequencyData }: RingBarsProps) {
  const { radius, count, maxHeight, binStart, binStep, hdr } = cfg;

  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const material = useMemo(
    () => new THREE.MeshBasicMaterial({ toneMapped: false }),
    []
  );

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material]
  );

  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const smoothed = useRef(new Float32Array(count).fill(0));
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const col = useMemo(() => new THREE.Color(), []);

  // Bar cross-section: proportional to ring circumference, 65 % fill
  const barW = (2 * Math.PI * radius) / count * 0.65;

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const freq = getFrequencyData();

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const binIdx = Math.min(binStart + i * binStep, freq.length - 1);
      const raw = freq.length ? freq[binIdx] / 255 : 0;

      // Exponential smoothing — decouple from frame rate (approximation)
      smoothed.current[i] += (raw - smoothed.current[i]) * 0.15;
      const mag = smoothed.current[i];
      const h = Math.max(0.012, mag * maxHeight);

      // Bar grows upward from y = 0
      dummy.position.set(radius * Math.cos(angle), h * 0.5, radius * Math.sin(angle));
      dummy.scale.set(barW, h, barW);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      // Brightness: 0.12 (silent) → up to 2.4× base HDR (loud)
      const b = 0.12 + mag * 2.3;
      col.setRGB(hdr[0] * b, hdr[1] * b, hdr[2] * b);
      mesh.setColorAt(i, col);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return <instancedMesh ref={meshRef} args={[geometry, material, count]} />;
}

// ---------------------------------------------------------------------------
// Pulsing centre orb
// ---------------------------------------------------------------------------
interface OrbProps {
  getFrequencyData: () => Uint8Array<ArrayBuffer>;
}

function CentreOrb({ getFrequencyData }: OrbProps) {
  const geometry = useMemo(() => new THREE.SphereGeometry(0.18, 20, 20), []);
  const material = useMemo(
    () => new THREE.MeshBasicMaterial({ color: new THREE.Color(2.5, 2.5, 3.5), toneMapped: false }),
    []
  );

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material]
  );

  const meshRef = useRef<THREE.Mesh>(null!);
  const smooth = useRef(0);

  useFrame(() => {
    const freq = getFrequencyData();
    // Average of first 8 bins (sub-bass punch)
    let bass = 0;
    const n = Math.min(8, freq.length);
    for (let i = 0; i < n; i++) bass += freq[i];
    const raw = n ? bass / (n * 255) : 0;
    smooth.current += (raw - smooth.current) * 0.12;

    const s = 0.2 + smooth.current * 1.0;
    meshRef.current.scale.setScalar(s);
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} />;
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------
interface Props {
  getFrequencyData: () => Uint8Array<ArrayBuffer>;
}

export function CircularMatrix({ getFrequencyData }: Props) {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.18;
    }
  });

  return (
    <group ref={groupRef}>
      {RINGS.map((cfg) => (
        <RingBars key={cfg.radius} cfg={cfg} getFrequencyData={getFrequencyData} />
      ))}
      <CentreOrb getFrequencyData={getFrequencyData} />
    </group>
  );
}
