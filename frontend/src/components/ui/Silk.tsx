/* eslint-disable react/no-unknown-property */
import React, { forwardRef, useRef, useMemo, useLayoutEffect, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Color } from 'three';

const hexToNormalizedRGB = (hex: string): [number, number, number] => {
  hex = hex.replace('#', '');
  return [
    parseInt(hex.slice(0, 2), 16) / 255,
    parseInt(hex.slice(2, 4), 16) / 255,
    parseInt(hex.slice(4, 6), 16) / 255
  ];
};

const vertexShader = `
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vPosition = position;
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
varying vec2 vUv;
varying vec3 vPosition;

uniform float uTime;
uniform vec3  uColor;
uniform float uSpeed;
uniform float uScale;
uniform float uRotation;
uniform float uNoiseIntensity;
uniform float uLightMode;

const float e = 2.71828182845904523536;

float noise(vec2 texCoord) {
  float G = e;
  vec2  r = (G * sin(G * texCoord));
  return fract(r.x * r.y * (1.0 + texCoord.x));
}

vec2 rotateUvs(vec2 uv, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  mat2  rot = mat2(c, -s, s, c);
  return rot * uv;
}

void main() {
  float rnd        = noise(gl_FragCoord.xy);
  vec2  uv         = rotateUvs(vUv * uScale, uRotation);
  vec2  tex        = uv * uScale;
  float tOffset    = uSpeed * uTime;

  tex.y += 0.03 * sin(8.0 * tex.x - tOffset);

  float pattern = 0.6 +
                  0.4 * sin(5.0 * (tex.x + tex.y +
                                   cos(3.0 * tex.x + 5.0 * tex.y) +
                                   0.02 * tOffset) +
                           sin(20.0 * (tex.x + tex.y - 0.1 * tOffset)));

  float grain = rnd / 15.0 * uNoiseIntensity;
  vec3 result = uColor * pattern - vec3(grain);
  if (uLightMode > 0.5) {
    float fold = smoothstep(0.28, 0.9, pattern);
    float specular = smoothstep(0.72, 0.98, pattern);
    vec3 shadowColor = uColor * 0.72;
    vec3 bodyColor = min(uColor * 1.18, vec3(1.0));
    vec3 lightBase = mix(shadowColor, bodyColor, fold);
    lightBase = mix(lightBase, vec3(1.0), specular * 0.92);
    float fineNoise = noise(gl_FragCoord.xy * 0.63 + vec2(17.0, 41.0));
    float grainSignal = (rnd + fineNoise - 1.0);
    float grainStrength = clamp(uNoiseIntensity * 0.038, 0.0, 0.16);
    result = lightBase + grainSignal * grainStrength;
  }
  gl_FragColor = vec4(clamp(result, 0.0, 1.0), 1.0);
}
`;

interface SilkPlaneProps {
  uniforms: any;
}

const SilkPlane = forwardRef<any, SilkPlaneProps>(function SilkPlane({ uniforms }, ref) {
  const { viewport } = useThree();

  useLayoutEffect(() => {
    if (ref && 'current' in ref && ref.current) {
      ref.current.scale.set(viewport.width, viewport.height, 1);
    }
  }, [ref, viewport]);

  useFrame((_, delta) => {
    if (ref && 'current' in ref && ref.current?.material?.uniforms) {
      const u = ref.current.material.uniforms;
      if (u.uTime) u.uTime.value += 0.1 * delta;
      if (u.uLightMode && u.uLightModeTarget) {
        const diff = u.uLightModeTarget.value - u.uLightMode.value;
        if (Math.abs(diff) > 0.002) {
          u.uLightMode.value += diff * Math.min(1, delta * 8.0);
        } else {
          u.uLightMode.value = u.uLightModeTarget.value;
        }
      }
    }
  });

  return (
    // @ts-ignore
    <mesh ref={ref}>
      {/* @ts-ignore */}
      <planeGeometry args={[1, 1, 1, 1]} />
      {/* @ts-ignore */}
      <shaderMaterial uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} />
    </mesh>
  );
});
SilkPlane.displayName = 'SilkPlane';

export interface SilkProps {
  speed?: number;
  scale?: number;
  color?: string;
  noiseIntensity?: number;
  rotation?: number;
  lightMode?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const Silk: React.FC<SilkProps> = ({
  speed = 5,
  scale = 1,
  color = '#ffdede',
  noiseIntensity = 1.5,
  rotation = 0,
  lightMode = false,
  className = '',
  style
}) => {
  const meshRef = useRef<any>(null);

  const uniforms = useMemo(
    () => ({
      uSpeed: { value: speed },
      uScale: { value: scale },
      uNoiseIntensity: { value: noiseIntensity },
      uColor: { value: new Color(...hexToNormalizedRGB(color)) },
      uRotation: { value: rotation },
      uLightMode: { value: lightMode ? 1.0 : 0.0 },
      uLightModeTarget: { value: lightMode ? 1.0 : 0.0 },
      uTime: { value: 0 }
    }),
    []
  );

  useEffect(() => {
    if (uniforms.uSpeed) uniforms.uSpeed.value = speed;
    if (uniforms.uScale) uniforms.uScale.value = scale;
    if (uniforms.uNoiseIntensity) uniforms.uNoiseIntensity.value = noiseIntensity;
    if (uniforms.uColor) uniforms.uColor.value.setRGB(...hexToNormalizedRGB(color));
    if (uniforms.uRotation) uniforms.uRotation.value = rotation;
    if (uniforms.uLightModeTarget) uniforms.uLightModeTarget.value = lightMode ? 1.0 : 0.0;
  }, [speed, scale, noiseIntensity, color, rotation, lightMode, uniforms]);

  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        ...style
      }}
    >
      <Canvas
        dpr={[1, 1.5]}
        frameloop="always"
        gl={{ antialias: false, powerPreference: 'high-performance' }}
      >
        <SilkPlane ref={meshRef} uniforms={uniforms} />
      </Canvas>
    </div>
  );
};

export default Silk;