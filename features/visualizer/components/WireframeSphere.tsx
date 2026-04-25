'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Props {
  getPitch: () => number;      // 0–1, 음의 높낮이 → 변위 진폭
  getSpeechRate: () => number; // 0–1, 말의 빠르기 → 애니메이션 속도
  getAmplitude: () => number;  // 0–∞, 음량 세기 → 추가 부스트
}

// ---------------------------------------------------------------------------
// GLSL shaders — displacement computed on GPU per vertex
// ---------------------------------------------------------------------------

const VERT = /* glsl */ `
uniform float uTime;
uniform float uAmplitude;
uniform float uSpeed;
varying vec3 vNorm;

float hash(vec3 p) {
  p = fract(p * vec3(443.897, 441.423, 437.195));
  p += dot(p, p.yxz + 19.19);
  return fract((p.x + p.y) * p.z);
}

float noise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(
      mix(hash(i),              hash(i + vec3(1,0,0)), f.x),
      mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
    mix(
      mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
      mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
    f.z
  );
}

void main() {
  vNorm = normalize(position);

  // Two-octave fBm — low freq gives overall swell, high freq gives detail
  float n1 = noise(vNorm * 3.0 + uTime * uSpeed * 0.6);
  float n2 = noise(vNorm * 7.5 + uTime * uSpeed * 1.5);
  float disp = (n1 * 0.67 + n2 * 0.33 - 0.5) * uAmplitude;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position + vNorm * disp, 1.0);
}
`;

const FRAG = /* glsl */ `
varying vec3 vNorm;

void main() {
  // Vertical gradient: cyan (#00e5ff) → blue → purple (#8c00ff)
  float t = (vNorm.y + 1.0) * 0.5;
  vec3 cTop = vec3(0.0,  0.898, 1.0);
  vec3 cMid = vec3(0.22, 0.36,  1.0);
  vec3 cBot = vec3(0.55, 0.0,   1.0);
  vec3 col  = t > 0.5
    ? mix(cMid, cTop, (t - 0.5) * 2.0)
    : mix(cBot, cMid, t * 2.0);
  gl_FragColor = vec4(col, 0.88);
}
`;

// ---------------------------------------------------------------------------

export function WireframeSphere({ getPitch, getSpeechRate, getAmplitude }: Props) {
  const geometry = useMemo(() => {
    // Detail 5 → 10 242 vertices, 20 480 triangles → fine-mesh look
    const sphere = new THREE.IcosahedronGeometry(1.9, 5);
    const wf = new THREE.WireframeGeometry(sphere);
    sphere.dispose();
    return wf;
  }, []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms: {
          uTime:      { value: 0 },
          uAmplitude: { value: 0.04 },
          uSpeed:     { value: 0.4 },
        },
        transparent: true,
        depthWrite: false,
      }),
    []
  );

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material]
  );

  const meshRef     = useRef<THREE.LineSegments>(null!);
  const smoothPitch = useRef(0);
  const smoothRate  = useRef(0);
  const smoothAmp   = useRef(0);

  useFrame((_, delta) => {
    // Exponential smoothing — decoupled from frame rate
    smoothPitch.current += (getPitch()                       - smoothPitch.current) * 0.06;
    smoothRate.current  += (getSpeechRate()                  - smoothRate.current)  * 0.08;
    smoothAmp.current   += (Math.min(getAmplitude() * 6, 1) - smoothAmp.current)   * 0.15;

    const u = material.uniforms;
    u.uTime.value      += delta;
    // 음의 높낮이(pitch) → 변위 진폭
    u.uAmplitude.value  = 0.04 + smoothPitch.current * 0.38 + smoothAmp.current * 0.12;
    // 말의 빠르기(speech rate) → 노이즈 애니메이션 속도
    u.uSpeed.value      = 0.4  + smoothRate.current  * 2.2;

    if (meshRef.current) {
      // 빠르기에 따라 자전 속도도 증가
      meshRef.current.rotation.y += delta * (0.08 + smoothRate.current * 0.25);
      meshRef.current.rotation.x  = Math.sin(u.uTime.value * 0.15) * 0.06;
    }
  });

  return (
    <lineSegments ref={meshRef} geometry={geometry} material={material} />
  );
}
