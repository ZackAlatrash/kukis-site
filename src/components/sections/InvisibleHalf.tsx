import { CrumblingCrowd } from "./CrumblingCrowd";
import { SpotlightCard } from "../ui/SpotlightCard";
import { stats } from "../../data/site";

export function InvisibleHalf() {
  return (
    <section
      id="problem"
      className="scroll-mt-24 py-16 text-[#FBF3E4] md:py-20"
      style={{ background: "radial-gradient(120% 90% at 50% 0%, #2a1a10 0%, #1a1108 60%, #150d06 100%)" }}
    >
      <div className="mx-auto w-full max-w-[1120px] px-6">
        {/* header */}
        <div className="max-w-[680px]">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-amber">
            The problem
          </span>
          <h2 className="mt-4 font-display text-[clamp(30px,4.6vw,48px)] font-bold text-[#FBF3E4]">
            Most of your shoppers leave no trace.
          </h2>
          <p className="mt-4 text-lg text-[#c9b7a1]">
            Around 70% of carts are abandoned, and in the EU, roughly half of shoppers reject the
            cookie banner. The tools built for cookies can't see them. They browse, and they crumble
            away.
          </p>
        </div>

        {/* stats: compact row of three */}
        <div className="mt-9 grid gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <SpotlightCard key={s.label} className="p-6">
              <div className="font-display text-[2.25rem] font-extrabold leading-none tracking-[-0.03em] text-cherry">
                {s.big}
              </div>
              <div className="mt-3 text-xs font-semibold uppercase tracking-[0.1em] text-amber">
                {s.label}
              </div>
              <p className="mt-2 text-[0.90625rem] text-[#c9b7a1]">{s.body}</p>
            </SpotlightCard>
          ))}
        </div>

        {/* full-width crumble scene */}
        <div className="mt-12">
          <CrumblingCrowd />
        </div>

        {/* narrative hook */}
        <p className="mx-auto mt-8 max-w-[32ch] text-center font-display text-[clamp(22px,3vw,32px)] font-bold leading-tight text-[#FBF3E4]">
          Everyone else loses them. <span className="text-amber">Kukis catches the crumbs.</span>
        </p>
      </div>
    </section>
  );
}
