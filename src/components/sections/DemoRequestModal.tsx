import { useEffect } from "react";
import { X } from "lucide-react";
import { DemoRequestForm } from "./DemoRequestForm";
import { CookieCrumbBackdrop } from "../ui/CookieCrumbBackdrop";

export function DemoRequestModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#140d06]/78 px-4 py-5 backdrop-blur-md"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-request-title"
        className="relative max-h-[calc(100vh-40px)] w-full max-w-[980px] overflow-y-auto rounded-[28px] border border-white/10 text-[#FBF3E4] shadow-[0_28px_90px_rgba(0,0,0,0.44)]"
        style={{
          background:
            "linear-gradient(180deg, #221610 0%, #191108 48%, #140d06 100%)",
        }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[38%] h-[520px] w-[900px] max-w-[130%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[130px]"
          style={{
            background: "radial-gradient(circle, rgba(232,176,75,0.18) 0%, transparent 65%)",
          }}
        />
        <CookieCrumbBackdrop opacityScale={0.9} sizeScale={0.92} />
        <button
          type="button"
          aria-label="Close demo request form"
          onClick={onClose}
          className="absolute right-3 top-3 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-cream text-cocoa shadow-[0_10px_30px_rgba(0,0,0,0.24)] transition-colors hover:bg-milk focus-visible:outline-2 focus-visible:outline-blueberry focus-visible:outline-offset-2"
        >
          <X size={18} aria-hidden />
        </button>
        <div className="relative z-10 p-3 md:p-4">
          <DemoRequestForm headingId="demo-request-title" />
        </div>
      </div>
    </div>
  );
}
