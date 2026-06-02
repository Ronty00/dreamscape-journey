"use client";

import React, { useRef, useEffect } from 'react';
import type { MousePos } from '@/lib/types';

interface InteractiveDustProps {
  mouse: MousePos;
}

export default function InteractiveDust({ mouse }: InteractiveDustProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Array<{x:number;y:number;vx:number;vy:number;life:number;size:number}>>([]);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
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

    const dust: any[] = [];
    for (let i = 0; i < 42; i++) {
      dust.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.82,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.22 - 0.1,
        life: 0.6 + Math.random() * 0.4,
        size: 1.1 + Math.random() * 1.8,
      });
    }
    particlesRef.current = dust;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const targetX = (mouse.x + 1) * 0.5 * canvas.width;
      const targetY = (mouse.y + 1) * 0.5 * canvas.height * 0.7;

      particlesRef.current.forEach((p) => {
        const dx = targetX - p.x;
        const dy = targetY - p.y;
        p.vx += dx * 0.000012;
        p.vy += dy * 0.000012;

        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.978;
        p.vy *= 0.978;
        p.life -= 0.0016;

        if (p.life < 0.12 || p.x < 0 || p.x > canvas.width) {
          p.x = Math.random() * canvas.width;
          p.y = Math.random() * canvas.height * 0.9;
          p.vx = (Math.random() - 0.5) * 0.35;
          p.vy = (Math.random() - 0.5) * 0.18 - 0.06;
          p.life = 0.7 + Math.random() * 0.35;
        }

        const alpha = Math.max(0.08, p.life * 0.8);
        ctx.fillStyle = `rgba(199, 210, 254, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(165, 243, 252, ${alpha * 0.32})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2.4, 0, Math.PI * 2);
        ctx.fill();
      });

      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [mouse]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 z-20 pointer-events-none mix-blend-screen" 
    />
  );
}