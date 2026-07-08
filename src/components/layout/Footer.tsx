import { footer, site } from "../../data/site";
import { Logo } from "../ui/Logo";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.07] py-10 text-[#a48d76]">
      <div className="mx-auto flex w-full max-w-[1120px] flex-col items-center gap-4 px-6 text-sm md:flex-row md:justify-between">
        <Logo className="text-xl" biteClass="bg-[#140d06]" />
        <div className="text-center">
          {footer.blurb} · {footer.location} · {footer.lang}
        </div>
        <div>
          © {footer.year} {site.name}
        </div>
      </div>
    </footer>
  );
}
