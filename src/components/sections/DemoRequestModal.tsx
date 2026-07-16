import { useEffect, useRef, type RefObject } from "react";
import { X } from "lucide-react";
import { DemoRequestForm } from "./DemoRequestForm";
import { CookieCrumbBackdrop } from "../ui/CookieCrumbBackdrop";

// `iframe` matters: Turnstile renders one, and an iframe is focusable. Leave it
// out and Tab walks straight through the widget and escapes the dialog.
const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),iframe,[tabindex]:not([tabindex="-1"])';

export function DemoRequestModal({
  open,
  onClose,
  backgroundRef,
}: {
  open: boolean;
  onClose: () => void;
  /** The page content behind the modal; made `inert` while the dialog is open. */
  backgroundRef: RefObject<HTMLElement | null>;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    // Remember what had focus so we can restore it when the dialog closes.
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const background = backgroundRef.current;
    const dialog = dialogRef.current;

    // Take the page behind the dialog out of the focus order and a11y tree.
    if (background) background.inert = true;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Move focus into the dialog; the container is focusable (tabIndex -1) so the
    // dialog's accessible name (aria-labelledby) is announced on open.
    dialog?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null || el === dialog);
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeEl = document.activeElement;

      if (event.shiftKey && (activeEl === first || activeEl === dialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeEl === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      // Restore the background BEFORE returning focus — a .focus() call on an
      // element inside an `inert` subtree is a no-op.
      if (background) background.inert = false;
      previouslyFocused?.focus();
    };
  }, [open, onClose, backgroundRef]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center bg-[#140d06]/78 backdrop-blur-md sm:items-center sm:px-4 sm:py-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Phones get a full-screen sheet, not a centered box: a centered dialog
          forces scrolling inside a viewport smaller than the one available, and
          surrounds a half-filled form with a tappable dismiss target. The sheet
          owns no scrolling itself — the form scrolls its own field area — so the
          close button below stays pinned instead of scrolling away. From `sm:`
          up this is the original centered dialog. */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-request-title"
        tabIndex={-1}
        className="relative flex h-dvh w-full flex-col overflow-hidden border-white/10 text-[#FBF3E4] shadow-[0_28px_90px_rgba(0,0,0,0.44)] focus:outline-none sm:block sm:h-auto sm:max-h-[calc(100dvh-40px)] sm:max-w-[980px] sm:overflow-y-auto sm:rounded-[28px] sm:border"
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
          className="absolute right-3 top-3 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-cream text-cocoa shadow-[0_10px_30px_rgba(0,0,0,0.24)] transition-colors hover:bg-milk focus-visible:outline-2 focus-visible:outline-blueberry focus-visible:outline-offset-2 sm:h-10 sm:w-10"
        >
          <X size={18} aria-hidden />
        </button>
        <div className="relative z-10 flex min-h-0 flex-1 flex-col sm:block sm:p-3 md:p-4">
          <DemoRequestForm headingId="demo-request-title" onDone={onClose} />
        </div>
      </div>
    </div>
  );
}
