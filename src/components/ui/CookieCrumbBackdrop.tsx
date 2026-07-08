import { publicAsset } from "../../lib/publicAsset";

const CRUMB_COUNT = 23;
const crumbSrc = (i: number) => publicAsset(`crumbs/crumb_${String(i).padStart(2, "0")}.png`);

// Deterministic pseudo-random scatter so the cookie field is stable across renders.
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

export function CookieCrumbBackdrop({
  className = "",
  opacityScale = 1,
  sizeScale = 1,
}: {
  className?: string;
  opacityScale?: number;
  sizeScale?: number;
}) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
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
              width: c.size * sizeScale,
              opacity: c.opacity * opacityScale,
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
  );
}
