import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Cookie, Check, Mail, ArrowRight } from "lucide-react";
import { hero, site } from "../../data/site";
import { Button } from "../ui/Button";
import { ConsentChip } from "../ui/ConsentChip";
import { usePrefersReducedMotion } from "../../lib/useReducedMotion";

/**
 * Hero — the showpiece. The visitor "declines" a cookie banner and instead of
 * being lost, their email is captured. It literally performs the value prop.
 */
export function Hero() {
  return (
    <header id="top" className="relative overflow-hidden pt-10 pb-20 md:pt-16 md:pb-28">
      {/* soft brand glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-120px] h-[420px] w-[720px] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(47,111,176,0.16), transparent 70%)",
        }}
      />
      <div className="relative mx-auto w-full max-w-[1120px] px-6 text-center">
        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-blueberry/25 bg-blueberry-soft px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-blueberry-ink"
        >
          <span className="text-cherry-deep" aria-hidden>◆</span> {hero.eyebrow}
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="mx-auto mt-6 max-w-[14ch] font-display text-[clamp(42px,7vw,72px)] font-extrabold"
        >
          {hero.headlinePre}
          <span className="text-blueberry">{hero.headlineEm}</span>
          {hero.headlinePost}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12 }}
          className="mx-auto mt-5 max-w-[60ch] text-[1.1875rem] text-cocoa-soft"
        >
          {hero.sub}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.18 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Button href={site.demoHref} size="lg">
            {hero.primary}
          </Button>
          <Button href="#how" variant="ghost" size="lg">
            {hero.secondary}
          </Button>
        </motion.div>

        <div className="mt-10 flex justify-center">
          <CookieBannerDemo />
        </div>
      </div>
    </header>
  );
}

/** Small interactive proof: click Decline → still captured. */
function CookieBannerDemo() {
  const [declined, setDeclined] = useState(false);
  const reduced = usePrefersReducedMotion();

  return (
    <div className="w-full max-w-[440px]">
      <div className="rounded-[20px] border border-chip/15 bg-cream p-2 shadow-[var(--shadow-soft)]">
        <AnimatePresence mode="wait" initial={false}>
          {!declined ? (
            <motion.div
              key="banner"
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduced ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="rounded-2xl bg-milk p-4"
            >
              <div className="flex items-start gap-3 text-left">
                <Cookie className="mt-0.5 shrink-0 text-chip" size={20} aria-hidden />
                <p className="text-[0.84375rem] text-cocoa-soft">
                  This store uses cookies. Most tools lose you the moment you say no.
                </p>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setDeclined(true)}
                  className="flex-1 cursor-pointer rounded-full bg-cocoa px-4 py-2.5 text-[0.8125rem] font-semibold text-milk transition-transform hover:-translate-y-px"
                >
                  Decline cookies
                </button>
                <button className="cursor-pointer rounded-full border border-cocoa/20 px-4 py-2.5 text-[0.8125rem] font-medium text-cocoa">
                  Accept
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="captured"
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl bg-consent/10 p-4"
            >
              <div className="flex items-center gap-2.5 text-left">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-consent text-white">
                  <Check size={16} aria-hidden />
                </span>
                <p className="text-[0.84375rem] font-semibold text-cocoa">
                  Cookies declined. Shopper still reachable.
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-consent/25 bg-cream px-3.5 py-2.5">
                <span className="flex items-center gap-2 text-[0.8125rem] text-cocoa-soft">
                  <Mail size={15} className="text-consent" aria-hidden />
                  shopper@email.com
                </span>
                <ConsentChip className="hidden sm:inline-flex" />
              </div>
              <button
                onClick={() => setDeclined(false)}
                className="mt-3 inline-flex cursor-pointer items-center gap-1 text-[0.78125rem] font-medium text-blueberry hover:underline"
              >
                Replay <ArrowRight size={13} aria-hidden />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <p className="mt-3 text-center text-[0.78125rem] text-crumb">
        Try it: click <span className="font-semibold text-cocoa">Decline cookies</span>.
      </p>
    </div>
  );
}
