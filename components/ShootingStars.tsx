"use client";
// ShootingStars.tsx — full-screen canvas starfield where EVERY star shoots
// Dense living background: ~55 active shooters at all times, mix of sizes/speeds

import { useEffect, useRef } from 'react';

interface ShootingStarsProps {
  accentColors?: string[];
  density?: number;
  paused?: boolean;
}

const DEFAULT_ACCENTS = [
  '#a78bfa',
  '#7c8df0',
  '#5fc9a8',
  '#f59e6f',
  '#e6c068',
  '#ef5a6f',
  '#ffffff',
  '#ffffff',
  '#ffffff',
];

interface Star {
  x: number; y: number;
  vx: number; vy: number;
  trail: number;
  r: number;
  alpha: number;
  color: string;
  life: number;
  lifeSpeed: number;
  tier: 0 | 1 | 2; // 0=dust 1=mid 2=bright
}

function rand(a: number, b: number) { return a + Math.random() * (b - a); }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function spawnStar(w: number, h: number, accents: string[]): Star {
  const fromEdge = Math.random();
  let x: number, y: number;
  if (fromEdge < 0.5) {
    x = rand(-50, w + 50); y = rand(-30, 0);
  } else if (fromEdge < 0.75) {
    x = rand(-30, 0); y = rand(-50, h * 0.6);
  } else {
    x = rand(w, w + 30); y = rand(-50, h * 0.4);
  }

  const roll = Math.random();
  let tier: 0 | 1 | 2;
  let speed: number, trail: number, r: number, alpha: number, lifeSpeed: number;

  if (roll < 0.70) {
    tier = 0;
    speed = rand(1.5, 4); trail = rand(12, 40); r = rand(0.4, 0.9);
    alpha = rand(0.15, 0.45); lifeSpeed = rand(0.004, 0.009);
  } else if (roll < 0.92) {
    tier = 1;
    speed = rand(3.5, 8); trail = rand(40, 100); r = rand(0.9, 1.6);
    alpha = rand(0.4, 0.75); lifeSpeed = rand(0.006, 0.013);
  } else {
    tier = 2;
    speed = rand(7, 16); trail = rand(100, 220); r = rand(1.5, 3);
    alpha = rand(0.7, 0.95); lifeSpeed = rand(0.008, 0.018);
  }

  const angle = rand(Math.PI * 0.15, Math.PI * 0.55);
  const flip = Math.random() < 0.25;
  const vx = flip ? -Math.cos(angle) * speed : Math.cos(angle) * speed;
  const vy = Math.sin(angle) * speed;
  const color = tier === 2 ? pick(accents) : '#ffffff';

  return { x, y, vx, vy, trail, r, alpha, color, life: 0, lifeSpeed, tier };
}

const TARGET = 55;

export default function ShootingStars({
  accentColors = DEFAULT_ACCENTS,
  density = 1,
  paused = false,
}: ShootingStarsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0, h = 0;
    let stars: Star[] = [];
    let raf = 0;

    function resize() {
      const dpr = window.devicePixelRatio ?? 1;
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width  = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width  = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.floor(TARGET * density);
      stars = Array.from({ length: n }, () => {
        const s = spawnStar(w, h, accentColors);
        s.life = Math.random();
        return s;
      });
    }

    resize();
    window.addEventListener('resize', resize);

    let lastTime = performance.now();

    function draw(now: number) {
      const dt = Math.min((now - lastTime) / 16.67, 3);
      lastTime = now;
      ctx!.clearRect(0, 0, w, h);

      if (!pausedRef.current) {
        for (let i = 0; i < stars.length; i++) {
          const s = stars[i];
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          s.life += s.lifeSpeed * dt;

          const margin = s.trail + 20;
          if (
            s.life >= 1 ||
            s.x < -margin || s.x > w + margin ||
            s.y < -margin || s.y > h + margin
          ) {
            stars[i] = spawnStar(w, h, accentColors);
            continue;
          }

          const fade = s.life < 0.1
            ? s.life / 0.1
            : s.life > 0.8
              ? 1 - (s.life - 0.8) / 0.2
              : 1;
          const a = s.alpha * fade;
          if (a < 0.01) continue;

          const spd = Math.sqrt(s.vx * s.vx + s.vy * s.vy) || 1;
          const tx = s.x - (s.vx / spd) * s.trail;
          const ty = s.y - (s.vy / spd) * s.trail;

          const grad = ctx!.createLinearGradient(tx, ty, s.x, s.y);
          grad.addColorStop(0, 'rgba(255,255,255,0)');
          if (s.tier === 2) {
            grad.addColorStop(0.5, s.color + Math.round(a * 60).toString(16).padStart(2,'0'));
          }
          grad.addColorStop(1, `rgba(255,255,255,${Math.min(1, a * 0.85)})`);

          ctx!.beginPath();
          ctx!.moveTo(tx, ty);
          ctx!.lineTo(s.x, s.y);
          ctx!.strokeStyle = grad;
          ctx!.lineWidth = s.r * 1.2;
          ctx!.lineCap = 'round';
          ctx!.stroke();

          if (s.tier > 0) {
            ctx!.beginPath();
            ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx!.fillStyle = `rgba(255,255,255,${a})`;
            ctx!.fill();
          }

          if (s.tier === 2) {
            const glow = ctx!.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 4);
            glow.addColorStop(0, `rgba(255,255,255,${a * 0.5})`);
            glow.addColorStop(1, 'rgba(255,255,255,0)');
            ctx!.beginPath();
            ctx!.arc(s.x, s.y, s.r * 4, 0, Math.PI * 2);
            ctx!.fillStyle = glow;
            ctx!.fill();
          }
        }
      }

      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [density, accentColors]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
