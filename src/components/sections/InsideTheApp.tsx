import {
  AtSign,
  CircleSlash,
  Cookie,
  Download,
  FileCheck2,
  Languages,
  PlayCircle,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";
import { Section, SectionHead } from "../ui/Section";
import { Reveal } from "../ui/Reveal";
import { publicAsset } from "../../lib/publicAsset";
import { appFeatures, site, type AppFeatureIcon } from "../../data/site";

const ICONS: Record<AppFeatureIcon, LucideIcon> = {
  proof: FileCheck2,
  no: CircleSlash,
  rejected: Cookie,
  orders: ShoppingBag,
  export: Download,
  domain: AtSign,
  sync: RefreshCw,
  privacy: ShieldCheck,
  languages: Languages,
};

/**
 * The merchant's side of the product, which the page used to skip entirely:
 * it explained what shoppers see and never showed what a merchant gets.
 *
 * The screenshot is a real proof page from the demo store, not a mockup — in
 * keeping with the rest of the site, nothing here is staged. Its IP network
 * column is pixelated because it was the founder's own test capture.
 */
export function InsideTheApp() {
  return (
    <Section id="app">
      <Reveal>
        <SectionHead
          eyebrow="In the app"
          title="Every yes, on the record."
          sub="What shoppers ask for lands in your Shopify admin as evidence you can show, contacts you can use, and orders you can trace."
        />
      </Reveal>

      <Reveal delay={0.05}>
        <figure className="mx-auto mt-11 max-w-[880px]">
          <div className="overflow-hidden rounded-[20px] border border-chip/15 bg-white shadow-[0_22px_50px_-24px_rgba(90,52,32,0.40)]">
            {/* a window bar, so it reads as a screen rather than a diagram */}
            <div className="flex items-center gap-1.5 border-b border-chip/10 bg-cream px-4 py-2.5" aria-hidden>
              <span className="h-2.5 w-2.5 rounded-full bg-cherry/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-consent/60" />
              <span className="ml-3 text-[0.75rem] text-crumb">Kukis › Consent proof</span>
            </div>
            <img
              src={publicAsset("app/consent-proof.webp")}
              width={875}
              height={305}
              loading="lazy"
              decoding="async"
              alt="A Kukis consent proof page. For one shopper it lists two records, a service email and a marketing consent, each with the time in UTC, whether it was given, the exact wording shown, the wording version, the language, the widget, what opened it, and the shopper's cookie choice."
              className="block h-auto w-full"
            />
          </div>
          <figcaption className="mt-3 text-center text-[0.8125rem] text-crumb">
            A real proof page from our demo store. The IP network is masked here; merchants see it.
          </figcaption>
        </figure>
      </Reveal>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {appFeatures.map((f, i) => {
          const Icon = ICONS[f.icon];
          return (
            <Reveal key={f.title} delay={(i % 3) * 0.05}>
              <div className="h-full rounded-[18px] border border-chip/15 bg-cream p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blueberry/10">
                  <Icon size={18} className="text-blueberry" aria-hidden />
                </span>
                <h3 className="mt-3.5 font-display text-[1.0625rem] font-semibold text-cocoa">
                  {f.title}
                </h3>
                <p className="mt-1.5 text-[0.875rem] leading-relaxed text-cocoa-soft">{f.body}</p>
              </div>
            </Reveal>
          );
        })}
      </div>

      <Reveal>
        <div className="mt-10 flex justify-center">
          <a
            href={site.videoHref}
            className="inline-flex items-center gap-2 rounded-full font-semibold text-blueberry underline-offset-4 transition-colors hover:text-blueberry-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blueberry"
          >
            <PlayCircle size={18} aria-hidden />
            Watch it all in the 7-minute walkthrough
          </a>
        </div>
      </Reveal>
    </Section>
  );
}
