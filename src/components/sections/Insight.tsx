import { useEffect, useRef, useState } from "react";
import { useInView, AnimatePresence, motion } from "framer-motion";
import { Cookie, Mail, Check } from "lucide-react";
import { Section } from "../ui/Section";
import { Reveal } from "../ui/Reveal";
import { usePrefersReducedMotion } from "../../lib/useReducedMotion";
import { cn } from "../../lib/cn";

/**
 * The legal "aha": cookie consent and marketing consent are independent.
 * Instead of stating it, the panel proves it. On scroll-into-view it auto-plays
 * once (the shopper declines cookies, the marketing switch stays put), then it
 * stays interactive so anyone can flip either switch and watch them not touch.
 */
export function Insight() {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-120px" });

  // Reduced-motion: skip straight to the resolved teaching state.
  const [cookies, setCookies] = useState(!reduced);
  const [marketing, setMarketing] = useState(true);
  const [badge, setBadge] = useState(false);
  const badgeTimer = useRef<number | undefined>(undefined);

  function flashBadge(ms: number) {
    if (reduced) return;
    window.clearTimeout(badgeTimer.current);
    setBadge(true);
    badgeTimer.current = window.setTimeout(() => setBadge(false), ms);
  }

  // Auto-play once when the panel scrolls into view.
  useEffect(() => {
    if (reduced || !inView) return;
    const decline = window.setTimeout(() => {
      setCookies(false);
      flashBadge(1900);
    }, 850);
    return () => window.clearTimeout(decline);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduced]);

  useEffect(() => () => window.clearTimeout(badgeTimer.current), []);

  // Flipping cookies flashes the "unchanged" badge on marketing to show the non-effect.
  const toggleCookies = () => {
    setCookies((c) => !c);
    flashBadge(1100);
  };
  const toggleMarketing = () => setMarketing((m) => !m);

  const reachable = marketing;
  const status = reachable
    ? cookies
      ? "Cookies on, marketing on. Fully reachable."
      : "Cookies declined. This shopper is still reachable."
    : "Marketing off. Kukis sends nothing.";

  return (
    <Section id="insight">
      <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
        {/* Left: the claim */}
        <Reveal>
          <div>
            <h2 className="font-display text-[clamp(30px,4.4vw,44px)] font-bold leading-[1.05]">
              Reject the cookies.
              <br />
              Keep the yes.
            </h2>
            <p className="mt-5 max-w-[52ch] text-[1.0625rem] text-cocoa-soft">
              Under EU law, cookie consent and marketing consent are two separate
              decisions. A shopper can decline your banner and still give a clean,
              explicit yes to email.
            </p>
            <p className="mt-4 max-w-[52ch] text-[1.0625rem] text-cocoa-soft">
              A cookie-based form dies at that banner. Kukis never needed cookies in the
              first place.
            </p>
          </div>
        </Reveal>

        {/* Right: the proof */}
        <Reveal delay={0.1}>
          <div ref={ref}>
            <div className="relative rounded-[22px] border border-chip/15 bg-cream p-5 shadow-soft sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-crumb/25" />
                <span className="text-[0.78125rem] font-semibold uppercase tracking-[0.12em] text-crumb">
                  The shopper's choices
                </span>
              </div>

              {/* Cookies row */}
              <ConsentRow
                icon={<Cookie size={18} className="text-chip" aria-hidden />}
                iconBg="bg-crumb/15"
                title="Cookies"
                sub="Tracking and analytics"
                on={cookies}
                onToggle={toggleCookies}
                srLabel="Cookie consent"
              />

              {/* Independent divider */}
              <div className="relative my-1.5 flex items-center">
                <span className="h-px flex-1 bg-chip/12" />
                <span className="mx-3 rounded-full border border-chip/15 bg-milk px-2.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-crumb">
                  independent
                </span>
                <span className="h-px flex-1 bg-chip/12" />
              </div>

              {/* Marketing row */}
              <ConsentRow
                icon={<Mail size={18} className="text-consent-ink" aria-hidden />}
                iconBg="bg-consent/15"
                title="Marketing emails"
                sub="The emails they asked for"
                on={marketing}
                onToggle={toggleMarketing}
                srLabel="Marketing consent"
                badge={
                  <AnimatePresence>
                    {badge && (
                      <motion.span
                        initial={{ opacity: 0, y: 4, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                        className="pointer-events-none absolute -top-2 right-14 rounded-full bg-consent-ink px-2 py-0.5 text-[0.6875rem] font-bold text-white shadow-sm"
                      >
                        unchanged
                      </motion.span>
                    )}
                  </AnimatePresence>
                }
              />

              {/* Status strip */}
              <div
                className={cn(
                  "mt-4 flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-[0.90625rem] font-medium transition-colors duration-300",
                  reachable
                    ? "border-consent/25 bg-consent/10 text-cocoa"
                    : "border-chip/15 bg-milk text-crumb"
                )}
                aria-live="polite"
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
                    reachable ? "bg-consent text-white" : "bg-crumb/20 text-crumb"
                  )}
                >
                  <Check size={15} strokeWidth={2.5} aria-hidden />
                </span>
                {status}
              </div>
            </div>

            <p className="mt-3 pl-1 text-[0.8125rem] text-crumb">
              Go ahead, flip either switch. They don't touch each other.
            </p>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

function ConsentRow({
  icon,
  iconBg,
  title,
  sub,
  on,
  onToggle,
  srLabel,
  badge,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  sub: string;
  on: boolean;
  onToggle: () => void;
  srLabel: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="relative flex items-center gap-3.5 rounded-2xl px-1 py-3">
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-opacity",
          iconBg,
          on ? "opacity-100" : "opacity-50"
        )}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "text-[0.9375rem] font-semibold transition-colors",
            on ? "text-cocoa" : "text-crumb line-through decoration-crumb/50"
          )}
        >
          {title}
        </div>
        <div className="text-[0.8125rem] text-crumb">{sub}</div>
      </div>
      {badge}
      <Switch on={on} onToggle={onToggle} srLabel={srLabel} />
    </div>
  );
}

function Switch({
  on,
  onToggle,
  srLabel,
}: {
  on: boolean;
  onToggle: () => void;
  srLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={srLabel}
      onClick={onToggle}
      className={cn(
        "relative h-7 w-[52px] shrink-0 rounded-full transition-colors duration-300",
        on ? "bg-consent" : "bg-crumb/30"
      )}
    >
      <span
        className={cn(
          "absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          on ? "left-[27px]" : "left-1"
        )}
      />
    </button>
  );
}
