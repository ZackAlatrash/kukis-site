import { useEffect, useRef, useState } from "react";
import { Check, Cookie, User } from "lucide-react";
import { usePrefersReducedMotion } from "../../lib/useReducedMotion";
import { publicAsset } from "../../lib/publicAsset";

const CRUMB_COUNT = 23;
const crumbSrc = (i: number) => publicAsset(`crumbs/crumb_${String(i + 1).padStart(2, "0")}.png`);
const figureSrc = (i: number) => publicAsset(`figures/figure_${String(i).padStart(2, "0")}.png`);
// recolor the dark silhouettes to a warm light tone so they read on espresso
const FIG_FILTER =
  "brightness(0) invert(0.86) sepia(0.35) saturate(1.5) hue-rotate(-12deg) brightness(1.08)";

const CROWD = [
  { fig: 1, lost: false },
  { fig: 2, lost: true },
  { fig: 5, lost: false },
  { fig: 4, lost: true },
];
const INBOX_ROWS = 3;

type Phase = "collecting" | "composing" | "sending";

type P = {
  x: number; y: number; vx: number; vy: number;
  rot: number; vr: number; size: number; sprite: number;
  delay: number; phase: number; amp: number; alpha: number;
  caught: boolean; fade: number;
};
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

const AD_EMAILS = [
  { subject: "Your cart's still warm 🍪", preview: "Here's 10% to finish checkout" },
  { subject: "Still thinking it over?", preview: "Your saved items, plus a little treat inside" },
];

export function CrumblingCrowd() {
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState<Phase>("collecting");
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const inboxRef = useRef<HTMLDivElement | null>(null);
  const imgRefs = useRef<(HTMLImageElement | null)[]>([]);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    const inbox = inboxRef.current;
    if (!stage || !canvas || !inbox) return;

    const crumbs: HTMLImageElement[] = [];
    for (let i = 0; i < CRUMB_COUNT; i++) {
      const im = new Image();
      im.src = crumbSrc(i);
      crumbs.push(im);
    }
    if (reduced) {
      rowRefs.current.forEach((r) => r && (r.style.opacity = "1"));
      const tm = setTimeout(() => setPhase("sending"), 500);
      return () => clearTimeout(tm);
    }

    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let started = false;
    let startTime = 0;
    let last = 0;
    let firstCatch = -1;
    let queued = false;
    let particles: P[] = [];
    let box = { x: 0, y: 0, w: 0, h: 0 };
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const sizeCanvas = () => {
      const r = stage.getBoundingClientRect();
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      canvas.style.width = r.width + "px";
      canvas.style.height = r.height + "px";
      const ib = inbox.getBoundingClientRect();
      box = { x: ib.left - r.left, y: ib.top - r.top, w: ib.width, h: ib.height };
    };

    const sample = () => {
      const sr = stage.getBoundingClientRect();
      const STEP = 5;
      imgRefs.current.forEach((img, i) => {
        if (!img || !CROWD[i].lost || !img.complete || !img.naturalWidth) return;
        const r = img.getBoundingClientRect();
        const w = Math.round(r.width);
        const h = Math.round(r.height);
        const ox = r.left - sr.left;
        const oy = r.top - sr.top;
        const off = document.createElement("canvas");
        off.width = w; off.height = h;
        const octx = off.getContext("2d")!;
        octx.drawImage(img, 0, 0, w, h);
        const data = octx.getImageData(0, 0, w, h).data;
        for (let y = 0; y < h; y += STEP) {
          for (let x = 0; x < w; x += STEP) {
            if (data[(y * w + x) * 4 + 3] > 130) {
              const small = Math.random() < 0.72;
              particles.push({
                x: ox + x + rnd(-STEP / 2, STEP / 2),
                y: oy + y + rnd(-STEP / 2, STEP / 2),
                vx: rnd(-10, 10),
                vy: rnd(-14, 6),
                rot: rnd(0, Math.PI * 2),
                vr: rnd(-5, 5),
                size: small ? rnd(3, 7) : rnd(7.5, 15),
                sprite: (Math.random() * CRUMB_COUNT) | 0,
                // wider spread so the disintegration reads top-to-bottom, unrushed
                delay: (y / h) * 0.95 + (x / w) * 0.22 + rnd(0, 0.4),
                phase: rnd(0, Math.PI * 2),
                amp: rnd(6, 18),
                alpha: small ? rnd(0.55, 0.85) : rnd(0.85, 1),
                caught: false,
                fade: 0,
              });
            }
          }
        }
      });
    };

    const revealRows = (n: number) => {
      for (let k = 0; k < INBOX_ROWS; k++) {
        const row = rowRefs.current[k];
        if (!row) continue;
        const on = k < n;
        row.style.opacity = on ? "1" : "0";
        row.style.transform = on ? "translateY(0)" : "translateY(8px)";
      }
    };

    const GRAV = 120;
    const cx = () => box.x + box.w / 2;

    const loop = (now: number) => {
      const t = (now - startTime) / 1000;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // lost shoppers dissolve slowly as their crumbs peel away
      imgRefs.current.forEach((img, i) => {
        if (img && CROWD[i].lost) img.style.opacity = String(Math.max(0, 1 - t / 1.9));
      });

      let alive = 0;
      for (const p of particles) {
        if (t < p.delay) { alive++; continue; }
        const pt = t - p.delay;
        alive++;
        if (!p.caught) {
          p.vx += (cx() - p.x) * 0.34 * dt;
          p.vx *= 1 - 0.9 * dt;
          p.vy *= 1 - 0.24 * dt;
          p.vy += GRAV * (0.8 + p.size / 18) * dt;
          p.x += (p.vx + Math.sin(t * 1.5 + p.phase) * p.amp) * dt;
          p.y += p.vy * dt;
          if (p.y >= box.y - 4 && p.x >= box.x + 8 && p.x <= box.x + box.w - 8) {
            p.caught = true;
            if (firstCatch < 0) {
              firstCatch = t;
              if (!queued) {
                queued = true;
                setTimeout(() => setPhase("composing"), 2400);
                setTimeout(() => setPhase("sending"), 3800);
              }
            }
          }
        } else {
          p.fade += dt * 2.6;
          p.y += dt * 26;
        }
        if (p.fade >= 1) continue;
        const img = crumbs[p.sprite];
        if (!img.complete || !img.naturalWidth) continue;
        const ar = img.naturalHeight / img.naturalWidth;
        const w = p.size;
        const h = p.size * ar;
        ctx.globalAlpha = Math.max(0, p.alpha * (1 - p.fade));
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot + p.vr * pt);
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
        ctx.rotate(-(p.rot + p.vr * pt));
        ctx.translate(-p.x, -p.y);
      }
      ctx.globalAlpha = 1;

      if (firstCatch >= 0) {
        revealRows(Math.min(INBOX_ROWS, Math.floor((t - firstCatch) / 0.5) + 1));
      }
      if (alive > 0 || t < 0.5) raf = requestAnimationFrame(loop);
    };

    const start = () => {
      if (started) return;
      started = true;
      sizeCanvas();
      particles = [];
      sample();
      startTime = performance.now();
      last = startTime;
      raf = requestAnimationFrame(loop);
    };

    const io = new IntersectionObserver(
      (e) => { if (e[0].isIntersecting) { start(); io.disconnect(); } },
      { threshold: 0.3 }
    );
    io.observe(stage);
    window.addEventListener("resize", sizeCanvas);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", sizeCanvas);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  return (
    <div
      ref={stageRef}
      aria-hidden
      className="relative mx-auto h-[500px] w-full max-w-[860px] sm:h-[560px]"
    >
      {/* the crowd, near the top and much larger */}
      <div className="absolute inset-x-0 top-0 flex items-end justify-center gap-6 pt-2 sm:gap-14">
        {CROWD.map((c, i) => (
          <img
            key={i}
            ref={(el) => { imgRefs.current[i] = el; }}
            src={figureSrc(c.fig)}
            alt=""
            aria-hidden
            className="h-[180px] w-auto select-none sm:h-[220px]"
            style={{ filter: FIG_FILTER, opacity: reduced && c.lost ? 0.25 : 1 }}
            draggable={false}
          />
        ))}
      </div>

      <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute left-0 top-0 z-10" />

      {/* realistic Kukis inbox, fixed height so "sending" never overlaps the crowd */}
      <div
        ref={inboxRef}
        className="absolute bottom-0 left-1/2 z-20 flex h-[286px] w-[min(94%,440px)] -translate-x-1/2 flex-col overflow-hidden rounded-[20px] border border-[rgba(255,246,231,0.14)] bg-[#241811] shadow-[0_24px_60px_rgba(0,0,0,0.5)]"
      >
        {/* toolbar */}
        <div className="flex items-center justify-between border-b border-[rgba(255,246,231,0.09)] bg-[#2c1e14] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cocoa">
              <Cookie size={16} className="text-amber" aria-hidden />
            </span>
            <div className="leading-tight">
              <div className="text-[0.875rem] font-semibold text-[#FBF3E4]">Kukis inbox</div>
              <div className="text-[0.6875rem] text-[#a48d76]">
                {phase === "sending"
                  ? "2 re-engagement emails sent"
                  : phase === "composing"
                    ? "Composing re-engagement emails"
                    : "Capturing shoppers who declined cookies"}
              </div>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold ${
              phase === "composing"
                ? "bg-amber/15 text-amber"
                : "bg-consent/15 text-consent"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 animate-pulse rounded-full motion-reduce:animate-none ${
                phase === "composing" ? "bg-amber" : "bg-consent"
              }`}
            />
            {phase === "sending" ? "Sent" : phase === "composing" ? "Composing" : "Live"}
          </span>
        </div>

        {/* body */}
        <div className="flex flex-1 flex-col overflow-hidden p-2.5">
          {phase === "collecting" && (
            <div className="flex flex-col gap-1.5">
              {Array.from({ length: INBOX_ROWS }).map((_, k) => (
                <div
                  key={k}
                  ref={(el) => { rowRefs.current[k] = el; }}
                  className="flex items-center gap-3 rounded-xl border border-[rgba(255,246,231,0.06)] bg-[#2c1e14] px-3 py-2.5 transition-all duration-300"
                  style={{ opacity: k === 0 ? 1 : 0, transform: k === 0 ? "translateY(0)" : "translateY(8px)" }}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#3a2716]">
                    <User size={16} className="text-[#c9b7a1]" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[0.84375rem] font-semibold text-[#FBF3E4]">
                        Shopper captured
                      </span>
                      <span className="shrink-0 text-[0.6875rem] text-[#a48d76]">now</span>
                    </div>
                    <div className="truncate text-[0.75rem] text-[#a48d76]">
                      Declined cookies, consented to email
                    </div>
                  </div>
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-consent/20">
                    <Check size={13} strokeWidth={3} className="text-consent" aria-hidden />
                  </span>
                </div>
              ))}
            </div>
          )}

          {phase === "composing" && (
            <div className="flex flex-1 flex-col justify-center gap-3.5 px-1">
              <div className="composing-dots text-[0.8125rem] font-medium text-amber">
                Turning caught shoppers into re-engagement emails
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#3a2716]">
                <div className="composing-bar h-full w-1/3 rounded-full bg-amber" />
              </div>
            </div>
          )}

          {phase === "sending" && (
            <div className="flex flex-col gap-2">
              {AD_EMAILS.map((e, k) => (
                <div
                  key={k}
                  className="flex items-center gap-3 rounded-xl border border-[rgba(232,176,75,0.2)] bg-[#2c1e14] px-3 py-2.5 opacity-0"
                  style={{ animation: `fadeUp 0.5s ease ${k * 0.22}s forwards` }}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cocoa">
                    <Cookie size={16} className="text-amber" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[0.84375rem] font-semibold text-[#FBF3E4]">
                        {e.subject}
                      </span>
                      <span
                        className="shrink-0 rounded bg-consent/15 px-1.5 py-0.5 text-[0.59375rem] font-bold uppercase tracking-wide text-consent"
                        style={{ animation: `badgePop 0.4s ease ${0.35 + k * 0.22}s backwards` }}
                      >
                        sent
                      </span>
                    </div>
                    <div className="truncate text-[0.75rem] text-[#a48d76]">{e.preview}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
