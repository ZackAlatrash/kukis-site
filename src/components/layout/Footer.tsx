import { Linkedin } from "lucide-react";
import { footer, site } from "../../data/site";
import { Logo } from "../ui/Logo";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.07] bg-[#140d06] py-10 text-[#a48d76]">
      <div className="mx-auto flex w-full max-w-[1120px] flex-col items-center gap-4 px-6 text-sm md:flex-row md:justify-between">
        <Logo className="text-xl" biteClass="bg-[#140d06]" />
        <div className="text-center">
          {footer.blurb} · {footer.location} · {footer.lang}
        </div>
        <div className="flex items-center gap-4">
          <span>
            © {footer.year} {site.name} · KvK {footer.kvk}
          </span>
          <a
            href={footer.linkedin}
            aria-label="Kukis on LinkedIn"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/12 transition-colors hover:border-white/30 hover:text-[#FBF3E4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
          >
            <Linkedin size={16} aria-hidden />
          </a>
        </div>
      </div>

      {/* The legal documents and the demo, which the page never linked to. */}
      <nav
        aria-label="Footer"
        className="mx-auto mt-7 w-full max-w-[1120px] border-t border-white/[0.07] px-6 pt-6"
      >
        <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 text-[0.8125rem] md:justify-start">
          {footer.links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="rounded transition-colors hover:text-[#FBF3E4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </footer>
  );
}
