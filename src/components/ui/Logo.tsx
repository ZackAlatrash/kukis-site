import { cn } from "../../lib/cn";

/** Kukis wordmark. The middle "k" carries a cookie-bite notch (design.md: bitten-letter).
 *  `biteClass` sets the notch colour so it matches whatever background it sits on. */
export function Logo({
  className,
  biteClass = "bg-milk",
}: {
  className?: string;
  biteClass?: string;
}) {
  return (
    <span
      className={cn(
        "font-display text-2xl font-extrabold tracking-[-0.04em] text-blueberry",
        className
      )}
    >
      Ku
      <span className="relative inline-block">
        k
        <span
          aria-hidden
          className={cn(
            "absolute -right-[2px] top-[3px] h-[7px] w-[7px] rounded-full",
            biteClass
          )}
        />
      </span>
      is
    </span>
  );
}
