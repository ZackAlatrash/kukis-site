import { useEffect } from "react";
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
  useEffect(() => {
    const scrollToHash = () => {
      const id = window.location.hash.slice(1);
      if (!id) return;
      const scroll = () => {
        const target = document.getElementById(id);
        if (!target) return;
        const navOffset = 96;
        const top = target.getBoundingClientRect().top + window.scrollY - navOffset;
        window.scrollTo({ top: Math.max(0, top), behavior: "auto" });
      };

      window.requestAnimationFrame(scroll);
      window.setTimeout(scroll, 300);
    };

    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, []);

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
