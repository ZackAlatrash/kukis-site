import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "../../lib/useReducedMotion";
import { publicAsset } from "../../lib/publicAsset";

const SPRITE_COUNT = 23;
const MAX_CRUMBS = 80;
/** Pointer distance (px) between spawns — density follows speed, not event rate. */
const SPAWN_EVERY = 16;
const GRAVITY = 0.13;
const DRAG = 0.98;

const crumbSrc = (i: number) => publicAsset(`crumbs/crumb_${String(i).padStart(2, "0")}.png`);

type Crumb = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  size: number;
  life: number;
  decay: number;
  img: HTMLImageElement;
};

/**
 * Signature cookie-crumb cursor trail: real crumb sprites that break off the
 * pointer, tumble, fall and fade. Fixed, non-interactive, reduced-motion +
 * touch aware.
 */
export function CrumbCursor() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    // Skip on coarse pointers (touch) — no cursor to trail.
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Preload the real crumb art; we only spawn from sprites that have decoded.
    const sprites: HTMLImageElement[] = [];
    for (let i = 1; i <= SPRITE_COUNT; i++) {
      const img = new Image();
      img.src = crumbSrc(i);
      sprites.push(img);
    }
    const pickSprite = () => {
      for (let tries = 0; tries < 6; tries++) {
        const img = sprites[(Math.random() * sprites.length) | 0];
        if (img.complete && img.naturalWidth > 0) return img;
      }
      return null;
    };

    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let crumbs: Crumb[] = [];

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    };
    resize();
    window.addEventListener("resize", resize);

    const spawn = (x: number, y: number) => {
      const img = pickSprite();
      if (!img) return;
      crumbs.push({
        x: x + (Math.random() * 8 - 4),
        y: y + (Math.random() * 8 - 4),
        vx: (Math.random() - 0.5) * 1.1,
        vy: Math.random() * 0.5 - 0.35, // a little lift before gravity takes over
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.16,
        size: 5 + Math.random() * 9,
        life: 1,
        decay: 0.009 + Math.random() * 0.008,
        img,
      });
      if (crumbs.length > MAX_CRUMBS) crumbs.splice(0, crumbs.length - MAX_CRUMBS);
    };

    // Spawn along the path travelled so fast moves leave a denser, even trail.
    let lastX: number | null = null;
    let lastY: number | null = null;
    let carry = 0;

    const onMove = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      if (lastX === null || lastY === null) {
        lastX = x;
        lastY = y;
        return;
      }
      const dx = x - lastX;
      const dy = y - lastY;
      const dist = Math.hypot(dx, dy);
      carry += dist;
      while (carry >= SPAWN_EVERY) {
        const t = 1 - (carry - SPAWN_EVERY) / (dist || 1);
        spawn(lastX + dx * t, lastY + dy * t);
        carry -= SPAWN_EVERY;
      }
      lastX = x;
      lastY = y;
    };
    window.addEventListener("mousemove", onMove);

    const loop = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      for (const c of crumbs) {
        c.vy += GRAVITY;
        c.vx *= DRAG;
        c.vy *= DRAG;
        c.x += c.vx;
        c.y += c.vy;
        c.rot += c.vr;
        c.life -= c.decay;

        // hold full opacity briefly, then ease out
        const a = c.life > 0.7 ? 1 : Math.max(c.life, 0) / 0.7;
        ctx.save();
        ctx.globalAlpha = a;
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rot);
        ctx.drawImage(c.img, -c.size / 2, -c.size / 2, c.size, c.size);
        ctx.restore();
      }

      crumbs = crumbs.filter((c) => c.life > 0 && c.y < h + 40);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
    };
  }, [reduced]);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[1]" />;
}
