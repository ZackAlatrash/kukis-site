import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

type Variant = "primary" | "ghost";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold cursor-pointer transition-[background,box-shadow,transform,border-color] duration-200 focus-visible:outline-2 focus-visible:outline-blueberry focus-visible:outline-offset-2 select-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-cherry-deep text-white hover:shadow-[var(--shadow-hover)] hover:-translate-y-px active:translate-y-0",
  ghost:
    "bg-transparent text-cocoa border-[1.5px] border-cocoa/20 hover:border-cocoa/60 font-medium",
};

const sizes: Record<Size, string> = {
  md: "text-[0.9375rem] px-5 py-3",
  lg: "text-base px-7 py-3.5",
};

export function Button({
  children,
  href,
  variant = "primary",
  size = "md",
  className,
  onClick,
  ariaLabel,
}: {
  children: ReactNode;
  href?: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  onClick?: () => void;
  ariaLabel?: string;
}) {
  const cls = cn(base, variants[variant], sizes[size], className);
  if (href) {
    return (
      <a href={href} className={cls} aria-label={ariaLabel} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" className={cls} aria-label={ariaLabel} onClick={onClick}>
      {children}
    </button>
  );
}
