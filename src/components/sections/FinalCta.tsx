import { ArrowRight } from "lucide-react";
import { Reveal } from "../ui/Reveal";
import { Button } from "../ui/Button";
import { CookieCrumbBackdrop } from "../ui/CookieCrumbBackdrop";
import { finalCta, site } from "../../data/site";

/** The closer: a full-bleed cocoa block with cookie crumbs drifting behind it. */
export function FinalCta() {
  return (
    <section
      id="demo"
      className="relative scroll-mt-24 overflow-hidden text-[#FBF3E4]"
      style={{
        background:
          "linear-gradient(180deg, #221610 0%, #191108 48%, #140d06 100%)",
      }}
    >
      {/* warm glow behind the CTA (kept clear of the footer so the base stays flat) */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[36%] h-[520px] w-[900px] max-w-[130%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[130px]"
        style={{
          background: "radial-gradient(circle, rgba(232,176,75,0.16) 0%, transparent 65%)",
        }}
      />

      {/* drifting cookie crumbs */}
      <CookieCrumbBackdrop />

      {/* content */}
      <div className="relative z-10 mx-auto max-w-[720px] px-6 py-20 text-center md:py-28">
        <Reveal>
          <span className="mx-auto mb-6 flex h-[58px] w-[58px] items-center justify-center rounded-2xl border border-white/12 bg-white/[0.06] font-display text-3xl font-extrabold text-[#FBF3E4]">
            K
          </span>
          <h2 className="mx-auto max-w-[16ch] font-display text-[clamp(30px,4.8vw,50px)] font-extrabold leading-[1.05] text-[#FBF3E4]">
            {finalCta.title}
          </h2>
          <p className="mx-auto mt-4 max-w-[52ch] text-lg text-[#c9b7a1]">
            {finalCta.body}
          </p>
          <div className="mt-8 flex justify-center">
            <Button href={site.demoHref} size="lg">
              {finalCta.cta} <ArrowRight size={18} aria-hidden />
            </Button>
          </div>
          <div className="mt-4 text-[0.8125rem] text-[#a48d76]">{finalCta.note}</div>
        </Reveal>
      </div>
    </section>
  );
}
