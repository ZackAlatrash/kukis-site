import { useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useMotionValueEvent,
} from "framer-motion";
import {
  Cookie,
  Mail,
  Check,
  ArrowRight,
  Lock,
  MousePointer2,
  Image as ImageIcon,
} from "lucide-react";
import { usePrefersReducedMotion } from "../../lib/useReducedMotion";
import { steps } from "../../data/site";

/** Distinct dark colour-block so the timeline section reads as its own chapter. */
const DARK_BG =
  "radial-gradient(125% 100% at 50% -8%, #222630 0%, #171a21 55%, #121318 100%)";

/**
 * "How it works" as one continuous journey rather than three disconnected cards.
 * A pinned device morphs through the three stages (storefront click, consent,
 * inbox) while the steps scroll past a progress rail. On mobile it collapses to a
 * vertical story with each step carrying its own inline visual.
 */
export function HowItWorks() {
  const reduced = usePrefersReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // The section pins to the viewport while scrolling through `trackRef`; scroll
  // progress drives the active step, the spine fill and the morphing device.
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });
  const fillHeight = useTransform(scrollYProgress, [0.04, 0.96], ["0%", "100%"]);

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const idx = p < 0.34 ? 0 : p < 0.68 ? 1 : 2;
    setActive((c) => (c === idx ? c : idx));
  });

  // Mobile + reduced-motion share a plain stacked story (no pin, no scrub).
  const stacked = (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-16 h-[520px] w-[520px] -translate-x-1/2 rounded-full blur-[120px]"
        style={{
          background:
            "radial-gradient(circle, rgba(47,111,176,0.30) 0%, rgba(47,111,176,0) 62%)",
        }}
      />
      <div className="relative mx-auto w-full max-w-[560px] px-6 py-16">
        <Header />
        <div className="mt-9 space-y-12">
          {steps.map((step, i) => (
            <div key={step.n}>
              <div className="mb-4 flex items-center gap-3">
                <span className="font-display text-3xl font-extrabold text-white/25">
                  0{i + 1}
                </span>
                <span className="text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-amber">
                  {step.tag}
                </span>
              </div>
              <h3 className="font-display text-[1.625rem] font-bold text-[#FBF3E4]">
                {step.title}
              </h3>
              <p className="mt-3 max-w-[46ch] text-[1rem] leading-relaxed text-white/60">
                {step.body}
              </p>
              <div className="mt-6">
                <Device active={i} reduced />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (reduced) {
    return (
      <section
        id="how"
        className="relative overflow-hidden text-[#FBF3E4]"
        style={{ background: DARK_BG }}
      >
        {stacked}
      </section>
    );
  }

  return (
    <section id="how" className="relative text-[#FBF3E4]" style={{ background: DARK_BG }}>
      {/* Desktop: scroll-pinned. Stepper advances + device morphs as you scroll. */}
      <div
        ref={trackRef}
        className="relative hidden md:block"
        style={{ height: `${steps.length * 100}vh` }}
      >
        <div className="sticky top-0 h-[100dvh] overflow-hidden">
          {/* emphasised ambient background glow */}
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <motion.div
              className="absolute left-1/2 top-1/2 h-[860px] w-[860px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[130px]"
              style={{
                background:
                  "radial-gradient(circle, rgba(47,111,176,0.36) 0%, rgba(47,111,176,0) 62%)",
              }}
              animate={{ scale: [1, 1.14, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute right-[4%] top-[10%] h-[520px] w-[520px] rounded-full blur-[130px]"
              style={{
                background:
                  "radial-gradient(circle, rgba(232,176,75,0.16) 0%, rgba(232,176,75,0) 60%)",
              }}
              animate={{ scale: [1.1, 1, 1.1], opacity: [0.6, 0.95, 0.6] }}
              transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          {/* fills the whole pinned frame so each step is as tall as the section */}
          <div className="relative mx-auto flex h-full w-full max-w-[1120px] flex-col px-6 pb-12 pt-24">
            <Header />
            <div className="mt-8 grid min-h-0 flex-1 grid-cols-[1fr_1fr] items-stretch gap-16">
              {/* LEFT: the stepper (big number + full-height spine + dots) */}
              <div className="relative h-full pl-16">
                {/* spine spans the full section height */}
                <div className="pointer-events-none absolute bottom-0 left-1.5 top-0 w-[2px] rounded bg-white/12">
                  <motion.div
                    className="absolute inset-x-0 top-0 rounded bg-gradient-to-t from-blueberry via-blueberry to-transparent shadow-[0_0_10px_1px_rgba(47,111,176,0.4)]"
                    style={{ height: fillHeight }}
                  >
                    <span className="absolute -bottom-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-blueberry shadow-[0_0_14px_3px_rgba(47,111,176,0.6)]" />
                  </motion.div>
                </div>

                {/* station dots along the full-height spine */}
                {steps.map((_, i) => (
                  <span
                    key={i}
                    aria-hidden
                    style={{ top: `${(i / (steps.length - 1)) * 100}%` }}
                    className={`absolute left-0 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 transition-colors duration-300 ${
                      active >= i
                        ? "border-blueberry bg-blueberry"
                        : "border-white/25 bg-transparent"
                    }`}
                  />
                ))}

                <div className="flex h-full flex-col justify-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={active}
                      initial={{ opacity: 0, y: 34, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -28, scale: 0.96 }}
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                      className="origin-left"
                    >
                      <div className="font-display text-[clamp(90px,11vw,150px)] font-extrabold leading-[0.85] text-white/[0.16]">
                        0{active + 1}
                      </div>
                      <div className="mt-4 text-[0.8125rem] font-semibold uppercase tracking-[0.18em] text-amber">
                        {steps[active].tag}
                      </div>
                      <h3 className="mt-4 font-display text-[clamp(32px,4vw,52px)] font-bold leading-[1.04] text-[#FBF3E4]">
                        {steps[active].title}
                      </h3>
                      <p className="mt-5 max-w-[42ch] text-[1.0625rem] leading-relaxed text-white/60">
                        {steps[active].body}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* RIGHT: the preview, morphs to the active step */}
              <div className="flex h-full items-center justify-center md:justify-end">
                <Device active={active} reduced={false} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: stacked story */}
      <div className="md:hidden">{stacked}</div>
    </section>
  );
}

function Header() {
  return (
    <div className="max-w-[640px]">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-amber">
        How it works
      </span>
      <h2 className="mt-3 font-display text-[clamp(28px,4vw,42px)] font-bold text-[#FBF3E4]">
        Three steps. One clean email.
      </h2>
      <p className="mt-3 max-w-[52ch] text-[1.03125rem] text-[#FBF3E4]/60">
        No popups, no follow-up spam. The shopper chooses to click. That's the whole point.
      </p>
    </div>
  );
}

const FRAME_LABELS = [
  { icon: Lock, text: "yourstore.example" },
  { icon: Cookie, text: "Save my cart" },
  { icon: Mail, text: "Inbox" },
];

function Device({ active, reduced }: { active: number; reduced: boolean }) {
  const Label = FRAME_LABELS[active];
  const body = <DeviceBody stage={active} reduced={reduced} />;

  return (
    <div className="relative mx-auto w-full max-w-[452px]">
      {/* soft grounded shadow for depth */}
      <div
        className="absolute -inset-3 -z-10 rounded-[34px] bg-cocoa/[0.05] blur-2xl"
        aria-hidden
      />
      <div className="overflow-hidden rounded-[28px] border border-chip/12 bg-cream shadow-[0_34px_80px_-30px_rgba(46,28,16,0.38)] ring-1 ring-inset ring-white/40">
        {/* browser chrome with an address-bar pill */}
        <div className="flex items-center gap-2 border-b border-chip/10 bg-milk/70 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-crumb/25" />
          <span className="h-2.5 w-2.5 rounded-full bg-crumb/25" />
          <span className="h-2.5 w-2.5 rounded-full bg-crumb/25" />
          <div className="ml-2 flex min-w-0 flex-1 items-center gap-1.5 rounded-lg border border-chip/12 bg-cream px-3 py-1.5 text-[0.75rem] font-medium text-crumb">
            <Label.icon size={12} aria-hidden />
            <span className="truncate">{Label.text}</span>
          </div>
        </div>

        <div className="relative min-h-[318px] p-6">
          {reduced ? (
            body
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              >
                {body}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}

function DeviceBody({ stage, reduced }: { stage: number; reduced: boolean }) {
  if (stage === 0) {
    return (
      <div>
        {/* product image (real photo drops into /how/product.jpg; placeholder shows until then) */}
        <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-amber/60 via-crumb/25 to-chip/55">
          <ImageIcon size={30} className="text-cocoa/25" aria-hidden />
          <img
            src="/how/product.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
        <div className="mt-3.5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-[0.96875rem] font-semibold text-cocoa">
              Speckled ceramic mug
            </div>
            <div className="text-[0.78125rem] text-crumb">In your cart</div>
          </div>
          <div className="shrink-0 font-display text-[1.0625rem] font-bold text-cocoa">€28</div>
        </div>

        <div className="relative mt-4">
          <button
            type="button"
            tabIndex={-1}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-cocoa px-4 py-3.5 text-[0.90625rem] font-semibold text-milk"
          >
            <Cookie size={17} aria-hidden />
            Save my cart
          </button>
          {!reduced && (
            <motion.span
              className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-cocoa/40"
              animate={{ opacity: [0.6, 0, 0.6], scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          <MousePointer2
            size={18}
            className="absolute -bottom-1.5 right-7 fill-cocoa text-cocoa drop-shadow-sm"
            aria-hidden
          />
        </div>
        <p className="mt-3.5 text-center text-[0.75rem] text-crumb">
          A button in the page. Never a popup.
        </p>
      </div>
    );
  }

  if (stage === 1) {
    return (
      <div>
        <div className="text-[0.75rem] font-medium text-crumb">Your email</div>
        <div className="mt-1.5 flex items-center rounded-xl border border-chip/20 bg-milk px-3 py-2.5 text-[0.8125rem] text-cocoa">
          emma@herstore.nl
          <span className="ml-0.5 inline-block h-4 w-px animate-pulse bg-cocoa/50 motion-reduce:animate-none" />
        </div>

        {/* Two separate consents: the transactional email never depends on the
            marketing opt-in. This mirrors the compliant consent architecture. */}
        <div className="mt-3 space-y-2.5 rounded-xl border border-consent/25 bg-consent/[0.08] p-3">
          {/* transactional — ticked, it's what they asked for */}
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-consent-ink text-white">
              <Check size={13} strokeWidth={3} aria-hidden />
            </span>
            <div className="text-[0.8125rem] leading-snug text-cocoa">Email me my cart</div>
          </div>

          {/* marketing — separate, and unchecked by default */}
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 h-5 w-5 shrink-0 rounded-md border-[1.5px] border-chip/60 bg-cream" />
            <div>
              <div className="text-[0.8125rem] leading-snug text-cocoa">
                Yes to occasional offers from this store
              </div>
              <div className="mt-1 text-[0.6875rem] text-crumb">
                Unchecked by default, timestamped, scoped.
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          tabIndex={-1}
          className="mt-4 w-full rounded-xl bg-consent-ink px-4 py-3 text-[0.875rem] font-semibold text-white"
        >
          Email it to me
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-2xl border border-chip/15 bg-milk p-3.5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cocoa">
            <Cookie size={17} className="text-milk" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[0.84375rem] font-semibold text-cocoa">Kukis</span>
              <span className="shrink-0 text-[0.6875rem] text-crumb">just now</span>
            </div>
            <div className="truncate text-[0.8125rem] font-semibold text-cocoa">
              Your cart, saved <span aria-hidden>🍪</span>
            </div>
            <div className="truncate text-[0.75rem] text-crumb">
              Pick up right where you left off.
            </div>
          </div>
        </div>
        <button
          type="button"
          tabIndex={-1}
          className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-xl bg-blueberry px-4 py-2.5 text-[0.8125rem] font-semibold text-white"
        >
          Return to checkout
          <ArrowRight size={14} aria-hidden />
        </button>
      </div>
      <p className="mt-4 text-center text-[0.75rem] text-crumb">
        One clean email. A discount only if they opted in.
      </p>
    </div>
  );
}
