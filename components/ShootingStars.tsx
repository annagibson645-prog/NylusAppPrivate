"use client";
// ShootingStars.tsx — animated canvas layer for constellation views
// Renders a field of dim static stars + periodic shooting star streaks
// Drop inside any full-bleed container; positions itself to fill parent.

import { useEffect, useRef } from 'react';

interface ShootingStarsProps {
  /** optional accent colors to tint shooting star trails */
  accentColors?: string[];
  /** 0–1 intensity, default 1 */
  density?: number;
  /** pause all animation */
  paused?: boolean;
}

// ─── types ────────────────────────────────────────────────────────────────────
interface Star {
  x: number; y: number; r: number;
  opacity: number; twinkleSpeed: number; twinklePhase: number;
}

interface Shooter {
  x: number; y: number;
  vx: number; vy: number;
  len: number;         // trail length px
  life: number;        // 0→1 progress
  color: string;
  alpha: number;
}

// ─── default accent palette (matches void domain colors) ─────────────────────
const DEFAULT_ACCENTS = [
  '#a78bfa', // purple / behavioral-mechanics
  '#7c8df0', // blue / eastern-spirituality
  '#5fc9a8', // green / cross-domain
  '#f59e6f', // orange / psychology
  '#e6c068', // gold / history
  '#ef5a6f', // red / creative-practice
];

// ─── helpers ─────────────────────────────────────────────────────────────────
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(min: number, max: number) { return min + Math.random() * (max - min); }

function buildStars(w: number, h: number, n: number): Star[] {
  return Array.from({ length: n }, () => ({
    x: rand(0, w), y: rand(0, h),
    r: rand(0.3, 1.6),
    opacity: rand(0.08, 0.45),
    twinkleSpeed: rand(0.3, 1.2),
    twinklePhase: rand(0, Math.PI * 2),
  }));
}

function spawnShooter(w: number, h: number, accents: string[]): Shooter {
  // spawn from top edge, traveling down-right or down-left
  const fromLeft = Math.random() > 0.5;
  const x = fromLeft ? rand(0, w * 0.6) : rand(w * 0.4, w);
  const angle = fromLeft
    ? rand(Math.PI * 0.1, Math.PI * 0.45)   // ↘
    : rand(Math.PI * 0.55, Math.PI * 0.9);  // ↙
  const speed = rand(6, 14);
  return {
    x, y: rand(-20, h * 0.1),
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    len: rand(60, 160),
    life: 0,
    color: pick(accents),
    alpha: rand(0.55, 0.9),
  };
}

// ─── component ────────────────────────────────────────────────────────────────
export default function ShootingStars({
  accentColors = DEFAULT_ACCENTS,
  density = 1,
  paused = false,
}: ShootingStarsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{
    stars: Star[];
    shooters: Shooter[];
    frameCounter: number;
    raf: number;
    w: number; h: number;
  }>({ stars: [], shooters: [], frameCounter: 0, raf: 0, w: 0, h: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = stateRef.current;

    // ── resize handler ──
    function resize() {
      const dpr = window.devicePixelRatio ?? 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas!.width  = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width  = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.scale(dpr, dpr);
      state.w = w;
      state.h = h;
      // re-seed stars on resize
      const n = Math.floor(120 * density);
      state.stars = buildStars(w, h, n);
    }

    resize();
    window.addEventListener('resize', resize);

    // ── animation loop ──
    let lastTime = performance.now();

    function draw(now: number) {
      const dt = Math.min((now - lastTime) / 16.67, 3); // normalise to ~60fps
      lastTime = now;
      state.frameCounter += 1;

      const { w, h } = state;
      ctx!.clearRect(0, 0, w, h);

      // — static stars —
      const t = now / 1000;
      for (const s of state.stars) {
        const pulse = s.opacity + Math.sin(t * s.twinkleSpeed + s.twinklePhase) * 0.07;
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(255,255,255,${Math.max(0, Math.min(1, pulse))})`;
        ctx!.fill();
      }

      // — spawn new shooter occasionally —
      if (!paused && state.frameCounter % Math.floor(rand(90, 180)) === 0) {
        if (state.shooters.length < 5) {
          state.shooters.push(spawnShooter(w, h, accentColors));
        }
      }

      // — draw & advance shooters —
      state.shooters = state.shooters.filter(s => {
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.life += 0.012 * dt;

        // fade in then out
        const fade = s.life < 0.2
          ? s.life / 0.2
          : s.life > 0.75
            ? 1 - (s.life - 0.75) / 0.25
            : 1;

        const alpha = s.alpha * fade;

        // trail gradient
        const tailX = s.x - s.vx * (s.len / Math.sqrt(s.vx * s.vx + s.vy * s.vy));
        const tailY = s.y - s.vy * (s.len / Math.sqrt(s.vx * s.vx + s.vy * s.vy));

        const grad = ctx!.createLinearGradient(tailX, tailY, s.x, s.y);
        grad.addColorStop(0, `rgba(255,255,255,0)`);
        grad.addColorStop(0.6, `${s.color}${Math.round(alpha * 80).toString(16).padStart(2,'0')}`);
        grad.addColorStop(1, `rgba(255,255,255,${alpha * 0.9})`);

        ctx!.beginPath();
        ctx!.moveTo(tailX, tailY);
        ctx!.lineTo(s.x, s.y);
        ctx!.strokeStyle = grad;
        ctx!.lineWidth = 1.5;
        ctx!.lineCap = 'round';
        ctx!.stroke();

        // head glow
        const glow = ctx!.createRadialGradient(s.x, s.y, 0, s.x, s.y, 4);
        glow.addColorStop(0, `rgba(255,255,255,${alpha * 0.9})`);
        glow.addColorStop(1, 'rgba(255,255,255,0)');
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, 4, 0, Math.PI * 2);
        ctx!.fillStyle = glow;
        ctx!.fill();

        // keep alive while on screen + not fully spent
        return s.life < 1 && s.x > -s.len && s.x < w + s.len && s.y < h + s.len;
      });

      state.raf = requestAnimationFrame(draw);
    }

    state.raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(state.raf);
      window.removeEventListener('resize', resize);
    };
  }, [density, paused, accentColors]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
      }}
      aria-hidden="true"
    />
  );
}
