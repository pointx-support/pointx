import React from 'react';

export interface StudioLightingProps {
  intensity?: number;
  ambientIntensity?: number;
  primaryColor?: string;
  secondaryColor?: string;
}

export const StudioLighting: React.FC<StudioLightingProps> = ({
  intensity = 1.5,
  ambientIntensity = 0.6,
  primaryColor = '#ffffff',
  secondaryColor = '#6366f1',
}) => {
  return (
    <>
      <ambientLight intensity={ambientIntensity} />
      {/* Key Light */}
      <directionalLight
        position={[5, 8, 5]}
        intensity={intensity}
        color={primaryColor}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      {/* Fill Light */}
      <directionalLight
        position={[-5, 3, -3]}
        intensity={intensity * 0.4}
        color={secondaryColor}
      />
      {/* Rim / Back Light */}
      <pointLight
        position={[0, -4, -4]}
        intensity={intensity * 0.5}
        color="#38bdf8"
      />
    </>
  );
};
