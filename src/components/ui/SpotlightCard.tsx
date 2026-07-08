import { useRef, useState, type ReactNode } from "react";
import { cn } from "../../lib/cn";

/**
 * Cursor-follow spotlight card (adapted from Aceternity's Card Spotlight /
 * Glowing Effect) for the dark problem section. A warm radial glow tracks the
 * pointer; a faint top sheen + hover lift add polish.
 */
export function SpotlightCard({
  children,
  className,
  glow = "rgba(232,176,75,0.20)",
}: {
  children: ReactNode;
  className?: string;
  glow?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: -300, y: -300 });
  const [on, setOn] = useState(false);

  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        const r = ref.current!.getBoundingClientRect();
        setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
      }}
      onMouseEnter={() => setOn(true)}
      onMouseLeave={() => setOn(false)}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-[rgba(255,246,231,0.10)] bg-[#2a1c12] transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-[rgba(232,176,75,0.35)]",
        className
      )}
    >
      {/* cursor spotlight */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: on ? 1 : 0,
          background: `radial-gradient(280px circle at ${pos.x}px ${pos.y}px, ${glow}, transparent 65%)`,
        }}
      />
      {/* top sheen */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(255,246,231,0.20)] to-transparent" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
