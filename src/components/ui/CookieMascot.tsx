import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { publicAsset } from "../../lib/publicAsset";
import { usePrefersReducedMotion } from "../../lib/useReducedMotion";

export type CookieMascotMood = "idle" | "promising" | "happy";

export function CookieMascot({
  bubble,
  mood = "idle",
  className,
}: {
  bubble: string;
  mood?: CookieMascotMood;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const spring = { stiffness: 220, damping: 18, mass: 0.4 };
  const sx = useSpring(px, spring);
  const sy = useSpring(py, spring);

  // pupils track the cursor (motion values, no re-renders)
  useEffect(() => {
    if (reduced) return;
    const onMove = (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width * 0.5;
      const cy = r.top + r.height * 0.48;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const max = r.width * 0.032;
      px.set((dx / dist) * max);
      py.set((dy / dist) * max);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [reduced, px, py]);

  const happy = mood === "happy";
  const pupilCls = "pointer-events-none absolute rounded-full bg-[#2a170c]";
  const pupilStyle = { width: "8.5%", height: "8.5%", x: sx, y: sy } as const;

  return (
    <div className={`relative w-[132px] shrink-0 md:w-[200px] ${className ?? ""}`}>
      {/* speech bubble */}
      <motion.div
        key={bubble}
        initial={reduced ? false : { opacity: 0, y: 6, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="absolute -top-2 left-1/2 z-10 max-w-[180px] -translate-x-1/2 -translate-y-full rounded-2xl border border-chip/15 bg-milk px-3 py-1.5 text-center text-[0.75rem] font-semibold leading-tight text-cocoa shadow-soft"
      >
        {bubble}
        <span className="absolute -bottom-[5px] left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-b border-r border-chip/15 bg-milk" />
      </motion.div>

      {/* mascot body: idle bob, happy hop on qualify */}
      <motion.div
        ref={ref}
        className="relative"
        animate={reduced ? { y: 0, rotate: 0 } : happy ? "happy" : "idle"}
        variants={{
          idle: { y: [0, -5, 0], rotate: 0 },
          happy: { y: [0, -16, 0], rotate: [0, -7, 7, 0] },
        }}
        transition={
          happy
            ? { duration: 0.6, ease: "easeOut" }
            : { duration: 3, repeat: reduced ? 0 : Infinity, ease: "easeInOut" }
        }
      >
        <img
          src={publicAsset("mascot/cookie.png")}
          alt="Kukis cookie mascot"
          className="w-full select-none drop-shadow-[0_14px_22px_rgba(90,52,32,0.22)]"
          draggable={false}
        />
        {/* pupils on the white eyes */}
        <motion.div className={pupilCls} style={{ ...pupilStyle, left: "31.4%", top: "44.5%" }} />
        <motion.div className={pupilCls} style={{ ...pupilStyle, left: "58.6%", top: "43.5%" }} />
      </motion.div>
    </div>
  );
}
