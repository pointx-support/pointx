import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

export interface InteractiveMeshProps {
  geometry?: 'box' | 'sphere' | 'torus' | 'octahedron' | 'dodecahedron';
  color?: string;
  hoverColor?: string;
  wireframe?: boolean;
  scale?: number;
  position?: [number, number, number];
  onClick?: () => void;
}

export const InteractiveMesh: React.FC<InteractiveMeshProps> = ({
  geometry = 'octahedron',
  color = '#4f46e5',
  hoverColor = '#38bdf8',
  wireframe = false,
  scale = 1,
  position = [0, 0, 0],
  onClick,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [active, setActive] = useState(false);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x += delta * (hovered ? 0.8 : 0.3);
    meshRef.current.rotation.y += delta * (hovered ? 1.0 : 0.4);
  });

  const renderGeometry = () => {
    switch (geometry) {
      case 'box':
        return <boxGeometry args={[1.5, 1.5, 1.5]} />;
      case 'sphere':
        return <sphereGeometry args={[1, 32, 32]} />;
      case 'torus':
        return <torusGeometry args={[1, 0.4, 16, 100]} />;
      case 'dodecahedron':
        return <dodecahedronGeometry args={[1.2, 0]} />;
      case 'octahedron':
      default:
        return <octahedronGeometry args={[1.4, 0]} />;
    }
  };

  return (
    <Float
      speed={hovered ? 3 : 1.5}
      rotationIntensity={1}
      floatIntensity={2}
    >
      <mesh
        ref={meshRef}
        position={position}
        scale={active ? scale * 1.15 : hovered ? scale * 1.08 : scale}
        onClick={() => {
          setActive(!active);
          if (onClick) onClick();
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {renderGeometry()}
        <meshStandardMaterial
          color={hovered ? hoverColor : color}
          roughness={0.2}
          metalness={0.8}
          wireframe={wireframe}
        />
      </mesh>
    </Float>
  );
};
