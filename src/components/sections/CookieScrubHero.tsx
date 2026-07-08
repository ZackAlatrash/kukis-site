import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "../ui/Button";
import { ConsentChip } from "../ui/ConsentChip";
import { Logo } from "../ui/Logo";
import { hero, site } from "../../data/site";
import { publicAsset } from "../../lib/publicAsset";
import { usePrefersReducedMotion } from "../../lib/useReducedMotion";
import { Hero } from "./Hero";

const FRAMES = 96;
const BG = "#FBF6E1"; // sampled from the 4K cookie clip's cream
const framePath = (i: number) => publicAsset(`cookie/f_${String(i + 1).padStart(3, "0")}.jpg`);

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/**
 * Scroll-scrub hero: a whole cookie rotates, then breaks apart as you scroll,
 * revealing the Kukis wordmark in the cleared center. All frames are decoded to
 * ImageBitmaps up front so scrubbing is jank-free. Falls back to the static
 * <Hero/> on reduced-motion and small screens.
 */
export function CookieScrubHero() {
  const reduced = usePrefersReducedMotion();
  const [isSmall, setIsSmall] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 820px)");
    const on = () => setIsSmall(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  if (reduced || isSmall) return <Hero />;
  return <Scrub />;
}

function Scrub() {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cueRef = useRef<HTMLDivElement | null>(null);
  const revealRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef(0);
  const lastDrawn = useRef(-1);
  // decoded frames persist in a ref so React StrictMode's double-mount can't
  // cancel/empty the live loop's data.
  const bitmapsRef = useRef<(ImageBitmap | undefined)[]>([]);
  const startedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d", { alpha: true })!;
    ctx.imageSmoothingQuality = "high";
    let raf = 0;
    const bitmaps = bitmapsRef.current;

    const sizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      lastDrawn.current = -1;
    };

    const nearestLoaded = (idx: number) => {
      if (bitmaps[idx]) return idx;
      for (let d = 1; d < FRAMES; d++) {
        if (idx - d >= 0 && bitmaps[idx - d]) return idx - d;
        if (idx + d < FRAMES && bitmaps[idx + d]) return idx + d;
      }
      return -1;
    };

    const drawFrame = (idx: number): boolean => {
      const use = nearestLoaded(idx);
      if (use < 0) return false;
      const bmp = bitmaps[use]!;
      const cw = canvas.width;
      const ch = canvas.height;
      const scale = Math.max(cw / bmp.width, ch / bmp.height); // cover
      const dw = bmp.width * scale;
      const dh = bmp.height * scale;
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(bmp, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
      return true;
    };

    const computeProgress = () => {
      const el = trackRef.current;
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      return clamp(-rect.top / (total || 1));
    };
    const onScroll = () => {
      progressRef.current = computeProgress();
    };

    const loop = () => {
      const p = progressRef.current;
      const idx = Math.min(FRAMES - 1, Math.round(p * (FRAMES - 1)));
      if (idx !== lastDrawn.current) {
        if (drawFrame(idx)) lastDrawn.current = idx;
      }
      if (cueRef.current) cueRef.current.style.opacity = String(clamp(1 - p / 0.1));
      if (revealRef.current) {
        const r = smoothstep(0.66, 0.95, p);
        revealRef.current.style.opacity = String(r);
        revealRef.current.style.transform = `scale(${0.95 + 0.05 * r})`;
        revealRef.current.style.pointerEvents = r > 0.6 ? "auto" : "none";
      }
      raf = requestAnimationFrame(loop);
    };

    // decode every frame off-thread, once; draw each as it lands
    if (!startedRef.current) {
      startedRef.current = true;
      for (let i = 0; i < FRAMES; i++) {
        fetch(framePath(i))
          .then((res) => res.blob())
          .then((blob) => createImageBitmap(blob))
          .then((bmp) => {
            bitmaps[i] = bmp;
            const cur = Math.round(progressRef.current * (FRAMES - 1));
            if (i === cur || i === 0) lastDrawn.current = -1; // force redraw
          })
          .catch(() => {});
      }
    } else {
      lastDrawn.current = -1; // already loaded (remount) → redraw current frame
    }

    sizeCanvas();
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", sizeCanvas);
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", sizeCanvas);
    };
  }, []);

  return (
    <header id="top" ref={trackRef} style={{ height: "190vh", background: BG }}>
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <div ref={cueRef} className="absolute top-[12vh] flex flex-col items-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-blueberry/25 bg-blueberry-soft px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-blueberry">
              <span className="text-cherry">◆</span> {hero.eyebrow}
            </span>
          </div>

          <div ref={revealRef} style={{ opacity: 0 }} className="flex max-w-[24ch] flex-col items-center">
            <Logo className="text-[clamp(56px,9vw,104px)] leading-none" />
            <h1 className="mt-4 font-display text-[clamp(24px,3.6vw,38px)] font-bold">
              {hero.headlinePre}
              <span className="text-blueberry">{hero.headlineEm}</span>
              {hero.headlinePost}
            </h1>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button href={site.demoHref} size="lg">
                {hero.primary}
              </Button>
              <Button href="#how" variant="ghost" size="lg">
                {hero.secondary}
              </Button>
            </div>
            <ConsentChip className="mt-6" />
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 text-crumb">
          <div className="flex flex-col items-center gap-1 text-[12px] font-medium uppercase tracking-[0.14em]">
            Scroll to break the cookie
            <ChevronDown size={18} className="animate-bounce" aria-hidden />
          </div>
        </div>

        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
          style={{ background: `linear-gradient(${BG}00, #FFF6E7)` }}
        />
      </div>
    </header>
  );
}
