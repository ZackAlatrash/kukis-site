import { useEffect, useRef } from "react";

const SCRIPT_ID = "cf-turnstile";
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  remove: (id?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/** Load the Turnstile script once, shared across mounts. */
let scriptPromise: Promise<void> | null = null;
function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID);
    const script = (existing as HTMLScriptElement | null) ?? document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () => reject(new Error("Turnstile failed to load")));
    if (!existing) document.head.appendChild(script);
  });

  return scriptPromise;
}

/**
 * Cloudflare Turnstile — proves the submitter is human without cookies or
 * tracking, which is why it's here rather than reCAPTCHA: a consent-first site
 * shouldn't ship Google tracking to protect its own form.
 *
 * In "managed" mode this is usually invisible. It renders when the dialog opens,
 * so the token is long resolved by the time anyone finishes typing.
 */
export function Turnstile({
  siteKey,
  onToken,
  onError,
  resetSignal = 0,
}: {
  siteKey: string;
  onToken: (token: string) => void;
  onError?: () => void;
  /** Bump to force a fresh token — Turnstile tokens are single-use. */
  resetSignal?: number;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadTurnstile()
      .then(() => {
        if (cancelled || !holder.current || !window.turnstile) return;
        widgetId.current = window.turnstile.render(holder.current, {
          sitekey: siteKey,
          theme: "light",
          callback: (token: string) => onToken(token),
          // token expired or the challenge errored — drop it so we don't send a stale one
          "expired-callback": () => onToken(""),
          "error-callback": () => {
            onToken("");
            onError?.();
          },
        });
      })
      .catch(() => onError?.());

    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch {
          /* widget already gone */
        }
        widgetId.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  // A used token can't be replayed, so a failed submit needs a fresh one.
  useEffect(() => {
    if (resetSignal > 0 && widgetId.current && window.turnstile) {
      onToken("");
      window.turnstile.reset(widgetId.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);

  return <div ref={holder} className="mt-4" />;
}
