import { Cookie, Mail } from "lucide-react";
import { cn } from "../../lib/cn";

/** The signature 🍪 Cookies off · ✉️ Marketing on chip — the product's idea in one pill. */
export function ConsentChip({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-blueberry/25 bg-blueberry-soft px-3.5 py-2 text-[0.8125rem] font-medium",
        className
      )}
    >
      <Cookie size={15} className="text-crumb" aria-hidden />
      Cookies <span className="text-crumb line-through">off</span>
      <span className="text-crumb/50" aria-hidden>·</span>
      <Mail size={15} className="text-consent-ink" aria-hidden />
      Marketing <span className="font-bold text-consent-ink">on</span>
    </span>
  );
}
