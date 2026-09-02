import React, { Suspense } from 'react';
import { useGLTF, Center } from '@react-three/drei';
import * as THREE from 'three';

export interface ModelProps {
  url: string;
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  castShadow?: boolean;
  receiveShadow?: boolean;
}

export const Model: React.FC<ModelProps> = ({
  url,
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  castShadow = true,
  receiveShadow = true,
}) => {
  const { scene } = useGLTF(url);

  React.useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = castShadow;
        child.receiveShadow = receiveShadow;
      }
    });
  }, [scene, castShadow, receiveShadow]);

  return (
    <primitive
      object={scene}
      scale={scale}
      position={position}
      rotation={rotation}
    />
  );
};

export interface ModelViewerProps extends ModelProps {
  center?: boolean;
}

export const ModelViewer: React.FC<ModelViewerProps> = ({
  center = true,
  ...props
}) => {
  return (
    <Suspense fallback={null}>
      {center ? (
        <Center>
          <Model {...props} />
        </Center>
      ) : (
        <Model {...props} />
      )}
    </Suspense>
  );
};

// Hook for preloading 3D models
export const preloadModel = (url: string) => {
  useGLTF.preload(url);
};
