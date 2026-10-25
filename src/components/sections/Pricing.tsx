import { ArrowRight, Check } from "lucide-react";
import { Section, SectionHead } from "../ui/Section";
import { Reveal } from "../ui/Reveal";
import { Button } from "../ui/Button";
import { pricing, site } from "../../data/site";

/**
 * One plan, so one card. A tier grid with a single column would imply choices
 * that do not exist, and the App Store listing has exactly this one plan.
 */
export function Pricing() {
  return (
    <Section id="pricing">
      <Reveal>
        <SectionHead
          eyebrow="Pricing"
          title="One plan. Everything in it."
          sub="No tiers to compare and no usage charges. Try it free for 30 days."
        />
      </Reveal>

      <Reveal delay={0.05}>
        <div className="mx-auto mt-11 max-w-[560px] overflow-hidden rounded-[24px] border border-chip/15 bg-cream shadow-[0_22px_50px_-24px_rgba(90,52,32,0.40)]">
          <div className="border-b border-chip/10 px-7 pb-6 pt-7 text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-blueberry">
              {pricing.plan}
            </div>
            <div className="mt-3 flex items-baseline justify-center gap-2">
              <span className="font-display text-[clamp(44px,7vw,58px)] font-extrabold leading-none tracking-[-0.03em] text-cocoa">
                {pricing.price}
              </span>
              <span className="text-lg text-crumb">{pricing.period}</span>
            </div>
            <div className="mt-3 inline-flex items-center rounded-full bg-consent/15 px-3 py-1 text-[0.8125rem] font-semibold text-consent-ink">
              {pricing.trial}
            </div>
          </div>

          <ul className="space-y-3 px-7 py-6">
            {pricing.includes.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-consent/15">
                  <Check size={12} strokeWidth={3} className="text-consent-ink" aria-hidden />
                </span>
                <span className="text-[0.9375rem] text-cocoa-soft">{item}</span>
              </li>
            ))}
          </ul>

          <div className="border-t border-chip/10 px-7 pb-7 pt-5 text-center">
            <Button href={site.installHref} size="lg" className="w-full">
              Start your free trial <ArrowRight size={18} aria-hidden />
            </Button>
            <a
              href={site.demoHref}
              className="mt-3 inline-block rounded text-[0.9375rem] font-medium text-cocoa underline-offset-4 hover:text-blueberry hover:underline"
            >
              Or book a demo first
            </a>
            <p className="mt-4 text-[0.8125rem] leading-relaxed text-crumb">{pricing.billing}</p>
            <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-crumb">{pricing.note}</p>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
