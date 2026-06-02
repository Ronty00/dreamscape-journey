"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { fantasyMusic } from '@/lib/music';
import { 
  getDreamTitle, getDestinyQuote, getGuardianSpirit, 
  getWelcomeMessage, getWorldEcho, getWorldThresholdText,
  getFinalBlessing, analyzeName, simpleHash, type NameProfile, type Guardian
} from '@/lib/generators';
import { 
  ArrowRight, Volume2, VolumeX, RotateCcw, Moon, 
  Sparkles, Heart 
} from 'lucide-react';
import type { MousePos, Phase, Particle } from '@/lib/types';
import InteractiveDust from '@/components/InteractiveDust';

// Seeded random for consistent worlds per name
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Cinematic Camera Controller with parallax + phase-specific positioning
function CameraController({ phase, mouse }: { phase: Phase; mouse: MousePos }) {
  const { camera } = useThree();

  const targetPos = React.useMemo(() => {
    switch (phase) {
      case 'sky':      return { x: 0, y: 8, z: 36 };
      case 'crystal':  return { x: -1, y: 3, z: 28 };
      case 'ocean':    return { x: 2, y: 5, z: 42 };
      case 'mirror':   return { x: 0, y: 2.5, z: 31 };   // lower, more intimate
      case 'forest':   return { x: 0, y: 7, z: 34 };
      case 'finale':   return { x: 1, y: 4, z: 29 };
      default:         return { x: 0, y: 6, z: 38 };
    }
  }, [phase]);

  useFrame((state) => {
    // Smooth lerp to target + gentle mouse parallax
    const targetX = targetPos.x + mouse.x * 4.5;
    const targetY = targetPos.y + mouse.y * 2.8;
    const targetZ = targetPos.z;

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.028);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.022);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.018);

    // Look slightly toward center of interest
    const lookX = mouse.x * 1.8;
    const lookY = 1.5 + mouse.y * 1.3;
    camera.lookAt(lookX, lookY, -12);
  });

  return null;
}

// ============================================
// 2D CANVAS: Name Particle Explosion + Portal
// ============================================
function NameParticleCanvas({ 
  name, 
  active, 
  onComplete 
}: { 
  name: string; 
  active: boolean; 
  onComplete: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | null>(null);
  const phaseRef = useRef<'explode' | 'portal'>('explode');
  const startTimeRef = useRef(0);

  useEffect(() => {
    if (!active || !name) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Create letter particles from name
    const particles: Particle[] = [];
    const centerX = canvas.width / 2;
    const centerY = canvas.height * 0.42;
    
    const fontSize = Math.min(92, Math.max(58, canvas.width / 14));
    ctx.font = `600 ${fontSize}px var(--font-playfair, serif)`;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Sample points from rendered text
    const tempCanvas = document.createElement('canvas');
    const tctx = tempCanvas.getContext('2d')!;
    tempCanvas.width = canvas.width;
    tempCanvas.height = 160;
    tctx.font = ctx.font;
    tctx.fillStyle = '#fff';
    tctx.textAlign = 'center';
    tctx.fillText(name.toUpperCase(), tempCanvas.width / 2, 90);

    const imageData = tctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imageData.data;

    let seed = simpleHash(name);
    for (let y = 0; y < tempCanvas.height; y += 3) {
      for (let x = 0; x < tempCanvas.width; x += 3) {
        const idx = (y * tempCanvas.width + x) * 4;
        if (data[idx + 3] > 140) {
          const px = x;
          const py = centerY - 50 + (y - 70);
          
          seed = (seed * 16807) % 2147483647;
          const spread = 1.8 + seededRandom(seed) * 2.6;
          
          particles.push({
            x: px,
            y: py,
            vx: (px - centerX) * 0.009 * spread + (seededRandom(seed + 3) - 0.5) * 1.8,
            vy: (py - centerY) * 0.009 * spread - 1.6 - seededRandom(seed + 7) * 1.1,
            life: 1 + seededRandom(seed + 11) * 0.9,
            size: 1.6 + seededRandom(seed + 13) * 2.2,
            hue: 42 + seededRandom(seed + 17) * 38,
          });
        }
      }
    }

    // Add extra magical dust
    for (let i = 0; i < 180; i++) {
      seed = (seed * 16807) % 2147483647;
      const angle = seededRandom(seed) * Math.PI * 2;
      const dist = 35 + seededRandom(seed + 2) * 95;
      particles.push({
        x: centerX + Math.cos(angle) * dist,
        y: centerY + Math.sin(angle) * dist * 0.5,
        vx: Math.cos(angle) * (2.2 + seededRandom(seed + 4) * 3.5),
        vy: Math.sin(angle) * (1.6 + seededRandom(seed + 5) * 2.8) - 2.2,
        life: 0.65 + seededRandom(seed + 9) * 1.35,
        size: 0.9 + seededRandom(seed + 12) * 1.9,
        hue: 190 + seededRandom(seed + 15) * 80,
      });
    }

    particlesRef.current = particles;
    phaseRef.current = 'explode';
    startTimeRef.current = performance.now();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const now = performance.now();
      const elapsed = (now - startTimeRef.current) / 1000;

      let allDead = true;

      particlesRef.current.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.028; // gravity
        p.vx *= 0.992;
        p.vy *= 0.992;
        p.life -= 0.0095;

        if (p.life > 0.02) {
          allDead = false;
          const alpha = Math.max(0, Math.min(1, p.life * 1.05));
          
          ctx.save();
          ctx.fillStyle = `hsla(${p.hue}, 88%, 88%, ${alpha * 0.95})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (0.6 + alpha * 0.6), 0, Math.PI * 2);
          ctx.fill();
          
          // Glow
          ctx.fillStyle = `hsla(${p.hue}, 92%, 96%, ${alpha * 0.28})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (2.1 + alpha * 1.4), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      // Transition to portal phase
      if (phaseRef.current === 'explode' && (elapsed > 2.1 || allDead)) {
        phaseRef.current = 'portal';
        startTimeRef.current = now;
      }

      if (phaseRef.current === 'portal') {
        const portalElapsed = (now - startTimeRef.current) / 1000;
        const portalProgress = Math.min(1, portalElapsed / 1.65);

        // Draw swirling portal
        const cx = canvas.width / 2;
        const cy = canvas.height * 0.46;
        const maxR = Math.max(canvas.width, canvas.height) * 0.42;

        ctx.save();
        
        // Outer glow
        const grad = ctx.createRadialGradient(cx, cy, maxR * 0.1, cx, cy, maxR);
        grad.addColorStop(0, `rgba(167, 139, 250, ${0.12 + portalProgress * 0.18})`);
        grad.addColorStop(0.45, `rgba(103, 232, 249, ${0.08 * (1 - portalProgress * 0.5)})`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
        ctx.fill();

        // Swirling rings
        for (let r = 0; r < 5; r++) {
          const radius = maxR * (0.18 + r * 0.15) * (0.7 + portalProgress * 0.6);
          const rot = (portalElapsed * (1.8 + r * 0.6)) % (Math.PI * 2);
          
          ctx.strokeStyle = `hsla(${260 + r * 11}, 75%, 88%, ${0.55 * (1 - portalProgress * 0.6)})`;
          ctx.lineWidth = 1.5 + (3 - r) * 0.6;
          
          ctx.beginPath();
          ctx.arc(cx, cy, radius, rot, rot + Math.PI * (1.4 + r * 0.15));
          ctx.stroke();
        }

        // Bright center core
        const coreSize = 18 + Math.sin(portalElapsed * 9) * 3.5;
        ctx.fillStyle = `rgba(245, 240, 255, ${0.75 + Math.sin(portalElapsed * 11) * 0.18})`;
        ctx.beginPath();
        ctx.arc(cx, cy, coreSize, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        if (portalProgress > 0.94) {
          window.removeEventListener('resize', resize);
          if (animationRef.current) cancelAnimationFrame(animationRef.current);
          onComplete();
          return;
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [active, name, onComplete]);

  if (!active) return null;

  return (
    <canvas 
      ref={canvasRef} 
      className="name-particles-canvas" 
    />
  );
}

// ============================================
// 3D SCENE COMPONENTS
// ============================================

// Sky Kingdom - Floating Islands, Whales, Lanterns
function SkyKingdomScene({ mouse, name }: { mouse: MousePos; name: string }) {
  const groupRef = React.useRef<THREE.Group>(null!);
  const whaleRef = React.useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = mouse.x * 0.22;
      groupRef.current.position.x = mouse.x * 1.8;
      groupRef.current.position.y = mouse.y * 1.1;
    }
    if (whaleRef.current) {
      whaleRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 1.6 + 3;
      whaleRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.4) * 0.1;
    }
  });

  const seed = simpleHash(name) * 0.7;

  return (
    <>
      <color attach="background" args={['#05070f']} />
      <ambientLight intensity={0.15} />
      <directionalLight position={[12, 28, -8]} intensity={0.65} color="#e8d5a3" />
      <pointLight position={[-18, -6, -22]} intensity={0.5} color="#67e8f9" />

      <Stars 
        radius={420} 
        depth={38} 
        count={260} 
        factor={3.2} 
        saturation={0} 
        fade 
        speed={0.3}
      />

      <group ref={groupRef}>
        {/* Floating Islands */}
        {[0, 1, 2, 3].map((i) => {
          const x = (i - 1.5) * 18 + (seededRandom(seed + i * 3) - 0.5) * 9;
          const y = 6 + i * -2.8 + seededRandom(seed + i) * 3.5;
          const z = -18 - i * 11 + seededRandom(seed + i * 5) * 7;
          const scale = 3.8 + seededRandom(seed + i * 9) * 1.8;
          
          return (
            <group key={i} position={[x, y, z]}>
              {/* Island base */}
              <mesh>
                <sphereGeometry args={[scale, 5, 4]} />
                <meshLambertMaterial color="#1a2338" flatShading />
              </mesh>
              {/* Grass / glowing top */}
              <mesh position={[0, scale * 0.55, 0]}>
                <sphereGeometry args={[scale * 0.88, 6, 3]} />
                <meshLambertMaterial color={i % 2 === 0 ? "#0f3d2f" : "#1f2a3f"} />
              </mesh>
              {/* Ruins */}
              <mesh position={[scale * 0.3, scale * 0.9, scale * -0.2]}>
                <boxGeometry args={[1.6, 3.2, 1.6]} />
                <meshLambertMaterial color="#3f3a2f" />
              </mesh>
              {/* Glowing lanterns */}
              {[ -1.6, 1.4 ].map((lx, li) => (
                <pointLight 
                  key={li}
                  position={[lx, scale * 1.1, -0.8]} 
                  color="#f4d48a" 
                  intensity={1.2 + Math.sin(i + li) * 0.3} 
                />
              ))}
            </group>
          );
        })}

        {/* Flying Whale */}
        <group ref={whaleRef} position={[-22, 4, -48]}>
          <mesh>
            <sphereGeometry args={[3.8, 7, 6]} />
            <meshLambertMaterial color="#2a3a5a" />
          </mesh>
          {/* Tail */}
          <mesh position={[-6.5, 0.2, 0]} rotation={[0, 0, 0.6]}>
            <coneGeometry args={[2.1, 7, 3]} />
            <meshLambertMaterial color="#24324a" />
          </mesh>
          {/* Fins */}
          <mesh position={[0.5, -2.2, 2.8]} rotation={[1.4, 0, 0.3]}>
            <coneGeometry args={[1.4, 4.5, 3]} />
            <meshLambertMaterial color="#1f2c45" />
          </mesh>
          {/* Soft glow on belly */}
          <mesh position={[0.8, -1.8, -1]}>
            <sphereGeometry args={[2.8, 6, 5]} />
            <meshBasicMaterial color="#7dd3fc" transparent opacity={0.1} />
          </mesh>
        </group>

        {/* Floating Lanterns */}
        {Array.from({ length: 7 }).map((_, i) => {
          const lx = (i - 3) * 11 + seededRandom(seed + i * 27) * 4;
          const ly = 11 + Math.sin(i) * 6;
          const lz = -32 + i * -5.5;
          return (
            <group key={i} position={[lx, ly, lz]}>
              <mesh>
                <sphereGeometry args={[0.55]} />
                <meshBasicMaterial color="#fde68a" />
              </mesh>
              <pointLight color="#f4d48a" intensity={1.35} distance={38} />
              {/* Light rays */}
              <mesh position={[0, -4.5, 0]}>
                <coneGeometry args={[0.9, 9, 3, 1, true]} />
                <meshBasicMaterial color="#f4d48a" transparent opacity={0.035} side={THREE.DoubleSide} />
              </mesh>
            </group>
          );
        })}

        {/* Slow moving clouds (soft planes) */}
        {Array.from({ length: 5 }).map((_, i) => (
          <mesh 
            key={i}
            position={[
              (i - 2) * 27 + Math.sin(i) * 8, 
              22 + i * -1.5, 
              -65 - i * 3
            ]}
            rotation={[0.2, i * 0.6, 0]}
          >
            <planeGeometry args={[28 + i * 3, 7]} />
            <meshBasicMaterial 
              color="#e2e8f0" 
              transparent 
              opacity={0.035 + i * 0.005} 
              side={THREE.DoubleSide} 
            />
          </mesh>
        ))}
      </group>
    </>
  );
}

// Crystal Cave Scene
function CrystalCaveScene({ mouse, name }: { mouse: MousePos; name: string }) {
  const groupRef = React.useRef<THREE.Group>(null!);
  const seed = simpleHash(name + 'crystal');

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = mouse.x * 0.35 + state.clock.elapsedTime * 0.015;
      groupRef.current.position.x = mouse.x * 2.4;
      groupRef.current.position.y = mouse.y * 0.9;
    }
  });

  const crystals = Array.from({ length: 11 }).map((_, i) => {
    const x = (i % 4 - 1.5) * 9 + (seededRandom(seed + i * 4) - 0.5) * 11;
    const y = -2 + seededRandom(seed + i * 2) * 13;
    const z = -8 - Math.floor(i / 4) * 15 + (seededRandom(seed + i * 11) - 0.5) * 4;
    const h = 6 + seededRandom(seed + i) * 7;
    const rot = seededRandom(seed + i * 13) * 1.8;
    return { x, y, z, h, rot, i };
  });

  return (
    <>
      <color attach="background" args={['#070b1a']} />
      <ambientLight intensity={0.08} />
      <pointLight position={[0, 12, -6]} intensity={1.4} color="#c0a0ff" />
      <pointLight position={[-22, -4, -28]} intensity={0.8} color="#67e8f9" />

      <group ref={groupRef}>
        {/* Reflective floor */}
        <mesh position={[0, -7, -12]} rotation={[-1.57, 0, 0]}>
          <planeGeometry args={[160, 110]} />
          <meshLambertMaterial color="#0f1426" />
        </mesh>

        {/* Massive glowing crystals */}
        {crystals.map(({ x, y, z, h, rot, i }) => {
          const isSpecial = i === 3; // One special crystal with user's name "carved"
          return (
            <group key={i} position={[x, y, z]} rotation={[0.3, rot, -0.2]}>
              <mesh>
                <octahedronGeometry args={[h * 0.38, 0]} />
                <meshLambertMaterial 
                  color={isSpecial ? "#a5b4fc" : "#64748b"} 
                  emissive={isSpecial ? "#6366f1" : "#334155"}
                  emissiveIntensity={isSpecial ? 0.6 : 0.2}
                />
              </mesh>
              {/* Inner glow core */}
              <mesh scale={0.6}>
                <octahedronGeometry args={[h * 0.38, 0]} />
                <meshBasicMaterial 
                  color={isSpecial ? "#e0e7ff" : "#94a3b8"} 
                  transparent 
                  opacity={0.25} 
                />
              </mesh>
              {isSpecial && (
                <pointLight color="#a5b4fc" intensity={2.1} distance={42} />
              )}
            </group>
          );
        })}

        {/* Energy streams / light rays */}
        {Array.from({ length: 4 }).map((_, i) => (
          <mesh 
            key={i}
            position={[-16 + i * 11, 4 + Math.sin(i) * 3, -24 - i * 2]}
            rotation={[0.8, i * 0.6, 1.1]}
          >
            <cylinderGeometry args={[0.06, 0.06, 42, 3]} />
            <meshBasicMaterial 
              color="#67e8f9" 
              transparent 
              opacity={0.12 + Math.sin(i) * 0.05} 
            />
          </mesh>
        ))}

        {/* Name carved effect - glowing text approximation via points */}
        <NameInCrystal name={name} />
      </group>
    </>
  );
}

function NameInCrystal({ name }: { name: string }) {
  const pointsRef = React.useRef<THREE.Points>(null!);
  const positions = React.useMemo(() => {
    const pts: number[] = [];
    const seed = simpleHash(name + 'namecrystal');
    // Simple particle "letters"
    for (let i = 0; i < 220; i++) {
      const t = i / 219;
      const angle = t * Math.PI * 3.2;
      const r = 4.2 + Math.sin(t * 12) * 0.8;
      const x = Math.cos(angle) * r + (seededRandom(seed + i) - 0.5) * 2.8;
      const y = (t - 0.5) * 11 + Math.sin(angle * 2.3) * 1.3;
      const z = (seededRandom(seed + i * 2) - 0.5) * 1.9 - 1.5;
      pts.push(x, y, z);
    }
    return new Float32Array(pts);
  }, [name]);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.15;
      const mat = pointsRef.current.material as THREE.PointsMaterial;
      mat.size = 0.09 + Math.sin(state.clock.elapsedTime * 2.5) * 0.025;
    }
  });

  return (
    <points ref={pointsRef} position={[2, 1.5, -9]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial 
        size={0.1} 
        color="#e0e7ff" 
        transparent 
        opacity={0.85}
        sizeAttenuation
      />
    </points>
  );
}

// Ocean of Stars
function OceanOfStarsScene({ mouse, name }: { mouse: MousePos; name: string }) {
  const groupRef = React.useRef<THREE.Group>(null!);
  const starsRef = React.useRef<THREE.Points>(null!);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = mouse.x * 0.28;
      groupRef.current.position.x = mouse.x * 2.1;
    }
    if (starsRef.current) {
      starsRef.current.rotation.y = state.clock.elapsedTime * 0.012;
    }
  });

  // Shooting stars positions (animated via useFrame below)
  const shootingRef = React.useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (shootingRef.current) {
      shootingRef.current.children.forEach((child, idx) => {
        const t = ((state.clock.elapsedTime * 0.6 + idx * 1.7) % 7.5) / 7.5;
        child.position.x = -38 + t * 82;
        child.position.y = 11 - idx * 3.5 + Math.sin(t * 9 + idx) * 1.5;
        (child as THREE.Mesh).visible = t > 0.03 && t < 0.93;
      });
    }
  });

  // Ocean no longer uses the old shallow quote — the Echo system now carries the meaning

  return (
    <>
      <color attach="background" args={['#02050f']} />
      <ambientLight intensity={0.1} />
      <pointLight position={[0, 30, -20]} intensity={0.7} color="#bae6fd" />

      <group ref={groupRef}>
        {/* Cosmic Water Plane */}
        <mesh position={[0, -4, -18]} rotation={[-1.48, 0, 0]}>
          <planeGeometry args={[220, 140]} />
          <meshLambertMaterial 
            color="#0a1629" 
            transparent 
            opacity={0.85}
          />
        </mesh>

        {/* Starfield (dense) */}
        <Stars 
          ref={starsRef as any}
          radius={380} 
          depth={50} 
          count={620} 
          factor={2.6} 
          saturation={0} 
          fade 
          speed={0.08}
        />

        {/* Extra bright stars forming constellation hints */}
        {Array.from({ length: 19 }).map((_, i) => (
          <mesh 
            key={i}
            position={[
              (i % 5 - 2) * 19 + (i - 9) * 0.6, 
              7 + Math.floor(i / 5) * -4.5, 
              -29 - Math.floor(i / 3) * 2
            ]}
          >
            <sphereGeometry args={[0.12 + (i % 3) * 0.04]} />
            <meshBasicMaterial color="#e0f2fe" />
          </mesh>
        ))}

        {/* Shooting Stars */}
        <group ref={shootingRef}>
          {Array.from({ length: 3 }).map((_, i) => (
            <mesh key={i} position={[-40, 8 - i * 3.5, -22]}>
              <sphereGeometry args={[0.16]} />
              <meshBasicMaterial color="#f0f9ff" />
            </mesh>
          ))}
        </group>

        {/* Gentle nebula glow */}
        <mesh position={[12, 6, -52]} rotation={[0.6, 0.8, 0]}>
          <planeGeometry args={[55, 29]} />
          <meshBasicMaterial 
            color="#312e81" 
            transparent 
            opacity={0.13} 
            side={THREE.DoubleSide} 
          />
        </mesh>
      </group>

      {/* Floating Quote Overlay Hint in 3D space (subtle) */}
      <mesh position={[-18, 14, -39]}>
        <planeGeometry args={[18, 3.5]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.001} />
      </mesh>
    </>
  );
}

// ============================================
// NEW STAGE: The Mirror Lake — Intimate self-reflection
// Distinct from Ocean: calmer, lower camera, name literally reflected in still water
// ============================================
function MirrorLakeScene({ mouse, name }: { mouse: MousePos; name: string }) {
  const groupRef = React.useRef<THREE.Group>(null!);
  const waterRef = React.useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = mouse.x * 0.18;
      groupRef.current.position.x = mouse.x * 1.1;
    }
    if (waterRef.current) {
      waterRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.17) * 0.009;
    }
  });

  const seed = simpleHash(name + 'mirror');

  return (
    <>
      <color attach="background" args={['#04080f']} />
      <ambientLight intensity={0.16} />
      <pointLight position={[-7, 20, -11]} intensity={0.95} color="#a5b4fc" />
      <pointLight position={[13, 5, -32]} intensity={0.5} color="#67e8f9" />

      <group ref={groupRef}>
        {/* Large, very still mirror water */}
        <mesh 
          ref={waterRef}
          position={[0, -1.6, -13]} 
          rotation={[-1.562, 0, 0]}
        >
          <planeGeometry args={[92, 68]} />
          <meshLambertMaterial color="#0a1322" />
        </mesh>

        {/* Delicate ripple rings */}
        {[0, 1, 2].map((i) => (
          <mesh 
            key={i}
            position={[i * -2.8 + 1, -1.45, -17 - i * 3.5]}
            rotation={[-1.555, 0.25, 0]}
          >
            <ringGeometry args={[5.5 + i * 2.8, 5.95 + i * 2.8, 48]} />
            <meshBasicMaterial color="#64748b" transparent opacity={0.045 - i * 0.01} side={THREE.DoubleSide} />
          </mesh>
        ))}

        {/* Calm floating memory orbs */}
        {Array.from({ length: 6 }).map((_, i) => {
          const angle = (i / 6) * Math.PI * 2 + seededRandom(seed + i) * 0.7;
          const r = 9.5 + seededRandom(seed + i * 2) * 5.5;
          return (
            <group key={i} position={[Math.cos(angle) * r, 3.5 + Math.sin(i) * 2.8, -14 - Math.sin(angle) * 4]}>
              <mesh>
                <sphereGeometry args={[0.32 + seededRandom(seed + i * 5) * 0.18]} />
                <meshBasicMaterial color="#c0c8ff" />
              </mesh>
              <pointLight color="#a5b4fc" intensity={0.7} distance={14} />
            </group>
          );
        })}

        {/* Ethereal reflection of the name in the water */}
        <NameReflectionInWater name={name} />
      </group>
    </>
  );
}

function NameReflectionInWater({ name }: { name: string }) {
  const pointsRef = React.useRef<THREE.Points>(null!);
  const positions = React.useMemo(() => {
    const pts: number[] = [];
    const seed = simpleHash(name + 'mirrorreflection');
    for (let i = 0; i < 145; i++) {
      const t = i / 144;
      const x = (t - 0.5) * 10 + (seededRandom(seed + i) - 0.5) * 2.1;
      const y = Math.sin(t * Math.PI * 1.55) * 1.6 + (seededRandom(seed + i * 2) - 0.5) * 0.7;
      const z = (seededRandom(seed + i * 3) - 0.5) * 0.9 - 0.6;
      pts.push(x, y, z);
    }
    return new Float32Array(pts);
  }, [name]);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.38) * 0.1;
      const mat = pointsRef.current.material as THREE.PointsMaterial;
      mat.opacity = 0.48 + Math.sin(state.clock.elapsedTime * 1.6) * 0.22;
    }
  });

  return (
    <points ref={pointsRef} position={[0, -3.6, -14]} rotation={[1.57, 0, 0]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.078} color="#dbeafe" transparent opacity={0.55} sizeAttenuation />
    </points>
  );
}

// ============================================
// SYMBOLIC GUARDIAN CREATURE — Much more meaningful 3D presence
// ============================================
function GuardianCreature({ 
  guardian, 
  position, 
  mouse 
}: { 
  guardian: Guardian; 
  position: [number, number, number]; 
  mouse: MousePos;
}) {
  const groupRef = React.useRef<THREE.Group>(null!);
  const coreRef = React.useRef<THREE.Mesh>(null!);

  const type = guardian.threeProps.geometry;

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = mouse.x * 0.9 + Math.sin(state.clock.elapsedTime * 0.2) * 0.08;
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.65) * 0.6;
    }
    if (coreRef.current) {
      coreRef.current.rotation.y = state.clock.elapsedTime * 0.4;
      const s = 1 + Math.sin(state.clock.elapsedTime * 2.1) * 0.04;
      coreRef.current.scale.setScalar(s);
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Central radiant core */}
      <mesh ref={coreRef}>
        <octahedronGeometry args={[1.6]} />
        <meshLambertMaterial 
          color={guardian.glowColor} 
          emissive={guardian.color} 
          emissiveIntensity={guardian.threeProps.emissive} 
        />
      </mesh>

      {/* Type-specific symbolic geometry */}
      {type === 'wolf' && (
        <>
          {/* Ears / presence */}
          <mesh position={[-1.3, 1.8, 0]} rotation={[0, 0, -0.6]}>
            <coneGeometry args={[0.7, 2.8, 3]} />
            <meshLambertMaterial color={guardian.color} emissive={guardian.color} emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[1.3, 1.8, 0]} rotation={[0, 0, 0.6]}>
            <coneGeometry args={[0.7, 2.8, 3]} />
            <meshLambertMaterial color={guardian.color} emissive={guardian.color} emissiveIntensity={0.3} />
          </mesh>
        </>
      )}

      {type === 'phoenix' && (
        <group>
          {[ -1, 1 ].map((s, i) => (
            <mesh key={i} position={[s * 2.8, 0.5, 0]} rotation={[0, 0, s * 0.9]}>
              <coneGeometry args={[1.1, 5.5, 3]} />
              <meshLambertMaterial color={guardian.color} emissive={guardian.color} emissiveIntensity={0.35} />
            </mesh>
          ))}
        </group>
      )}

      {type === 'dragon' && (
        <mesh position={[0, 0, 0]} rotation={[0.6, 0, 0]}>
          <torusGeometry args={[3.2, 0.55, 6, 5, Math.PI * 1.6]} />
          <meshLambertMaterial color={guardian.color} emissive={guardian.color} emissiveIntensity={0.25} />
        </mesh>
      )}

      {type === 'deer' && (
        <>
          {/* Antlers */}
          <mesh position={[-1.1, 2.4, 0]} rotation={[0, 0, -0.7]}>
            <cylinderGeometry args={[0.13, 0.08, 3.2, 3]} />
            <meshLambertMaterial color="#d1d5db" />
          </mesh>
          <mesh position={[1.1, 2.4, 0]} rotation={[0, 0, 0.7]}>
            <cylinderGeometry args={[0.13, 0.08, 3.2, 3]} />
            <meshLambertMaterial color="#d1d5db" />
          </mesh>
        </>
      )}

      {type === 'tiger' && (
        <mesh rotation={[0.4, 0, 0]}>
          <torusGeometry args={[2.4, 0.9, 5, 8, Math.PI * 1.3]} />
          <meshLambertMaterial color={guardian.color} emissive={guardian.color} emissiveIntensity={0.3} />
        </mesh>
      )}

      <pointLight color={guardian.glowColor} intensity={2.8} distance={38} />
    </group>
  );
}

// ============================================
// HIGH-QUALITY PROCEDURAL TREE — Ancient, organic, emotionally resonant
// ============================================
function ProceduralTree({ 
  position, 
  scale = 1, 
  seed, 
  isFinale 
}: { 
  position: [number, number, number]; 
  scale?: number; 
  seed: number; 
  isFinale: boolean;
}) {
  const trunkColor = isFinale ? '#1a2420' : '#1f2a1f';
  const leafColor = isFinale ? '#14532d' : '#0f2e1f';
  const emissive = isFinale ? '#166534' : '#052e16';
  const lightColor = isFinale ? '#fde047' : '#4ade80';

  // Generate branch data deterministically
  const branches = React.useMemo(() => {
    const b: Array<{pos: [number,number,number], rot: [number,number,number], len: number, thick: number}> = [];
    let s = seed;
    const branchCount = 5 + Math.floor(seededRandom(s++) * 3);
    
    for (let i = 0; i < branchCount; i++) {
      const y = 4 + seededRandom(s++) * 9;
      const angle = seededRandom(s++) * Math.PI * 2;
      const tilt = 0.6 + seededRandom(s++) * 0.9;
      const len = 2.8 + seededRandom(s++) * 3.4;
      b.push({
        pos: [Math.cos(angle) * 0.9, y, Math.sin(angle) * 0.9],
        rot: [tilt - 0.3, angle, seededRandom(s++) * 0.6 - 0.3],
        len,
        thick: 0.22 + seededRandom(s++) * 0.18,
      });
    }
    return b;
  }, [seed]);

  return (
    <group position={position} scale={scale}>
      {/* Main trunk — slightly irregular */}
      <mesh>
        <cylinderGeometry args={[0.85 * scale, 1.35 * scale, 14 * scale, 5]} />
        <meshLambertMaterial color={trunkColor} />
      </mesh>

      {/* Primary canopy layers — more volumetric */}
      {[0, 1, 2, 3].map((l) => {
        const y = 5.5 + l * 2.9;
        const s = (1.0 - l * 0.07) * scale;
        return (
          <mesh key={l} position={[0, y, 0]} scale={s}>
            <coneGeometry args={[5.8 - l * 0.5, 7.8, 6]} />
            <meshLambertMaterial 
              color={leafColor} 
              emissive={emissive} 
              emissiveIntensity={isFinale ? 0.38 - l * 0.06 : 0.12} 
            />
          </mesh>
        );
      })}

      {/* Organic side branches */}
      {branches.map((br, i) => (
        <group key={i} position={br.pos} rotation={br.rot}>
          <mesh>
            <cylinderGeometry args={[br.thick * scale, br.thick * 0.6 * scale, br.len * scale, 4]} />
            <meshLambertMaterial color={trunkColor} />
          </mesh>
          {/* Small leaf cluster at end of branch */}
          <mesh position={[0, br.len * scale * 0.75, 0]}>
            <sphereGeometry args={[1.1 * scale]} />
            <meshLambertMaterial 
              color={leafColor} 
              emissive={emissive} 
              emissiveIntensity={isFinale ? 0.22 : 0.08} 
            />
          </mesh>
        </group>
      ))}

      <pointLight 
        position={[0, 13 * scale, 0]} 
        color={lightColor} 
        intensity={isFinale ? 1.65 : 0.95} 
      />
    </group>
  );
}

// ============================================
// Enchanted Forest + Guardian + Finale Tree
function ForestScene({ 
  mouse, 
  name, 
  phase, 
  guardian 
}: { 
  mouse: MousePos; 
  name: string; 
  phase: Phase; 
  guardian: any;
}) {
  const groupRef = React.useRef<THREE.Group>(null!);
  const treeRef = React.useRef<THREE.Group>(null!);
  const butterfliesRef = React.useRef<THREE.Group>(null!);

  const isFinale = phase === 'finale';

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = mouse.x * (isFinale ? 0.16 : 0.24);
      groupRef.current.position.x = mouse.x * 1.4;
      groupRef.current.position.y = mouse.y * 0.7;
    }

    if (treeRef.current && isFinale) {
      // The tree slowly awakens
      treeRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.08) * 0.035;
      const scale = 1 + Math.sin(state.clock.elapsedTime * 0.6) * 0.012;
      treeRef.current.scale.setScalar(scale);
    }

    if (butterfliesRef.current) {
      butterfliesRef.current.children.forEach((b, i) => {
        const t = state.clock.elapsedTime * (0.6 + i * 0.07);
        b.position.x = Math.sin(t * 0.7 + i) * (7 + i % 2);
        b.position.y = 3 + Math.sin(t * 1.6 + i * 1.3) * (2.5 + i % 3);
        b.position.z = -12 + Math.cos(t * 0.5) * 4;
        b.rotation.y = t * 2.2;
      });
    }
  });

  const seed = simpleHash(name + phase);

  return (
    <>
      <color attach="background" args={[isFinale ? '#03060f' : '#050a08']} />
      <ambientLight intensity={isFinale ? 0.12 : 0.22} />
      <pointLight position={[-6, 18, -14]} intensity={isFinale ? 1.1 : 0.85} color={isFinale ? "#e8d5a3" : "#86efac"} />
      <pointLight position={[24, 2, -38]} intensity={0.6} color="#67e8f9" />

      <group ref={groupRef}>
        {/* Ground mist / fog plane */}
        <mesh position={[0, -2.5, -16]} rotation={[-1.55, 0, 0]}>
          <planeGeometry args={[160, 85]} />
          <meshLambertMaterial color="#0a1410" transparent opacity={0.6} />
        </mesh>

        {/* Majestic Procedural Trees — much more organic and ancient */}
        {[ -1.1, 0.2, 1.4, -0.6 ].map((pos, idx) => {
          const tx = pos * 15;
          const tz = -17 - idx * 5.5;
          const scale = 0.85 + (idx % 3) * 0.12;
          return (
            <ProceduralTree 
              key={idx} 
              position={[tx, -2, tz]} 
              scale={scale} 
              seed={simpleHash(name) + idx * 17}
              isFinale={isFinale}
            />
          );
        })}

        {/* Central Awakening Tree (Finale) */}
        {isFinale && (
          <group ref={treeRef} position={[0, -1, -26]}>
            <mesh>
              <cylinderGeometry args={[1.8, 2.6, 17, 6]} />
              <meshLambertMaterial color="#1a2420" />
            </mesh>
            {/* Huge glowing canopy */}
            {[0,1,2,3].map(l => (
              <mesh key={l} position={[0, 6 + l * 4.2, 0]} scale={1 + l * 0.15}>
                <coneGeometry args={[11 - l * 1.1, 9, 6]} />
                <meshLambertMaterial 
                  color="#052e16" 
                  emissive="#166534" 
                  emissiveIntensity={0.55 - l * 0.09}
                />
              </mesh>
            ))}
            {/* Roots glowing */}
            {[ -1, 1 ].map((s, ri) => (
              <mesh key={ri} position={[s * 3.5, -1.5, 3]} rotation={[0.6, s * 0.9, 0]}>
                <cylinderGeometry args={[0.4, 1.8, 14, 4]} />
                <meshLambertMaterial color="#14532d" emissive="#4ade80" emissiveIntensity={0.3} />
              </mesh>
            ))}
            <pointLight position={[0, 19, -2]} color="#fde047" intensity={2.4} />
          </group>
        )}

        {/* Fireflies */}
        {Array.from({ length: isFinale ? 18 : 11 }).map((_, i) => (
          <mesh 
            key={i}
            position={[
              (i % 7 - 3) * 6 + seededRandom(seed + i) * 4,
              2 + seededRandom(seed + i * 3) * 7,
              -14 - Math.floor(i / 4) * 5 + (seededRandom(seed + i * 7) - 0.5) * 3
            ]}
          >
            <sphereGeometry args={[0.13]} />
            <meshBasicMaterial color="#67e8f9" />
          </mesh>
        ))}

        {/* Butterflies */}
        <group ref={butterfliesRef}>
          {Array.from({ length: 5 }).map((_, i) => (
            <mesh key={i} position={[i * 3 - 6, 6, -11]}>
              <planeGeometry args={[1.6, 0.7]} />
              <meshBasicMaterial 
                color={i % 2 === 0 ? "#c026ff" : "#67e8f9"} 
                transparent 
                opacity={0.75}
                side={THREE.DoubleSide}
              />
            </mesh>
          ))}
        </group>

        {/* Guardian Spirit — now a proper symbolic being */}
        {!isFinale && guardian && (
          <GuardianCreature 
            guardian={guardian} 
            position={[13, 2.5, -21]} 
            mouse={mouse} 
          />
        )}
      </group>
    </>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function DreamscapeJourney() {
  const [phase, setPhase] = useState<Phase>('landing');
  const [userName, setUserName] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [showParticles, setShowParticles] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [mouse, setMouse] = useState<MousePos>({ x: 0, y: 0 });
  const [guardian, setGuardian] = useState<Guardian | null>(null);
  const [dreamTitle, setDreamTitle] = useState('');
  const [destinyQuote, setDestinyQuote] = useState('');
  const [nameProfile, setNameProfile] = useState<NameProfile | null>(null);
  const [currentEcho, setCurrentEcho] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const transformCompleteRef = useRef<() => void>(() => {});

  // Phase order for progress
  const phases: Phase[] = ['sky', 'crystal', 'ocean', 'mirror', 'forest', 'finale'];
  const currentPhaseIndex = phases.indexOf(phase);

  // Derived values
  const welcomeMsg = userName && nameProfile 
    ? getWelcomeMessage(Math.max(1, currentPhaseIndex + 1), userName, nameProfile) 
    : '';

  // Global mouse parallax (gentle)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMouse({ x: x * 0.6, y: y * 0.55 });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Touch support for mobile parallax
  useEffect(() => {
    const handleTouch = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const x = (e.touches[0].clientX / window.innerWidth - 0.5) * 1.6;
        const y = (e.touches[0].clientY / window.innerHeight - 0.5) * 1.4;
        setMouse({ x, y });
      }
    };
    window.addEventListener('touchmove', handleTouch, { passive: true });
    return () => window.removeEventListener('touchmove', handleTouch);
  }, []);

  // Start music on first interaction
  const startMusicIfNeeded = useCallback(() => {
    if (phase === 'landing') return;
    fantasyMusic.init();
    fantasyMusic.play();
    if (isMuted) fantasyMusic.setVolume(0.01);
  }, [phase, isMuted]);

  // Phase music transitions + Echo system (the emotional heart)
  useEffect(() => {
    if (phase === 'landing' || phase === 'transform') {
      setCurrentEcho('');
      return;
    }
    
    fantasyMusic.init();
    fantasyMusic.play();

    if (phase === 'finale') {
      fantasyMusic.setPhase('finale');
    } else {
      fantasyMusic.setPhase('journey');
    }

    if (isMuted) fantasyMusic.setVolume(0.01);

    // Load a deep, personalized Echo for this world
    if (userName && nameProfile && ['sky', 'crystal', 'ocean', 'mirror', 'forest'].includes(phase)) {
      const echo = getWorldEcho(phase, userName, nameProfile);
      // Slight delay so it feels like the world is "speaking" after arrival
      const timer = setTimeout(() => setCurrentEcho(echo), 1850);
      return () => clearTimeout(timer);
    }
    setCurrentEcho('');
  }, [phase, isMuted, userName, nameProfile]);

  // Keyboard support: Enter to begin / continue (uses smooth transitions)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (phase === 'landing' && inputValue.trim()) {
          beginJourney();
        } else if (['sky', 'crystal', 'ocean', 'mirror', 'forest'].includes(phase)) {
          advancePhase(); // already handles smooth transition
        } else if (phase === 'finale') {
          restartJourney();
        }
      }
      if ((e.key === 'r' || e.key === 'R') && phase === 'finale') {
        restartJourney();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, inputValue]);

  // Begin the journey
  const beginJourney = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || trimmed.length < 1) return;

    const cleanName = trimmed.slice(0, 28);
    const profile = analyzeName(cleanName);

    setUserName(cleanName);
    setNameProfile(profile);

    // Precompute rich, meaningful personalized content
    const g = getGuardianSpirit(cleanName, profile);
    setGuardian(g);
    setDreamTitle(getDreamTitle(cleanName, profile));
    setDestinyQuote(getDestinyQuote(cleanName, profile));

    setPhase('transform');
    setShowParticles(true);
    setCurrentEcho('');
    startMusicIfNeeded();

    // Cinematic timing
    setTimeout(() => {
      fantasyMusic.setPhase('journey');
    }, 1650);
  };

  // Called when particle explosion + portal finishes
  const handleTransformComplete = () => {
    setShowParticles(false);
    // Enter first world
    setTimeout(() => {
      setPhase('sky');
    }, 180);
  };

  transformCompleteRef.current = handleTransformComplete;

  // Smooth cinematic transition between worlds (PowerPoint-like)
  const advancePhase = () => {
    const order: Phase[] = ['sky', 'crystal', 'ocean', 'mirror', 'forest', 'finale'];
    const idx = order.indexOf(phase);
    if (idx < order.length - 1) {
      const nextPhase = order[idx + 1];

      setCurrentEcho('');
      setIsTransitioning(true);

      // Elegant fade duration (feels like a deliberate cinematic cut)
      setTimeout(() => {
        setPhase(nextPhase);
        
        // Let the new world settle visually before removing overlay
        setTimeout(() => {
          setIsTransitioning(false);
        }, 650);
      }, 720);
    }
  };

  const restartJourney = () => {
    fantasyMusic.fadeOut(1350);
    setPhase('landing');
    setUserName('');
    setInputValue('');
    setShowParticles(false);
    setGuardian(null);
    setDreamTitle('');
    setDestinyQuote('');
    setNameProfile(null);
    setCurrentEcho('');
    setMouse({ x: 0, y: 0 });
    setTimeout(() => {
      fantasyMusic.stop();
    }, 1500);
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    // Ensure music system is alive
    fantasyMusic.init();

    if (!nextMuted) {
      // Unmuting — start or restore music
      fantasyMusic.play();
      fantasyMusic.setVolume(0.86);
      if (phase === 'finale') {
        fantasyMusic.setPhase('finale');
      } else if (phase !== 'landing' && phase !== 'transform') {
        fantasyMusic.setPhase('journey');
      }
    } else {
      // Muting
      fantasyMusic.setVolume(0.01);
    }
  };

  // Elegant progress indicator
  const renderProgress = () => {
    if (!['sky', 'crystal', 'ocean', 'mirror', 'forest', 'finale'].includes(phase)) return null;

    return (
      <div className="journey-progress">
        {phases.map((p, idx) => {
          const isActive = p === phase;
          const isDone = idx < currentPhaseIndex;
          return (
            <div
              key={p}
              onClick={() => {
                if (isDone || isActive) {
                  setPhase(p);
                }
              }}
              className={`chapter-dot ${isActive ? 'active' : ''} ${isDone ? 'completed' : ''}`}
              title={p.charAt(0).toUpperCase() + p.slice(1)}
            />
          );
        })}
      </div>
    );
  };

  // World-specific header text
  const renderWorldHeader = () => {
    const headers: Record<string, { title: string; subtitle: string }> = {
      sky: { title: "The Sky Kingdom", subtitle: welcomeMsg || "Where the clouds remember every dream" },
      crystal: { title: "The Crystal Caverns", subtitle: "The earth itself keeps your story" },
      ocean: { title: "Ocean of Stars", subtitle: welcomeMsg || "The cosmos reflected in endless water" },
      mirror: { title: "The Mirror Lake", subtitle: "What you see here has always been waiting inside you" },
      forest: { title: "The Enchanted Grove", subtitle: "Even the trees have been waiting for you" },
      finale: { title: "The World Tree", subtitle: "The heart of all dreams" },
    };

    const h = headers[phase];
    if (!h) return null;

    return (
      <div className="absolute top-12 left-1/2 -translate-x-1/2 text-center z-40 px-6">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.19, 1, 0.22, 1] }}
        >
          <div className="world-title text-white/95 tracking-[-0.02em] mb-2">
            {h.title}
          </div>
          <div className="world-subtitle text-white/70 max-w-lg mx-auto">
            {h.subtitle}
          </div>
        </motion.div>
      </div>
    );
  };

  // Main CTA / Continue button per phase
  const renderActionButton = () => {
    if (phase === 'landing' || phase === 'transform' || phase === 'forest') return null;

    const isFinal = phase === 'finale';
    const label = isFinal ? "Begin Another Dream" : "Continue the Journey";

    return (
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50">
        <button 
          onClick={isFinal ? restartJourney : advancePhase}
          className="ethereal-btn group flex items-center gap-3 text-sm tracking-[0.14em]"
        >
          {label}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
        </button>
        <div className="hint text-center mt-3.5">Press Enter to continue</div>
      </div>
    );
  };

  // Render the correct 3D world
  const renderThreeWorld = () => {
    const commonProps = { mouse, name: userName };

    switch (phase) {
      case 'sky':
        return <SkyKingdomScene {...commonProps} />;
      case 'crystal':
        return <CrystalCaveScene {...commonProps} />;
      case 'ocean':
        return <OceanOfStarsScene {...commonProps} />;
      case 'mirror':
        return <MirrorLakeScene {...commonProps} />;
      case 'forest':
      case 'finale':
        return <ForestScene {...commonProps} phase={phase} guardian={guardian} />;
      default:
        return null;
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden bg-[#05070f] select-none"
    >
      {/* Persistent 3D Canvas for all magical worlds - only active after transformation */}
      {(phase !== 'landing') && (
        <div className="three-container">
          <Canvas
            camera={{ position: [0, 6, 38], fov: 47, near: 0.4, far: 620 }}
            style={{ background: 'transparent' }}
            gl={{ 
              alpha: true, 
              antialias: true, 
              powerPreference: "high-performance",
              preserveDrawingBuffer: true 
            }}
          >
            <React.Suspense fallback={null}>
              <CameraController phase={phase} mouse={mouse} />
              {renderThreeWorld()}
            </React.Suspense>
          </Canvas>
        </div>
      )}

      {/* Layered 2D Atmospheric Effects - Stars & Fireflies for landing + all scenes */}
      {(phase === 'landing' || phase === 'transform') && (
        <>
          {/* Dynamic Stars */}
          <div className="particle-layer">
            {Array.from({ length: 68 }).map((_, i) => (
              <div
                key={i}
                className="star"
                style={{
                  left: `${(i * 17.3 + (i % 7) * 3) % 100}%`,
                  top: `${((i * 7.9) % 78) + 4}%`,
                  width: `${1.2 + (i % 4) * 0.6}px`,
                  height: `${1.2 + (i % 4) * 0.6}px`,
                  animationDelay: `-${i * 0.21}s`,
                  opacity: 0.35 + (i % 5) * 0.11,
                }}
              />
            ))}
          </div>

          {/* Soft Fireflies */}
          <div className="particle-layer">
            {Array.from({ length: 13 }).map((_, i) => (
              <div
                key={i}
                className="firefly"
                style={{
                  left: `${18 + ((i * 31) % 64)}%`,
                  top: `${22 + ((i * 19) % 46)}%`,
                  animationDuration: `${15 + (i % 4) * 3.2}s`,
                  animationDelay: `-${i * 2.8}s`,
                  width: i % 3 === 0 ? '5px' : '3.5px',
                  height: i % 3 === 0 ? '5px' : '3.5px',
                }}
              />
            ))}
          </div>
        </>
      )}

      {/* Rising Moon - Only on landing */}
      <AnimatePresence>
        {phase === 'landing' && (
          <motion.div
            className="moon"
            initial={{ opacity: 0, scale: 0.6, y: 120 }}
            animate={{ opacity: 0.92, scale: 1, y: 0 }}
            transition={{ duration: 5.8, ease: [0.16, 0.95, 0.2, 1] }}
            style={{
              width: 'min(38vw, 280px)',
              height: 'min(38vw, 280px)',
              right: '11%',
              top: '13%',
            }}
          />
        )}
      </AnimatePresence>

      {/* Name Particle Explosion + Portal Overlay */}
      <NameParticleCanvas 
        name={userName} 
        active={showParticles} 
        onComplete={() => transformCompleteRef.current()} 
      />

      {/* === CINEMATIC WORLD TRANSITION (smooth, deliberate, PowerPoint-like) === */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            key="world-transition"
            className="absolute inset-0 z-[70] pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="absolute inset-0 bg-[#05070f]" />
            
            {/* Soft breathing vignette */}
            <div 
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(circle at 50% 42%, rgba(5,7,15,0.25) 0%, rgba(5,7,15,0.88) 52%, #05070f 75%)'
              }}
            />
            
            {/* Very subtle golden light sweep for cinematic drama */}
            <div 
              className="absolute inset-0 opacity-25"
              style={{
                background: `repeating-linear-gradient(
                  118deg,
                  transparent 0%,
                  transparent 11%,
                  rgba(197,164,110,0.09) 22%,
                  transparent 38%
                )`,
                animation: 'cinematic-sweep 3.1s ease-in-out infinite'
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cinematic vignette / depth overlay */}
      <div className="absolute inset-0 pointer-events-none z-10" 
        style={{
          background: 'radial-gradient(circle at 50% 38%, transparent 32%, rgba(5,7,15,0.55) 62%, rgba(5,7,15,0.9) 76%)'
        }} 
      />

      {/* Magical Mouse-Reactive Dust (extra wow layer) */}
      {phase !== 'landing' && phase !== 'transform' && (
        <InteractiveDust mouse={mouse} />
      )}

      {/* ===== LANDING UI ===== */}
      <AnimatePresence>
        {phase === 'landing' && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center px-6">
            <div className="text-center max-w-4xl">
              {/* Title */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.8, ease: [0.19, 1, 0.22, 1], delay: 0.4 }}
              >
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Moon className="w-8 h-8 text-[#c5a46e]" />
                  <div className="h-px w-12 bg-gradient-to-r from-transparent via-[#c5a46e] to-transparent" />
                </div>
                <h1 className="fantasy-heading text-[92px] sm:text-[108px] leading-[0.86] tracking-[-0.045em] mb-2">
                  Dreamscape<br />Journey
                </h1>
              </motion.div>

              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.85 }}
                transition={{ delay: 1.15, duration: 1.4 }}
                className="text-2xl sm:text-3xl text-[#c5a46e] tracking-[-0.01em] font-light mb-14 quote-text"
              >
                Every name hides a story.<br />Discover yours.
              </motion.p>

              {/* Magical Input */}
              <div className="flex flex-col items-center gap-4">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') beginJourney(); }}
                  placeholder="Enter your name..."
                  className="magic-input"
                  maxLength={28}
                  autoFocus
                />

                <button 
                  onClick={beginJourney}
                  disabled={!inputValue.trim()}
                  className="magic-btn mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Begin The Journey
                </button>
              </div>

              <div className="mt-16 text-[10px] tracking-[3px] text-white/40 font-mono">
                AN IMMERSIVE CINEMATIC EXPERIENCE
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ===== TRANSFORM PHASE (minimal overlay) ===== */}
      {phase === 'transform' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            className="text-center"
          >
            <div className="text-[#c5a46e] text-sm tracking-[4px] mb-4">THE VEIL OPENS</div>
            <div className="text-white/60 text-xl">Your story is becoming light...</div>
          </motion.div>
        </div>
      )}

      {/* ===== WORLD HEADERS + CONTENT ===== */}
      {renderWorldHeader()}

      {/* The Echo — the emotional voice of each world (deep & personal) */}
      <AnimatePresence>
        {currentEcho && (
          <motion.div
            key={phase + '-echo'}
            className="absolute top-[46%] left-1/2 -translate-x-1/2 z-40 max-w-[620px] px-8 text-center"
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 1.6, ease: [0.19, 1, 0.22, 1] }}
          >
            <div className="text-[#c5a46e] tracking-[3.5px] text-[10px] mb-3.5 opacity-70">THE WORLD SPEAKS</div>
            <div className="quote-text text-[17px] md:text-[18.5px] leading-[1.45] text-white/90">
              {currentEcho}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* World specific beautiful messages + Guardian reveal */}
      <AnimatePresence mode="wait">
        {phase === 'forest' && guardian && (
          <motion.div 
            key="guardian"
            className="absolute top-[18%] left-1/2 -translate-x-1/2 z-40 w-full max-w-[620px] px-6"
            initial={{ opacity: 0, y: 50, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 1.4, duration: 2.1, ease: [0.19, 1, 0.22, 1] }}
          >
            <div className="guardian-card text-center space-y-6">
              <div>
                <div className="text-[#c5a46e] tracking-[4px] text-[10px] mb-1.5">THE VEIL PARTS FOR</div>
                <div className="guardian-name text-4xl mb-1 tracking-tight">{guardian.name}</div>
                <div className="text-[#c5a46e]/70 text-sm tracking-widest">{guardian.epithet}</div>
              </div>

              <div className="text-white/70 text-[15.5px] leading-relaxed max-w-[46ch] mx-auto">
                {guardian.description}
              </div>

              {/* The direct message — the emotional core */}
              <div className="pt-4 border-t border-white/10">
                <div className="text-[#c5a46e] tracking-[3px] text-xs mb-3">THE GUARDIAN SPEAKS</div>
                <div className="quote-text text-[17px] leading-snug text-white/90">
                  “{guardian.message}”
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-left text-sm">
                <div className="rounded-xl bg-white/[0.025] p-4 border border-white/10">
                  <div className="text-emerald-400/80 text-xs tracking-widest mb-1.5">THE LESSON</div>
                  <div className="text-white/80 leading-snug">{guardian.lesson}</div>
                </div>
                <div className="rounded-xl bg-white/[0.025] p-4 border border-white/10">
                  <div className="text-amber-400/80 text-xs tracking-widest mb-1.5">THE SHADOW</div>
                  <div className="text-white/80 leading-snug">{guardian.shadow}</div>
                </div>
              </div>

              <div className="text-[42px] opacity-40 pt-1">{guardian.symbol}</div>
            </div>
          </motion.div>
        )}

        {phase === 'finale' && dreamTitle && (
          <motion.div 
            key="finale"
            className="absolute top-[22%] left-1/2 -translate-x-1/2 z-40 text-center max-w-[820px] px-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1], delay: 0.8 }}
          >
            <div className="uppercase tracking-[4px] text-xs text-[#c5a46e]/80 mb-3">THE DREAM AWAKENS</div>
            
            <div className="dream-title mb-6">{dreamTitle}</div>
            
            <div className="quote-text text-[21px] leading-tight text-white/90 max-w-lg mx-auto">
              {destinyQuote}
            </div>

            {/* Final Blessing — the emotional culmination */}
            {guardian && nameProfile && (
              <div className="mt-8 text-sm text-white/60 max-w-md mx-auto leading-relaxed italic">
                {getFinalBlessing(userName, guardian, nameProfile)}
              </div>
            )}

            <div className="mt-9 flex justify-center gap-3">
              <button 
                onClick={restartJourney}
                className="magic-btn flex items-center gap-2 text-sm !py-3 !px-8"
              >
                <RotateCcw className="w-4 h-4" /> Journey Again
              </button>
            </div>
            <div className="hint mt-5">Press R to dream again</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      {renderActionButton()}

      {/* Top Right Controls */}
      <div className="absolute top-8 right-8 z-50 flex items-center gap-3">
        <button
          onClick={toggleMute}
          className="glass p-3 rounded-full hover:bg-white/5 transition flex items-center justify-center text-[#c5a46e]"
          aria-label={isMuted ? "Unmute music" : "Mute music"}
        >
          {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
        </button>
        
        {phase !== 'landing' && phase !== 'transform' && (
          <button
            onClick={restartJourney}
            className="glass px-4 py-2.5 rounded-full text-xs tracking-widest flex items-center gap-2 hover:bg-white/5 transition text-[#c5a46e]"
          >
            <RotateCcw size={15} /> RESTART
          </button>
        )}
      </div>

      {/* Progress Dots */}
      {renderProgress()}

      {/* Subtle Footer Hint */}
      {phase === 'landing' && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] tracking-[2px] text-white/30 z-40">
          A FULLY IMMERSIVE EXPERIENCE • BEST WITH SOUND
        </div>
      )}

      {/* Mobile scroll / touch hint */}
      {['sky', 'crystal', 'ocean', 'forest'].includes(phase) && (
        <div className="absolute bottom-9 right-6 text-[10px] text-white/40 tracking-widest z-40 pointer-events-none hidden md:block">
          MOVE MOUSE TO EXPLORE
        </div>
      )}
    </div>
  );
}
