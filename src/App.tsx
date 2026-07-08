import { useCallback, useEffect, useState } from "react";
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
import { DemoRequestModal } from "./components/sections/DemoRequestModal";
import { site } from "./data/site";

export default function App() {
  const [demoRequestOpen, setDemoRequestOpen] = useState(false);

  const openDemoRequest = useCallback(() => {
    setDemoRequestOpen(true);
  }, []);

  const closeDemoRequest = useCallback(() => {
    setDemoRequestOpen(false);

    if (window.location.hash === site.demoHref) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }
  }, []);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const link = target?.closest<HTMLAnchorElement>(`a[href="${site.demoHref}"]`);

      if (!link) return;

      event.preventDefault();
      openDemoRequest();
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [openDemoRequest]);

  useEffect(() => {
    const openFromHash = () => {
      if (window.location.hash === site.demoHref) {
        openDemoRequest();
      }
    };

    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [openDemoRequest]);

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
      <DemoRequestModal open={demoRequestOpen} onClose={closeDemoRequest} />
    </>
  );
}
