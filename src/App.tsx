import { CrumbCursor } from "./components/ui/CrumbCursor";
import { Nav } from "./components/layout/Nav";
import { CookieScrubHero } from "./components/sections/CookieScrubHero";
import { InvisibleHalf } from "./components/sections/InvisibleHalf";
import { Insight } from "./components/sections/Insight";
import { HowItWorks } from "./components/sections/HowItWorks";
import { Widgets } from "./components/sections/Widgets";
import { WhyKukis } from "./components/sections/WhyKukis";
import { BuiltFor } from "./components/sections/BuiltFor";
import { Faq } from "./components/sections/Faq";
import { FinalCta } from "./components/sections/FinalCta";

export default function App() {
  return (
    <>
      <CrumbCursor />
      <div className="relative z-[2]">
        <Nav />
        <main>
          <CookieScrubHero />
          <InvisibleHalf />
          <Insight />
          <HowItWorks />
          <Widgets />
          <WhyKukis />
          <BuiltFor />
          <Faq />
        </main>
        <FinalCta />
      </div>
    </>
  );
}
