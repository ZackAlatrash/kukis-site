import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { AlertCircle, ArrowRight, CheckCircle } from "lucide-react";
import { CookieMascot } from "../ui/CookieMascot";
import { Turnstile } from "../ui/Turnstile";
import { demoRequest } from "../../data/site";
import {
  buildDemoRequestMailto,
  buildDemoRequestPayload,
  hasDemoRequestErrors,
  validateDemoRequest,
  type DemoRequestPayload,
  type DemoRequestValues,
} from "../../lib/demoRequest";

type DemoRequestStatus = "idle" | "submitting" | "success" | "error" | "mailto";
type DemoRequestFormValues = DemoRequestValues & {
  storeSize: string;
};
type DemoRequestField = keyof DemoRequestFormValues;

const initialValues: DemoRequestFormValues = {
  name: "",
  email: "",
  storeUrl: "",
  country: "",
  storeSize: "",
  message: "",
};

// Required fields in DOM order, with their input id and visible label — drives
// focus-on-first-error and the error summary.
const REQUIRED_FIELDS: { key: keyof DemoRequestValues; id: string; label: string }[] = [
  { key: "name", id: "demo-name", label: "Name" },
  { key: "email", id: "demo-email", label: "Email" },
  { key: "storeUrl", id: "demo-store-url", label: "Shopify store URL" },
  { key: "country", id: "demo-country", label: "Country" },
  { key: "message", id: "demo-message", label: "Message" },
];

// `demo-field` is the hook for the 16px rule in index.css that keeps iOS from
// zooming the viewport on focus. Don't drop it from a control.
const fieldBaseClass =
  "demo-field min-h-11 w-full rounded-[14px] border px-4 py-3.5 text-[0.9375rem] font-semibold text-cocoa shadow-[inset_0_1px_0_rgba(255,255,255,0.62)] transition-[background,border-color,box-shadow,transform] placeholder:text-crumb focus-visible:outline-2 focus-visible:outline-blueberry focus-visible:outline-offset-2 focus:-translate-y-px focus:shadow-[0_0_0_4px_rgba(47,111,176,0.30),inset_0_1px_0_rgba(255,255,255,0.72)]";
const labelClass = "text-[0.8125rem] font-bold text-cocoa";
const errorClass = "text-[0.75rem] font-semibold text-cherry-deep";

function getFieldClass(hasError: boolean) {
  return `${fieldBaseClass} ${
    hasError
      ? "border-cherry-deep/55 bg-cherry-deep/[0.045] focus:border-cherry-deep focus:shadow-[0_0_0_4px_rgba(200,58,44,0.13),inset_0_1px_0_rgba(255,255,255,0.72)]"
      : "border-chip/60 bg-milk/78 hover:border-chip/70 focus:border-blueberry focus:bg-cream"
  }`;
}

function getFieldStyle(hasError: boolean): CSSProperties | undefined {
  if (!hasError) return undefined;

  return {
    borderColor: "rgba(200, 58, 44, 0.9)",
    backgroundColor: "rgba(200, 58, 44, 0.045)",
    boxShadow:
      "inset 0 0 0 1.5px rgba(200, 58, 44, 0.72), inset 0 1px 0 rgba(255, 255, 255, 0.72)",
  };
}

function getDemoRequestValues(values: DemoRequestFormValues): DemoRequestValues {
  return {
    name: values.name,
    email: values.email,
    storeUrl: values.storeUrl,
    country: values.country,
    message: values.message,
  };
}

export function DemoRequestForm({
  headingId,
  onDone,
}: {
  headingId?: string;
  /** Closes the surrounding dialog from the confirmation's button. */
  onDone?: () => void;
}) {
  const [values, setValues] = useState<DemoRequestFormValues>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof DemoRequestValues, string>>>({});
  const [status, setStatus] = useState<DemoRequestStatus>("idle");
  const [lastAttemptedPayload, setLastAttemptedPayload] = useState<DemoRequestPayload | null>(
    null,
  );
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [rejectedSubmits, setRejectedSubmits] = useState(0);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  const submitted = status === "success";
  const firstName = values.name.trim().split(/\s+/)[0];

  // Bring the summary into view, not just into the DOM. The summary and the
  // per-field messages render *above* wherever the user is standing, and the
  // browser's scroll anchoring then compensates to hold the view steady — so on
  // a phone, where the submit button is pinned and reachable from the bottom of
  // the form, a rejected submit would otherwise scroll nothing and look inert.
  //
  // Keyed on a submit counter rather than on `errors`: identical errors twice in
  // a row must still scroll back, and `errors` also changes as fields are fixed,
  // which would yank the view mid-typing.
  useEffect(() => {
    if (rejectedSubmits === 0) return;

    const summary = errorSummaryRef.current;
    if (!summary) return;

    // Instant, not smooth: a smooth scroll started here doesn't survive the
    // relayout the new errors cause and lands short or not at all. An error the
    // user just asked for should arrive immediately regardless.
    summary.scrollIntoView({ block: "start" });
    // scrollIntoView above already put it in view; focus() would scroll again.
    summary.focus({ preventScroll: true });
  }, [rejectedSubmits]);

  // The form (and the submit button holding focus) unmounts on success, which
  // would drop focus to <body>. Move it to the confirmation so it's announced
  // and keyboard users stay inside the dialog.
  useEffect(() => {
    if (submitted) successRef.current?.focus();
  }, [submitted]);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;

    setValues((current) => ({
      ...current,
      [name as DemoRequestField]: value,
    }));

    if (name in errors) {
      setErrors((current) => {
        const next = { ...current };
        delete next[name as keyof DemoRequestValues];
        return next;
      });
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("idle");

    const requestValues = getDemoRequestValues(values);
    const nextErrors = validateDemoRequest(requestValues);
    setErrors(nextErrors);

    if (hasDemoRequestErrors(nextErrors)) {
      // Hands off to the effect above, which scrolls the summary into view and
      // focuses it so the failure is announced and the keyboard user lands on
      // the list of problems (WCAG 3.3.1 / 2.4.3).
      setRejectedSubmits((n) => n + 1);
      return;
    }

    setStatus("submitting");

    const payload = {
      ...buildDemoRequestPayload(requestValues),
      storeSize: values.storeSize.trim(),
    };
    setLastAttemptedPayload(payload);

    try {
      if (demoRequest.endpoint) {
        const response = await fetch(demoRequest.endpoint, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          // The token rides alongside the payload — it's proof-of-human for the
          // Function, not part of the demo request itself, so it's kept out of
          // `payload` (which also backs the mailto: fallback).
          body: JSON.stringify({ ...payload, turnstileToken }),
        });

        if (!response.ok) {
          throw new Error("Demo request submission failed.");
        }

        setStatus("success");
        return;
      }

      window.location.href = buildDemoRequestMailto(demoRequest.fallbackEmail, payload);
      setStatus("mailto");
    } catch {
      setStatus("error");
      // Tokens are single-use: a retry with the spent one would be rejected.
      setTurnstileReset((n) => n + 1);
    }
  };

  const isSubmitting = status === "submitting";
  const fallbackHref = lastAttemptedPayload
    ? buildDemoRequestMailto(demoRequest.fallbackEmail, lastAttemptedPayload)
    : `mailto:${encodeURIComponent(demoRequest.fallbackEmail)}`;

  return (
    <form
      onSubmit={handleSubmit}
      className="flex min-h-0 flex-1 flex-col font-sans text-cocoa sm:block sm:rounded-[24px]"
      noValidate
    >
      <div className="flex min-h-0 flex-1 flex-col sm:grid sm:gap-5 lg:grid-cols-[0.82fr_1.18fr]">
        <aside className="relative flex shrink-0 flex-col overflow-hidden px-4 pb-4 pt-5 sm:rounded-[20px] sm:p-5 md:p-7">
          <div
            aria-hidden
            className="absolute -right-14 -top-16 h-52 w-52 rounded-full bg-amber/25 blur-[80px]"
          />
          <div className="relative flex h-full flex-col">
            <p className="text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-amber">
              {demoRequest.replyNote}
            </p>
            {/* pr-12 clears the close button, which overlaps this row on phones */}
            <h2
              id={headingId}
              className="mt-1.5 pr-12 font-display text-[1.75rem] font-extrabold leading-[1.02] tracking-[-0.03em] text-[#FBF3E4] sm:mt-2.5 sm:max-w-[11ch] sm:pr-0 sm:text-[2.125rem] sm:leading-[0.98] md:text-[2.625rem]"
            >
              {demoRequest.heading}
            </h2>
            <p className="mt-2 max-w-[34ch] text-[0.875rem] font-medium leading-5 text-[#dccbb0] sm:mt-3 sm:text-[0.9375rem] sm:leading-6">
              {demoRequest.intro}
            </p>

            {/* The mascot's pupils track the cursor — there's no cursor on touch,
                so on a phone it's ~300px of scroll before the first field in
                exchange for an interaction that can't happen. */}
            <div className="mb-2 mt-12 hidden flex-1 items-center justify-center sm:flex md:my-8">
              <CookieMascot
                bubble={submitted ? "On it!" : "I'll take a look."}
                mood={submitted ? "happy" : "idle"}
                className="mx-auto w-[124px] md:w-[172px]"
              />
            </div>
          </div>
        </aside>

        <div className="flex min-h-0 flex-1 flex-col rounded-t-[20px] bg-cream shadow-[0_26px_60px_-24px_rgba(0,0,0,0.55)] ring-1 ring-black/[0.04] sm:block sm:rounded-[20px] sm:border sm:border-white/60 sm:p-4 md:p-5">
          {submitted ? (
            <div
              ref={successRef}
              tabIndex={-1}
              role="status"
              className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-10 text-center focus:outline-none sm:min-h-[25rem]"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-consent-ink text-white">
                <CheckCircle size={32} strokeWidth={2.5} aria-hidden />
              </span>
              <h3 className="mt-6 font-display text-[1.75rem] font-extrabold leading-tight text-cocoa">
                {demoRequest.successTitle}
              </h3>
              <p className="mt-3 max-w-[34ch] text-[0.9375rem] leading-6 text-cocoa-soft">
                {firstName ? `Thanks, ${firstName}. ` : "Thanks. "}
                {demoRequest.successBody}
              </p>
              <p className="mt-2.5 text-[0.8125rem] font-medium text-crumb">
                We'll reply to {values.email.trim()}
              </p>
              <button
                type="button"
                onClick={onDone}
                className="mt-8 inline-flex items-center justify-center rounded-full bg-cherry-deep px-6 py-3 text-[0.9375rem] font-semibold text-white transition-[transform,box-shadow] hover:-translate-y-px hover:shadow-[var(--shadow-hover)] active:translate-y-0"
              >
                {demoRequest.successClose}
              </button>
            </div>
          ) : (
            <>
          {/* The one scroll container on a phone: the sheet itself doesn't
              scroll, so the header stays put above and the submit bar below.
              overscroll-contain stops a flick at either end from chaining out
              to the page behind. From `sm:` up the dialog scrolls as before and
              this is an ordinary block. */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-4 sm:overflow-visible sm:p-0">
          {hasDemoRequestErrors(errors) ? (
            <div
              ref={errorSummaryRef}
              tabIndex={-1}
              className="mb-4 scroll-mt-4 rounded-2xl border border-cherry-deep/40 bg-cherry-deep/[0.06] p-4 focus-visible:outline-2 focus-visible:outline-cherry-deep focus-visible:outline-offset-2"
            >
              <p className="text-[0.8125rem] font-bold text-cherry-deep">
                Please fix the highlighted{" "}
                {REQUIRED_FIELDS.filter((field) => errors[field.key]).length === 1
                  ? "field"
                  : "fields"}{" "}
                to continue.
              </p>
              <ul className="mt-2 space-y-1">
                {REQUIRED_FIELDS.filter((field) => errors[field.key]).map((field) => (
                  <li key={field.key}>
                    <a
                      href={`#${field.id}`}
                      onClick={(event) => {
                        event.preventDefault();
                        document.getElementById(field.id)?.focus();
                      }}
                      className="text-[0.8125rem] font-semibold text-cherry-deep underline underline-offset-2"
                    >
                      {field.label}: {errors[field.key]}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <p className="mb-3 text-[0.75rem] font-semibold text-cocoa-soft">
            Required fields are marked <span className="text-cherry-deep">*</span>.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2.5">
          <label htmlFor="demo-name" className={labelClass}>
            Name <span aria-hidden="true" className="text-cherry-deep">*</span>
          </label>
          <input
            id="demo-name"
            name="name"
            value={values.name}
            onChange={handleChange}
            required
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "demo-name-error" : undefined}
            autoComplete="name"
            enterKeyHint="next"
            className={getFieldClass(Boolean(errors.name))}
            style={getFieldStyle(Boolean(errors.name))}
          />
          {errors.name ? (
            <p id="demo-name-error" className={errorClass}>
              {errors.name}
            </p>
          ) : null}
        </div>

        <div className="space-y-2.5">
          <label htmlFor="demo-email" className={labelClass}>
            Email <span aria-hidden="true" className="text-cherry-deep">*</span>
          </label>
          <input
            id="demo-email"
            name="email"
            type="email"
            value={values.email}
            onChange={handleChange}
            required
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "demo-email-error" : undefined}
            autoComplete="email"
            // Phones capitalise and autocorrect free text by default, which is
            // wrong for every one of these: an address is lowercase and not a word.
            inputMode="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="next"
            className={getFieldClass(Boolean(errors.email))}
            style={getFieldStyle(Boolean(errors.email))}
          />
          {errors.email ? (
            <p id="demo-email-error" className={errorClass}>
              {errors.email}
            </p>
          ) : null}
        </div>

        <div className="space-y-2.5 sm:col-span-2">
          <label htmlFor="demo-store-url" className={labelClass}>
            Shopify store URL <span aria-hidden="true" className="text-cherry-deep">*</span>
          </label>
          <input
            id="demo-store-url"
            name="storeUrl"
            // type=url gets the keyboard with the "/" and ".com" keys. It can't
            // reject a bare domain here — the form is noValidate, so
            // validateDemoRequest is the only gate and it prepends the scheme.
            type="url"
            value={values.storeUrl}
            onChange={handleChange}
            required
            aria-invalid={Boolean(errors.storeUrl)}
            aria-describedby={errors.storeUrl ? "demo-store-url-error" : "demo-store-url-helper"}
            autoComplete="url"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="next"
            className={getFieldClass(Boolean(errors.storeUrl))}
            style={getFieldStyle(Boolean(errors.storeUrl))}
          />
          {errors.storeUrl ? (
            <p id="demo-store-url-error" className={errorClass}>
              {errors.storeUrl}
            </p>
          ) : (
            <p id="demo-store-url-helper" className="text-[0.75rem] font-semibold text-cocoa-soft">
              {demoRequest.helper}
            </p>
          )}
        </div>

        <div className="space-y-2.5">
          <label htmlFor="demo-country" className={labelClass}>
            Country <span aria-hidden="true" className="text-cherry-deep">*</span>
          </label>
          <select
            id="demo-country"
            name="country"
            value={values.country}
            onChange={handleChange}
            required
            aria-invalid={Boolean(errors.country)}
            aria-describedby={errors.country ? "demo-country-error" : undefined}
            autoComplete="country-name"
            className={getFieldClass(Boolean(errors.country))}
            style={getFieldStyle(Boolean(errors.country))}
          >
            <option value="">Choose a country</option>
            {demoRequest.countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
          {errors.country ? (
            <p id="demo-country-error" className={errorClass}>
              {errors.country}
            </p>
          ) : null}
        </div>

        <div className="space-y-2.5">
          <label htmlFor="demo-store-size" className={labelClass}>
            Store size
          </label>
          <select
            id="demo-store-size"
            name="storeSize"
            value={values.storeSize}
            onChange={handleChange}
            className={getFieldClass(false)}
          >
            <option value="">Optional</option>
            {demoRequest.storeSizes.map((storeSize) => (
              <option key={storeSize} value={storeSize}>
                {storeSize}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2.5 sm:col-span-2">
          <label htmlFor="demo-message" className={labelClass}>
            Message <span aria-hidden="true" className="text-cherry-deep">*</span>
          </label>
          <textarea
            id="demo-message"
            name="message"
            value={values.message}
            onChange={handleChange}
            required
            // Starting height where field-sizing isn't supported; elsewhere the
            // min-height below sets the floor and it grows from there.
            rows={3}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? "demo-message-error" : undefined}
            enterKeyHint="enter"
            className={`${getFieldClass(Boolean(errors.message))} min-h-[104px] resize-y sm:min-h-[132px]`}
            style={getFieldStyle(Boolean(errors.message))}
          />
          {errors.message ? (
            <p id="demo-message-error" className={errorClass}>
              {errors.message}
            </p>
          ) : null}
        </div>
          </div>

          {demoRequest.turnstileSiteKey ? (
            <Turnstile
              siteKey={demoRequest.turnstileSiteKey}
              onToken={setTurnstileToken}
              resetSignal={turnstileReset}
            />
          ) : null}
          </div>

          {/* Pinned to the bottom of the sheet on a phone, so the primary action
              is reachable without scrolling the form to its end. Pinned with
              flex rather than `position: fixed`, which fights the keyboard.
              pb clears the home indicator without stealing padding on devices
              that have no inset. */}
          <div className="shrink-0 border-t border-chip/15 bg-cream px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:mt-5 sm:border-0 sm:bg-transparent sm:p-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <p className="text-[0.6875rem] font-semibold leading-4 text-cocoa-soft sm:text-[0.75rem] sm:leading-5">
              {demoRequest.privacy}
            </p>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-cherry-deep px-5 py-3 text-[0.9375rem] font-semibold text-white transition-[transform,box-shadow] hover:-translate-y-px hover:shadow-[var(--shadow-hover)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isSubmitting ? "Sending..." : "Request demo"}
              <ArrowRight size={18} aria-hidden />
            </button>
          </div>

          {/* success takes over the panel above; these are the fallback paths.
              The margin is conditional rather than the box being hidden: this is
              a live region, and display:none can cost the announcement. Empty, it
              has no margin and no height, so it costs the pinned bar nothing. */}
          <div aria-live="polite" className="[&:not(:empty)]:mt-4 sm:[&:not(:empty)]:mt-5">
            {status === "mailto" ? (
              <StatusPanel
                tone="success"
                icon={<CheckCircle size={20} aria-hidden />}
                title={demoRequest.mailtoTitle}
                body={demoRequest.mailtoBody}
              />
            ) : null}
            {status === "error" ? (
              <StatusPanel
                tone="error"
                icon={<AlertCircle size={20} aria-hidden />}
                title={demoRequest.errorTitle}
                body={demoRequest.errorBody}
                actionHref={fallbackHref}
                actionLabel="Email us instead"
              />
            ) : null}
          </div>
          </div>
            </>
          )}
        </div>
      </div>
    </form>
  );
}

function StatusPanel({
  tone,
  icon,
  title,
  body,
  actionHref,
  actionLabel,
}: {
  tone: "success" | "error";
  icon: React.ReactNode;
  title: string;
  body: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  const toneClass =
    tone === "success"
      ? "border-blueberry/25 bg-blueberry/10 text-blueberry"
      : "border-cherry-deep/25 bg-cherry-deep/10 text-cherry-deep";

  return (
    <div className={`flex gap-3 rounded-2xl border p-4 ${toneClass}`}>
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div>
        <p className="text-[0.875rem] font-bold">{title}</p>
        <p className="mt-1 text-[0.8125rem] font-medium leading-5 text-cocoa-soft">{body}</p>
        {actionHref && actionLabel ? (
          <a
            href={actionHref}
            className="mt-3 inline-flex items-center justify-center rounded-full bg-cherry-deep px-4 py-2 text-[0.8125rem] font-semibold text-white transition-[transform,box-shadow] hover:-translate-y-px hover:shadow-[var(--shadow-hover)]"
          >
            {actionLabel}
          </a>
        ) : null}
      </div>
    </div>
  );
}
