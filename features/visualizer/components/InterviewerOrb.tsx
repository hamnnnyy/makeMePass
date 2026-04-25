'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Props {
  getFrequencyData: () => Uint8Array;
  getAmplitude: () => number;
  color: readonly [number, number, number];
}

// ---------------------------------------------------------------------------
// Ashima webgl-noise — Periodic Perlin Noise (pnoise)
// https://github.com/ashima/webgl-noise (MIT)
// ---------------------------------------------------------------------------
const PNOISE = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+10.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314*r; }
vec3 fade(vec3 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }

float pnoise(vec3 P, vec3 rep) {
  vec3 Pi0 = mod(floor(P), rep);
  vec3 Pi1 = mod(Pi0 + vec3(1.0), rep);
  Pi0 = mod289(Pi0); Pi1 = mod289(Pi1);
  vec3 Pf0 = fract(P);
  vec3 Pf1 = Pf0 - vec3(1.0);
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;
  vec4 ixy  = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);
  vec4 gx0 = ixy0*(1.0/7.0);
  vec4 gy0 = fract(floor(gx0)*(1.0/7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0*(step(0.0,gx0) - 0.5);
  gy0 -= sz0*(step(0.0,gy0) - 0.5);
  vec4 gx1 = ixy1*(1.0/7.0);
  vec4 gy1 = fract(floor(gx1)*(1.0/7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1*(step(0.0,gx1) - 0.5);
  gy1 -= sz1*(step(0.0,gy1) - 0.5);
  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x); vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z); vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x); vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z); vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
  vec4 norm0 = taylorInvSqrt(vec4(dot(g000,g000),dot(g010,g010),dot(g100,g100),dot(g110,g110)));
  g000*=norm0.x; g010*=norm0.y; g100*=norm0.z; g110*=norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001,g001),dot(g011,g011),dot(g101,g101),dot(g111,g111)));
  g001*=norm1.x; g011*=norm1.y; g101*=norm1.z; g111*=norm1.w;
  float n000=dot(g000,Pf0);
  float n100=dot(g100,vec3(Pf1.x,Pf0.yz));
  float n010=dot(g010,vec3(Pf0.x,Pf1.y,Pf0.z));
  float n110=dot(g110,vec3(Pf1.xy,Pf0.z));
  float n001=dot(g001,vec3(Pf0.xy,Pf1.z));
  float n101=dot(g101,vec3(Pf1.x,Pf0.y,Pf1.z));
  float n011=dot(g011,vec3(Pf0.x,Pf1.yz));
  float n111=dot(g111,Pf1);
  vec3 fade_xyz = fade(Pf0);
  vec4 n_z  = mix(vec4(n000,n100,n010,n110), vec4(n001,n101,n011,n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  return 2.2 * mix(n_yz.x, n_yz.y, fade_xyz.x);
}
`;

const VERT = /* glsl */ `
${PNOISE}

uniform float u_time;
uniform float u_frequency;
varying vec3  vNormal;

void main() {
  vNormal = normalize(normalMatrix * normal);

  float noise        = 3.0 * pnoise(position + u_time, vec3(10.0));
  float displacement = (u_frequency / 30.0) * (noise / 10.0);
  vec3  newPosition  = position + normal * displacement;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
`;

const FRAG = /* glsl */ `
uniform float u_red;
uniform float u_green;
uniform float u_blue;
uniform float u_frequency;
varying vec3  vNormal;

void main() {
  // Fresnel: 실루엣 가장자리 → 1, 정면 → 0
  float fresnel = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0))), 2.0);
  float f = clamp(u_frequency / 255.0, 0.0, 1.0);

  // HDR 밝기 — 가장자리가 훨씬 밝아 bloom이 rim에 집중됨
  float brightness = 0.45 + fresnel * 3.8 + f * 1.2;

  // 오디오 없을 때 cool blue-white, 말할 때 pure white
  vec3 col = mix(
    vec3(u_red * 0.82, u_green * 0.88, u_blue * 1.0),
    vec3(u_red,        u_green,        u_blue),
    f
  );

  gl_FragColor = vec4(col * brightness, 1.0);
}
`;

// ---------------------------------------------------------------------------

export function InterviewerOrb({ getAmplitude, color }: Props) {
  // 튜토리얼 원본 값: IcosahedronGeometry(4, 30)
  const geo = useMemo(() => new THREE.IcosahedronGeometry(4, 30), []);

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms: {
          u_time:      { value: 0.0 },
          u_frequency: { value: 0.0 },
          u_red:       { value: 1.0 },
          u_green:     { value: 1.0 },
          u_blue:      { value: 1.0 },
        },
        wireframe: true,
      }),
    []
  );

  useEffect(
    () => () => {
      geo.dispose();
      mat.dispose();
    },
    [geo, mat]
  );

  useEffect(() => {
    mat.uniforms.u_red.value = color[0];
    mat.uniforms.u_green.value = color[1];
    mat.uniforms.u_blue.value = color[2];
  }, [color, mat]);

  const meshRef    = useRef<THREE.Mesh>(null!);
  const smoothFreq = useRef(0);

  useFrame((_, delta) => {
    // getAmplitude() 0–1 → 0–255 (THREE.AudioAnalyser.getAverageFrequency 스케일)
    const rawFreq = getAmplitude() * 255;
    smoothFreq.current += (rawFreq - smoothFreq.current) * 0.08;

    mat.uniforms.u_time.value      += delta;
    mat.uniforms.u_frequency.value  = smoothFreq.current;
  });

  return <mesh ref={meshRef} geometry={geo} material={mat} />;
}
