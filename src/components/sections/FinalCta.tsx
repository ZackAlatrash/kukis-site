import { ArrowRight } from "lucide-react";
import { Reveal } from "../ui/Reveal";
import { Button } from "../ui/Button";
import { Footer } from "../layout/Footer";
import { publicAsset } from "../../lib/publicAsset";
import { finalCta, site } from "../../data/site";

const CRUMB_COUNT = 23;
const crumbSrc = (i: number) => publicAsset(`crumbs/crumb_${String(i).padStart(2, "0")}.png`);

// deterministic pseudo-random so the scatter is stable across renders
const rnd = (i: number, seed: number) => {
  const x = Math.sin((i + 1) * seed) * 43758.5453;
  return x - Math.floor(x);
};

const CRUMBS = Array.from({ length: 16 }, (_, i) => ({
  sprite: (i % CRUMB_COUNT) + 1,
  left: Math.round(rnd(i, 12.9898) * 96) + 2,
  top: Math.round(rnd(i, 78.233) * 92) + 2,
  size: 16 + Math.round(rnd(i, 37.71) * 30),
  opacity: 0.16 + rnd(i, 9.7) * 0.34,
  dur: 6 + rnd(i, 4.4) * 6,
  delay: -(rnd(i, 3.3) * 8),
  dx: Math.round((rnd(i, 5.1) - 0.5) * 34),
  dy: -(10 + Math.round(rnd(i, 2.2) * 22)),
  r0: Math.round((rnd(i, 1.7) - 0.5) * 40),
  r1: Math.round((rnd(i, 8.8) - 0.5) * 60),
  blur: rnd(i, 6.6) < 0.4,
}));

/** The closer: a full-bleed cocoa block with cookie crumbs drifting behind it. */
export function FinalCta() {
  return (
    <section
      id="demo"
      className="relative scroll-mt-24 overflow-hidden text-[#FBF3E4]"
      style={{
        background:
          "linear-gradient(180deg, #221610 0%, #191108 48%, #140d06 100%)",
      }}
    >
      {/* warm glow behind the CTA (kept clear of the footer so the base stays flat) */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[36%] h-[520px] w-[900px] max-w-[130%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[130px]"
        style={{
          background: "radial-gradient(circle, rgba(232,176,75,0.16) 0%, transparent 65%)",
        }}
      />

      {/* drifting cookie crumbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {CRUMBS.map((c, i) => (
          <img
            key={i}
            src={crumbSrc(c.sprite)}
            alt=""
            className="cta-crumb absolute select-none"
            draggable={false}
            style={
              {
                left: `${c.left}%`,
                top: `${c.top}%`,
                width: c.size,
                opacity: c.opacity,
                filter: c.blur ? "blur(1px)" : "none",
                animationDelay: `${c.delay}s`,
                "--dur": `${c.dur}s`,
                "--dx": `${c.dx}px`,
                "--dy": `${c.dy}px`,
                "--r0": `${c.r0}deg`,
                "--r1": `${c.r1}deg`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* content */}
      <div className="relative z-10 mx-auto max-w-[720px] px-6 py-20 text-center md:py-28">
        <Reveal>
          <span className="mx-auto mb-6 flex h-[58px] w-[58px] items-center justify-center rounded-2xl border border-white/12 bg-white/[0.06] font-display text-3xl font-extrabold text-[#FBF3E4]">
            K
          </span>
          <h2 className="mx-auto max-w-[16ch] font-display text-[clamp(30px,4.8vw,50px)] font-extrabold leading-[1.05] text-[#FBF3E4]">
            {finalCta.title}
          </h2>
          <p className="mx-auto mt-4 max-w-[52ch] text-lg text-[#c9b7a1]">
            {finalCta.body}
          </p>
          <div className="mt-8 flex justify-center">
            <Button href={site.demoHref} size="lg">
              {finalCta.cta} <ArrowRight size={18} aria-hidden />
            </Button>
          </div>
          <div className="mt-4 text-[13px] text-[#a48d76]">{finalCta.note}</div>
        </Reveal>
      </div>

      {/* footer, part of the same cocoa canvas */}
      <div className="relative z-10">
        <Footer />
      </div>
    </section>
  );
}
