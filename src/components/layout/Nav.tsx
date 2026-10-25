import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { site } from "../../data/site";
import { Button } from "../ui/Button";
import { Logo } from "../ui/Logo";
import { cn } from "../../lib/cn";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Native hash links scroll to the section but leave keyboard focus on the link.
  // Move focus to the target so keyboard users continue from the section (WCAG 2.4.3).
  const focusSection = (href: string) => {
    if (href === site.demoHref || !href.startsWith("#")) return;
    const el = document.getElementById(href.slice(1));
    if (!el) return;
    el.setAttribute("tabindex", "-1");
    requestAnimationFrame(() => el.focus({ preventScroll: true }));
  };

  return (
    <nav
      className={cn(
        "sticky top-0 z-40 transition-colors duration-200",
        scrolled ? "bg-milk/80 backdrop-blur-md" : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-[70px] w-full max-w-[1120px] items-center justify-between px-6">
        <a href="#top" aria-label="Kukis home">
          <Logo />
        </a>

        <div className="hidden items-center gap-7 text-[0.9375rem] lg:flex">
          {site.nav.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => focusSection(l.href)}
              className="text-cocoa transition-colors hover:text-blueberry"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-2.5 lg:flex">
          <Button href={site.demoHref} variant="ghost">
            Book a demo
          </Button>
          <Button href={site.installHref}>{site.installLabel}</Button>
        </div>

        <button
          className="flex h-11 w-11 items-center justify-center rounded-full lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
        </button>
      </div>

      {open && (
        <div id="mobile-menu" className="border-t border-chip/15 bg-milk px-6 py-4 lg:hidden">
          <div className="flex flex-col gap-1">
            {site.nav.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-lg py-2.5 text-cocoa"
                onClick={() => {
                  setOpen(false);
                  focusSection(l.href);
                }}
              >
                {l.label}
              </a>
            ))}
            <Button href={site.installHref} className="mt-3 w-full">
              {site.installLabel}
            </Button>
            <Button href={site.demoHref} variant="ghost" className="mt-2 w-full">
              Book a demo
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
