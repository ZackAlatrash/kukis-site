import { useEffect } from "react";
import { X } from "lucide-react";
import { DemoRequestForm } from "./DemoRequestForm";

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#140d06]/72 px-4 py-5 backdrop-blur-md"
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
        className="relative max-h-[calc(100vh-40px)] w-full max-w-[760px] overflow-y-auto rounded-[28px] shadow-[0_28px_90px_rgba(0,0,0,0.44)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close demo request form"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-chip/20 bg-cream/95 text-cocoa shadow-[0_10px_30px_rgba(57,38,23,0.16)] transition-colors hover:bg-milk focus-visible:outline-2 focus-visible:outline-blueberry focus-visible:outline-offset-2"
        >
          <X size={18} aria-hidden />
        </button>
        <DemoRequestForm headingId="demo-request-title" />
      </div>
    </div>
  );
}
