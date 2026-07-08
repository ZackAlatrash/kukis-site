import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

/** Standard section wrapper: id anchor, vertical rhythm, centered max-width container. */
export function Section({
  id,
  children,
  className,
  bleed,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  /** full-bleed background (no container padding on the section itself) */
  bleed?: boolean;
}) {
  return (
    <section id={id} className={cn("scroll-mt-24 py-16 md:py-24", className)}>
      {bleed ? children : <div className="mx-auto w-full max-w-[1120px] px-6">{children}</div>}
    </section>
  );
}

export function SectionHead({
  eyebrow,
  title,
  sub,
  center = true,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
  center?: boolean;
}) {
  return (
    <div className={cn("max-w-[720px]", center && "mx-auto text-center")}>
      {eyebrow && (
        <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-[0.14em] text-blueberry">
          {eyebrow}
        </span>
      )}
      <h2 className="font-display text-[clamp(30px,4.4vw,44px)] font-bold">{title}</h2>
      {sub && <p className="mt-3.5 text-lg text-crumb">{sub}</p>}
    </div>
  );
}
