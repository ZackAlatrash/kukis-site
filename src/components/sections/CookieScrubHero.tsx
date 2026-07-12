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
// How much the landscape cookie clip is scaled up on phones. 1 = fit the whole
// frame to the screen width (small, lots of cream); higher fills more of the
// screen and lets the outermost break pieces bleed off the edges.
const MOBILE_FILL = 2.3;
const BG = "#FBF6E1"; // sampled from the 4K cookie clip's cream
const CREAM = "#FBF8E7"; // averaged from the frame corners — the letterbox backdrop
const CREAM_T = "rgba(251,248,231,0)";
const framePath = (i: number) => publicAsset(`cookie/f_${String(i + 1).padStart(3, "0")}.jpg`);

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Fade the top & bottom edges of a fit-to-width frame into the cream backdrop. */
function featherBand(
  ctx: CanvasRenderingContext2D,
  cw: number,
  x: number,
  top: number,
  bottom: number,
  f: number
) {
  let g = ctx.createLinearGradient(0, top, 0, top + f);
  g.addColorStop(0, CREAM);
  g.addColorStop(1, CREAM_T);
  ctx.fillStyle = g;
  ctx.fillRect(x, top, cw, f);
  g = ctx.createLinearGradient(0, bottom, 0, bottom - f);
  g.addColorStop(0, CREAM);
  g.addColorStop(1, CREAM_T);
  ctx.fillStyle = g;
  ctx.fillRect(x, bottom - f, cw, f);
}

/** Same, for left & right edges (pillarbox). */
function featherBandX(
  ctx: CanvasRenderingContext2D,
  ch: number,
  left: number,
  right: number,
  f: number
) {
  let g = ctx.createLinearGradient(left, 0, left + f, 0);
  g.addColorStop(0, CREAM);
  g.addColorStop(1, CREAM_T);
  ctx.fillStyle = g;
  ctx.fillRect(left, 0, f, ch);
  g = ctx.createLinearGradient(right, 0, right - f, 0);
  g.addColorStop(0, CREAM);
  g.addColorStop(1, CREAM_T);
  ctx.fillStyle = g;
  ctx.fillRect(right - f, 0, f, ch);
}

/**
 * Scroll-scrub hero: a whole cookie rotates, then breaks apart as you scroll,
 * revealing the Kukis wordmark in the cleared center. All frames are decoded to
 * ImageBitmaps up front so scrubbing is jank-free.
 *
 * Runs on both desktop and mobile (the phone is where most shoppers land, so it
 * keeps the signature moment). Only prefers-reduced-motion falls back to the
 * static <Hero/>. On phones the frames decode at a smaller size to keep memory
 * in check and the landscape frame is fit to width so the breaking pieces never
 * get cropped off the sides.
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

  if (reduced) return <Hero />;
  return <Scrub mobile={isSmall} />;
}

function Scrub({ mobile }: { mobile: boolean }) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cueRef = useRef<HTMLDivElement | null>(null);
  const bottomCueRef = useRef<HTMLDivElement | null>(null);
  const revealRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef(0);
  const lastDrawn = useRef(-1);
  // decoded frames persist in a ref so React StrictMode's double-mount can't
  // cancel/empty the live loop's data.
  const bitmapsRef = useRef<(ImageBitmap | undefined)[]>([]);
  const startedRef = useRef(false);
  // `mobile` drives fit + decode size; keep it in a ref so the one-shot decode
  // loop and the draw loop read the current value without re-subscribing.
  const mobileRef = useRef(mobile);
  mobileRef.current = mobile;

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
      // Desktop fills the frame (cover). On a portrait phone the cookie clip is
      // landscape, so cover would zoom into the middle and slice off the pieces
      // that fly to the edges — fit to width instead so the whole break shows.
      const scale = mobileRef.current
        ? Math.min(cw / bmp.width, ch / bmp.height) * MOBILE_FILL
        : Math.max(cw / bmp.width, ch / bmp.height);
      const dw = bmp.width * scale;
      const dh = bmp.height * scale;
      const dx = (cw - dw) / 2;
      const dy = (ch - dh) / 2;
      const letterboxed = dy > 0.5 || dx > 0.5;
      ctx.clearRect(0, 0, cw, ch);
      // Fit-to-width (mobile portrait) leaves cream letterbox bands. Lay a solid
      // cream backdrop matching the frame's cream, then feather the band edges
      // into it so no rectangle seam shows. Desktop covers the frame, so this is
      // skipped entirely and it draws exactly as before.
      if (letterboxed) {
        ctx.fillStyle = CREAM;
        ctx.fillRect(0, 0, cw, ch);
      }
      ctx.drawImage(bmp, dx, dy, dw, dh);
      if (dy > 0.5) {
        const f = Math.round(ch * 0.045);
        featherBand(ctx, cw, 0, dy, dy + dh, f);
      }
      if (dx > 0.5) {
        featherBandX(ctx, ch, dx, dx + dw, Math.round(cw * 0.06));
      }
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
      // On phones the "scroll to break" hint has done its job once the cookie
      // starts breaking — fade it out. Desktop keeps it (mobileRef gates this).
      if (bottomCueRef.current && mobileRef.current) {
        bottomCueRef.current.style.opacity = String(clamp(1 - p / 0.35));
      }
      if (revealRef.current) {
        const r = smoothstep(0.66, 0.95, p);
        revealRef.current.style.opacity = String(r);
        revealRef.current.style.transform = `scale(${0.95 + 0.05 * r})`;
        // While hidden, take the CTAs out of the tab order + a11y tree (not just
        // pointer events) so keyboard users can't focus invisible controls.
        const revealed = r > 0.6;
        revealRef.current.style.pointerEvents = revealed ? "auto" : "none";
        revealRef.current.inert = !revealed;
      }
      raf = requestAnimationFrame(loop);
    };

    // decode every frame off-thread, once; draw each as it lands. Phones decode
    // at a smaller width to keep the total bitmap memory reasonable.
    if (!startedRef.current) {
      startedRef.current = true;
      const decodeOpts = mobileRef.current
        ? ({ resizeWidth: 760, resizeQuality: "high" } as ImageBitmapOptions)
        : undefined;
      for (let i = 0; i < FRAMES; i++) {
        fetch(framePath(i))
          .then((res) => res.blob())
          .then((blob) =>
            decodeOpts
              ? createImageBitmap(blob, decodeOpts).catch(() => createImageBitmap(blob))
              : createImageBitmap(blob)
          )
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
    // Hidden reveal container starts inert; the loop flips it on once revealed.
    if (revealRef.current) revealRef.current.inert = true;
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
    <header
      id="top"
      ref={trackRef}
      style={{ height: mobile ? "170vh" : "190vh", background: BG }}
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <div ref={cueRef} className="absolute top-[11vh] flex flex-col items-center sm:top-[12vh]">
            <span className="inline-flex items-center gap-2 rounded-full border border-blueberry/25 bg-blueberry-soft px-3.5 py-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-blueberry-ink sm:text-xs sm:tracking-[0.14em]">
              <span className="text-cherry-deep" aria-hidden>◆</span> {hero.eyebrow}
            </span>
          </div>

          <div ref={revealRef} style={{ opacity: 0 }} className="flex max-w-[24ch] flex-col items-center">
            <Logo className="text-[clamp(56px,9vw,104px)] leading-none" />
            <h1 className="mt-4 font-display text-[clamp(23px,6vw,38px)] font-bold">
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

        <div ref={bottomCueRef} className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 text-crumb">
          <div className="flex flex-col items-center gap-1 text-center text-[0.6875rem] font-medium uppercase tracking-[0.12em] sm:text-[0.75rem] sm:tracking-[0.14em]">
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
