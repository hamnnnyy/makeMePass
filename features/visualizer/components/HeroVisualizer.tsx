'use client';

import { useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferGeometry, BufferAttribute, Points } from 'three';
import { useParticleSystem } from '../hooks/useParticleSystem';
import { useAudioReactive } from '../hooks/useAudioReactive';

export function HeroVisualizer({ audioSource }: { audioSource?: HTMLAudioElement }) {
  const pointsRef = useRef<Points>(null!);
  const system = useParticleSystem({ count: 10800, preset: 'realistic' });
  const { getIntensity } = useAudioReactive(audioSource);

  useLayoutEffect(() => {
    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(system.positions, 3));
    geo.setAttribute('color', new BufferAttribute(system.colors, 3));
    pointsRef.current.geometry = geo;
    return () => geo.dispose();
  }, [system]);

  useFrame((_, delta) => {
    const geo = pointsRef.current?.geometry;
    if (!geo) return;
    system.update(delta, getIntensity());
    (geo.getAttribute('position') as BufferAttribute).needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <pointsMaterial
        size={0.028}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.92}
        depthWrite={false}
      />
    </points>
  );
}
