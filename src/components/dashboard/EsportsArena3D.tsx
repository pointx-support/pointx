import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export interface EsportsArena3DProps {
  className?: string;
}

const checkWebGLAvailability = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch {
    return false;
  }
};

export const EsportsArena3D: React.FC<EsportsArena3DProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [webGlSupported] = useState(checkWebGLAvailability);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !webGlSupported) return;

    const isMobile = window.innerWidth < 768;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    
    // Controlled esports graphite depth fog
    scene.fog = new THREE.FogExp2(0x0a0d13, 0.045);

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 540;

    const camera = new THREE.PerspectiveCamera(
      isMobile ? 48 : 38,
      width / height,
      0.1,
      80
    );
    
    // Elevated perspective angle looking down on the tournament stage
    if (isMobile) {
      camera.position.set(0, 3.8, 6.6);
      camera.lookAt(0, 0.1, 0);
    } else {
      camera.position.set(0, 3.5, 6.2);
      camera.lookAt(0, 0.1, 0);
    }

    // 2. WebGL Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isMobile,
        alpha: true,
        powerPreference: 'high-performance'
      });
    } catch {
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(isMobile ? 1.0 : Math.min(window.devicePixelRatio, 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 3. Lighting System (Restrained & Purposeful)
    const ambientLight = new THREE.AmbientLight(0x131924, 1.8);
    scene.add(ambientLight);

    // Warm Gold Spotlight focused on the central PointX Engine
    const centralKeyLight = new THREE.SpotLight(0xf59e0b, isMobile ? 3.0 : 4.2);
    centralKeyLight.position.set(0, 7.5, 2.5);
    centralKeyLight.angle = Math.PI / 4.5;
    centralKeyLight.penumbra = 0.8;
    scene.add(centralKeyLight);

    // Cool Slate Rim Light for Edge Definition
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    rimLight.position.set(-5, 4, -4);
    scene.add(rimLight);

    // Central Dynamic Core Point Light (Breathes gently)
    const corePointLight = new THREE.PointLight(0xfbbf24, 2.5, 7);
    corePointLight.position.set(0, 0.8, 0);
    scene.add(corePointLight);

    // 4. Centerpiece Arena Hierarchy Group
    const arenaMasterGroup = new THREE.Group();
    scene.add(arenaMasterGroup);

    // Materials Palette (Dark Metals & Warm Gold Accents)
    const darkGraphiteMat = new THREE.MeshStandardMaterial({
      color: 0x121722,
      metalness: 0.88,
      roughness: 0.28
    });

    const carbonTierMat = new THREE.MeshStandardMaterial({
      color: 0x192130,
      metalness: 0.82,
      roughness: 0.35
    });

    const stageFloorMat = new THREE.MeshStandardMaterial({
      color: 0x0f141d,
      metalness: 0.92,
      roughness: 0.2
    });

    const goldGlowMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.85
    });

    const goldHighlightMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.7,
      metalness: 0.9,
      roughness: 0.2
    });

    const pathwayGlowMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.75
    });

    // --- A. Base Stadium Foundation (Level 1: Octagonal Outer Ring) ---
    const baseGeo = new THREE.CylinderGeometry(2.9, 3.15, 0.22, isMobile ? 8 : 16);
    const baseMesh = new THREE.Mesh(baseGeo, darkGraphiteMat);
    baseMesh.position.y = -0.55;
    arenaMasterGroup.add(baseMesh);

    // Level 1 Gold Edge Trim
    const baseEdgeRing = new THREE.TorusGeometry(2.92, 0.02, 8, isMobile ? 32 : 64);
    const baseEdgeMesh = new THREE.Mesh(baseEdgeRing, goldGlowMat);
    baseEdgeMesh.rotation.x = Math.PI / 2;
    baseEdgeMesh.position.y = -0.44;
    arenaMasterGroup.add(baseEdgeMesh);

    // --- B. Intermediate Stepped Tier (Level 2: Hexagonal Sub-Deck) ---
    const midGeo = new THREE.CylinderGeometry(2.1, 2.28, 0.18, isMobile ? 6 : 12);
    const midMesh = new THREE.Mesh(midGeo, carbonTierMat);
    midMesh.position.y = -0.38;
    arenaMasterGroup.add(midMesh);

    // Level 2 Gold Edge Trim
    const midEdgeRing = new THREE.TorusGeometry(2.12, 0.018, 8, isMobile ? 32 : 64);
    const midEdgeMesh = new THREE.Mesh(midEdgeRing, goldGlowMat);
    midEdgeMesh.rotation.x = Math.PI / 2;
    midEdgeMesh.position.y = -0.29;
    arenaMasterGroup.add(midEdgeMesh);

    // --- C. Center Stage Deck (Level 3: Central Arena Floor) ---
    const centerDeckGeo = new THREE.CylinderGeometry(1.4, 1.48, 0.14, isMobile ? 6 : 12);
    const centerDeckMesh = new THREE.Mesh(centerDeckGeo, stageFloorMat);
    centerDeckMesh.position.y = -0.22;
    arenaMasterGroup.add(centerDeckMesh);

    // --- D. Integrated Tournament Bracket Conduit Pathways & Stations ---
    // 4 Cardinal Tournament Stations (Round 1, Round 2, Semifinals, Grand Final)
    const stationLocations = [
      { angle: 0, label: 'Round 1', height: 0.15, radius: 2.35 },
      { angle: Math.PI / 2, label: 'Round 2', height: 0.2, radius: 2.35 },
      { angle: Math.PI, label: 'Semifinals', height: 0.26, radius: 2.35 },
      { angle: (3 * Math.PI) / 2, label: 'Finals', height: 0.34, radius: 2.35 }
    ];

    const pulses: THREE.Mesh[] = [];

    stationLocations.forEach((st, idx) => {
      // Station Node Platform
      const nodeGeo = new THREE.BoxGeometry(0.32, st.height, 0.32);
      const nodeMesh = new THREE.Mesh(nodeGeo, idx === 3 ? goldHighlightMat : darkGraphiteMat);
      const posX = Math.cos(st.angle) * st.radius;
      const posZ = Math.sin(st.angle) * st.radius;
      nodeMesh.position.set(posX, -0.35 + st.height / 2, posZ);
      nodeMesh.rotation.y = -st.angle;
      arenaMasterGroup.add(nodeMesh);

      // Station Beacon Light
      const beaconGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.08, 8);
      const beaconMat = new THREE.MeshBasicMaterial({
        color: idx === 3 ? 0xffffff : 0xf59e0b
      });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.set(posX, -0.35 + st.height + 0.04, posZ);
      arenaMasterGroup.add(beacon);

      // Pathway Beam (Conduit Track connecting Station to Central Deck)
      const pathLength = st.radius - 1.35;
      const pathGeo = new THREE.BoxGeometry(0.06, 0.02, pathLength);
      const pathMesh = new THREE.Mesh(pathGeo, pathwayGlowMat);
      const midRadius = (st.radius + 1.35) / 2;
      pathMesh.position.set(
        Math.cos(st.angle) * midRadius,
        -0.18,
        Math.sin(st.angle) * midRadius
      );
      pathMesh.rotation.y = -st.angle + Math.PI / 2;
      arenaMasterGroup.add(pathMesh);

      // Traveling Energy/Data Pulse on Pathway (Players -> Matches -> Scoring)
      const pulseGeo = new THREE.SphereGeometry(0.04, 8, 8);
      const pulseMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const pulse = new THREE.Mesh(pulseGeo, pulseMat);
      pulse.userData = { angle: st.angle, startR: st.radius, endR: 1.35, offset: idx * 0.25 };
      pulse.position.set(posX, -0.16, posZ);
      arenaMasterGroup.add(pulse);
      pulses.push(pulse);
    });

    // --- E. Central PointX "X" Monolithic Core Engine Structure ---
    const coreGroup = new THREE.Group();
    coreGroup.position.set(0, 0.45, 0);
    arenaMasterGroup.add(coreGroup);

    // Left Diag Beam of "X"
    const beamGeo = new THREE.BoxGeometry(0.24, 1.25, 0.18);
    const xBeam1 = new THREE.Mesh(beamGeo, darkGraphiteMat);
    xBeam1.rotation.z = Math.PI / 4.2;
    coreGroup.add(xBeam1);

    // Right Diag Beam of "X"
    const xBeam2 = new THREE.Mesh(beamGeo, darkGraphiteMat);
    xBeam2.rotation.z = -Math.PI / 4.2;
    coreGroup.add(xBeam2);

    // Glowing Gold Edge Liners on "X"
    const linerGeo = new THREE.BoxGeometry(0.05, 1.28, 0.2);
    const liner1 = new THREE.Mesh(linerGeo, goldGlowMat);
    liner1.rotation.z = Math.PI / 4.2;
    coreGroup.add(liner1);

    const liner2 = new THREE.Mesh(linerGeo, goldGlowMat);
    liner2.rotation.z = -Math.PI / 4.2;
    coreGroup.add(liner2);

    // Central Nucleus Crystal (PointX Center Anchor)
    const nucleusGeo = new THREE.OctahedronGeometry(0.2, 0);
    const nucleusMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.0,
      metalness: 0.95,
      roughness: 0.1
    });
    const nucleus = new THREE.Mesh(nucleusGeo, nucleusMat);
    coreGroup.add(nucleus);

    // Vertical Arena Uplight Column (Faint, atmospheric broadcast beacon)
    const beamColumnGeo = new THREE.CylinderGeometry(0.18, 0.45, 2.6, 16, 1, true);
    const beamColumnMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide
    });
    const beamColumn = new THREE.Mesh(beamColumnGeo, beamColumnMat);
    beamColumn.position.y = 1.2;
    coreGroup.add(beamColumn);

    // --- F. Outer Tournament Progression Ring ---
    const orbitalRingGeo = new THREE.TorusGeometry(3.45, 0.015, 8, isMobile ? 32 : 64);
    const orbitalRingMat = new THREE.MeshBasicMaterial({
      color: 0x334155,
      transparent: true,
      opacity: 0.45
    });
    const orbitalRing = new THREE.Mesh(orbitalRingGeo, orbitalRingMat);
    orbitalRing.rotation.x = Math.PI / 2.05;
    orbitalRing.position.y = -0.48;
    arenaMasterGroup.add(orbitalRing);

    // --- G. Background Arena Amphitheater Silhouette Arc (Subtle grandeur) ---
    if (!isMobile) {
      const archCount = 10;
      for (let i = 0; i < archCount; i++) {
        const theta = ((i - (archCount - 1) / 2) / archCount) * (Math.PI * 0.85) - Math.PI / 2;
        const archGeo = new THREE.BoxGeometry(0.12, 0.7 + Math.sin(i * 0.6) * 0.3, 0.08);
        const archMesh = new THREE.Mesh(archGeo, darkGraphiteMat);
        const dist = 4.2;
        archMesh.position.set(Math.cos(theta) * dist, -0.15, Math.sin(theta) * dist);
        archMesh.rotation.y = -theta + Math.PI / 2;
        arenaMasterGroup.add(archMesh);
      }
    }

    // --- H. Polar Radar Ground Grid ---
    const polarGrid = new THREE.PolarGridHelper(4.6, 12, 6, 24, 0xf59e0b, 0x1e293b);
    polarGrid.position.y = -0.58;
    (polarGrid.material as THREE.Material).transparent = true;
    (polarGrid.material as THREE.Material).opacity = 0.18;
    arenaMasterGroup.add(polarGrid);

    // 5. Smooth Mouse Parallax & Resize Handling
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      if (isMobile) return;
      const rect = container.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      targetX = x * 0.35;
      targetY = y * 0.25;
    };

    if (!isMobile) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
    }

    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize, { passive: true });

    // 6. Animation Loop (Slow, fluid, purpose-driven)
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse camera parallax
      if (!isMobile) {
        mouseX += (targetX - mouseX) * 0.04;
        mouseY += (targetY - mouseY) * 0.04;
        camera.position.x = mouseX * 1.5;
        camera.position.y = 3.5 + mouseY * 0.8;
        camera.lookAt(0, 0.15, 0);
      }

      // Very subtle slow arena revolution
      arenaMasterGroup.rotation.y = elapsedTime * 0.035;

      // Central Core Light Pulse (Tournament Engine Heartbeat)
      const corePulse = Math.sin(elapsedTime * 1.6);
      corePointLight.intensity = 2.0 + corePulse * 0.6;
      nucleus.rotation.y = elapsedTime * 0.5;
      nucleus.rotation.x = Math.sin(elapsedTime * 0.4) * 0.2;

      // Data pulses traveling along tournament pathways
      pulses.forEach((p) => {
        const u = ((elapsedTime * 0.45 + p.userData.offset) % 1);
        const curR = p.userData.startR - u * (p.userData.startR - p.userData.endR);
        p.position.x = Math.cos(p.userData.angle) * curR;
        p.position.z = Math.sin(p.userData.angle) * curR;
        (p.material as THREE.MeshBasicMaterial).opacity = Math.sin(u * Math.PI);
      });

      renderer.render(scene, camera);
    };

    animate();

    // 7. Cleanup on Unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (!isMobile) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
      window.removeEventListener('resize', handleResize);

      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      baseGeo.dispose();
      baseEdgeRing.dispose();
      midGeo.dispose();
      midEdgeRing.dispose();
      centerDeckGeo.dispose();
      beamGeo.dispose();
      linerGeo.dispose();
      nucleusGeo.dispose();
      beamColumnGeo.dispose();
      orbitalRingGeo.dispose();

      darkGraphiteMat.dispose();
      carbonTierMat.dispose();
      stageFloorMat.dispose();
      goldGlowMat.dispose();
      goldHighlightMat.dispose();
      pathwayGlowMat.dispose();
      nucleusMat.dispose();
      beamColumnMat.dispose();
      orbitalRingMat.dispose();

      renderer.dispose();
      scene.clear();
    };
  }, [webGlSupported]);

  if (!webGlSupported) {
    return (
      <div className={`relative w-full h-full min-h-[380px] flex items-center justify-center pointer-events-none select-none ${className}`}>
        <div className="relative w-64 h-64 rounded-full border border-[var(--accent-primary)]/20 bg-[var(--bg-surface-inset)]/60 flex items-center justify-center">
          <div className="w-48 h-48 rounded-full border border-[var(--accent-primary)]/30 animate-pulse" />
          <div className="absolute font-mono text-xs text-[var(--accent-primary)] font-bold tracking-widest uppercase">
            PointX Tournament Arena
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[380px] sm:min-h-[440px] md:min-h-[500px] overflow-hidden pointer-events-none select-none ${className}`}
      aria-hidden="true"
    />
  );
};
