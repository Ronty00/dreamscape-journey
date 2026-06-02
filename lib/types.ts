export interface MousePos {
  x: number;
  y: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  hue: number;
}

export type Phase = 'landing' | 'transform' | 'sky' | 'crystal' | 'ocean' | 'mirror' | 'forest' | 'finale';
