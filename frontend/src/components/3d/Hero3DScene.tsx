import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { StudioLighting } from './Lighting';
import { ParticleField } from './ParticleField';
import { InteractiveMesh } from './InteractiveMesh';
import { WebGLBoundary, WebGLFallback } from './WebGLBoundary';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { cn } from '../../lib/utils';

export interface Hero3DSceneProps {
  className?: string;
  enableControls?: boolean;
  showParticles?: boolean;
  primaryColor?: string;
  secondaryColor?: string;
  geometry?: 'box' | 'sphere' | 'torus' | 'octahedron' | 'dodecahedron';
  children?: React.ReactNode;
}

export const Hero3DScene: React.FC<Hero3DSceneProps> = ({
  className,
  enableControls = true,
  showParticles = true,
  primaryColor = '#6366f1',
  secondaryColor = '#38bdf8',
  geometry = 'octahedron',
  children,
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className={cn('relative w-full h-[400px] sm:h-[480px] rounded-3xl overflow-hidden', className)}>
      <WebGLBoundary fallback={<WebGLFallback title="3D Experience" message="Interactive 3D preview is paused or unsupported." />}>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 45 }}
          // Mobile GPU optimization: cap pixel ratio between 1 and 1.75
          dpr={[1, 1.75]}
          gl={{
            antialias: true,
            powerPreference: 'high-performance',
            alpha: true,
          }}
          className="w-full h-full"
        >
          <StudioLighting primaryColor={primaryColor} secondaryColor={secondaryColor} />
          
          <Suspense fallback={null}>
            {showParticles && !prefersReducedMotion && (
              <ParticleField count={400} color={primaryColor} />
            )}

            {children || (
              <InteractiveMesh
                geometry={geometry}
                color={primaryColor}
                hoverColor={secondaryColor}
              />
            )}

            {enableControls && (
              <OrbitControls
                enableZoom={false}
                enablePan={false}
                maxPolarAngle={Math.PI / 1.75}
                minPolarAngle={Math.PI / 2.25}
                autoRotate={!prefersReducedMotion}
                autoRotateSpeed={0.8}
              />
            )}
          </Suspense>
        </Canvas>
      </WebGLBoundary>
    </div>
  );
};
