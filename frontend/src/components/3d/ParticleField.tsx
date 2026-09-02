import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface ParticleFieldProps {
  count?: number;
  color?: string;
  size?: number;
  radius?: number;
  speed?: number;
}

function generateParticles(count: number, radius: number): Float32Array {
  const pos = new Float32Array(count * 3);
  let seed = 42;
  const pseudoRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    pos[i3] = (pseudoRandom() - 0.5) * radius;
    pos[i3 + 1] = (pseudoRandom() - 0.5) * radius;
    pos[i3 + 2] = (pseudoRandom() - 0.5) * radius;
  }
  return pos;
}

export const ParticleField: React.FC<ParticleFieldProps> = ({
  count = 600,
  color = '#6366f1',
  size = 0.03,
  radius = 6,
  speed = 0.2,
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const positions = useMemo(() => generateParticles(count, radius), [count, radius]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y += delta * speed * 0.3;
    pointsRef.current.rotation.x += delta * speed * 0.15;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        color={color}
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};
