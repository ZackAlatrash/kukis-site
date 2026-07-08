import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "../../lib/useReducedMotion";

type Crumb = {
  x: number;
  y: number;
  r: number;
  a: number;
  vx: number;
  vy: number;
  color: string;
};

const COLORS = ["#5A3420", "#9A8672", "#E8B04B", "#C08552"];

/** Signature cookie-crumb cursor trail. Fixed, non-interactive, reduced-motion + touch aware. */
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

    let w = 0;
    let h = 0;
    let raf = 0;
    let crumbs: Crumb[] = [];

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: MouseEvent) => {
      for (let i = 0; i < 2; i++) {
        crumbs.push({
          x: e.clientX + (Math.random() * 10 - 5),
          y: e.clientY + (Math.random() * 10 - 5),
          r: Math.random() * 2.4 + 1,
          a: 1,
          vx: (Math.random() - 0.5) * 0.6,
          vy: Math.random() * 0.8 + 0.3,
          color: COLORS[(Math.random() * COLORS.length) | 0],
        });
      }
      if (crumbs.length > 140) crumbs.splice(0, crumbs.length - 140);
    };
    window.addEventListener("mousemove", onMove);

    const loop = () => {
      ctx.clearRect(0, 0, w, h);
      for (const c of crumbs) {
        c.x += c.vx;
        c.y += c.vy;
        c.a -= 0.02;
        ctx.globalAlpha = Math.max(c.a, 0);
        ctx.fillStyle = c.color;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.fill();
      }
      crumbs = crumbs.filter((c) => c.a > 0);
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
    };
  }, [reduced]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[1]"
    />
  );
}
