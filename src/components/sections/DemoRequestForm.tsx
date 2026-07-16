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

const fieldBaseClass =
  "demo-field w-full rounded-[14px] border px-4 py-3.5 text-[0.9375rem] font-semibold text-cocoa shadow-[inset_0_1px_0_rgba(255,255,255,0.62)] transition-[background,border-color,box-shadow,transform] placeholder:text-crumb focus-visible:outline-2 focus-visible:outline-blueberry focus-visible:outline-offset-2 focus:-translate-y-px focus:shadow-[0_0_0_4px_rgba(47,111,176,0.30),inset_0_1px_0_rgba(255,255,255,0.72)]";
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
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  const submitted = status === "success";
  const firstName = values.name.trim().split(/\s+/)[0];

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
      // Move focus to the error summary so the failure is announced and the
      // keyboard user lands on the list of problems (WCAG 3.3.1 / 2.4.3).
      requestAnimationFrame(() => errorSummaryRef.current?.focus());
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
      className="rounded-[24px] font-sans text-cocoa"
      noValidate
    >
      <div className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
        <aside className="relative flex flex-col overflow-hidden rounded-[20px] p-5 md:p-7">
          <div
            aria-hidden
            className="absolute -right-14 -top-16 h-52 w-52 rounded-full bg-amber/25 blur-[80px]"
          />
          <div className="relative flex h-full flex-col">
            <p className="text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-amber">
              {demoRequest.replyNote}
            </p>
            <h2
              id={headingId}
              className="mt-2.5 max-w-[11ch] font-display text-[2.125rem] font-extrabold leading-[0.98] tracking-[-0.03em] text-[#FBF3E4] md:text-[2.625rem]"
            >
              {demoRequest.heading}
            </h2>
            <p className="mt-3 max-w-[34ch] text-[0.9375rem] font-medium leading-6 text-[#dccbb0]">
              {demoRequest.intro}
            </p>

            <div className="mb-2 mt-12 flex flex-1 items-center justify-center md:my-8">
              <CookieMascot
                bubble={submitted ? "On it!" : "I'll take a look."}
                mood={submitted ? "happy" : "idle"}
                className="mx-auto w-[124px] md:w-[172px]"
              />
            </div>
          </div>
        </aside>

        <div className="rounded-[20px] border border-white/60 bg-cream p-4 shadow-[0_26px_60px_-24px_rgba(0,0,0,0.55)] ring-1 ring-black/[0.04] md:p-5">
          {submitted ? (
            <div
              ref={successRef}
              tabIndex={-1}
              role="status"
              className="flex min-h-[25rem] flex-col items-center justify-center px-6 py-10 text-center focus:outline-none"
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
          {hasDemoRequestErrors(errors) ? (
            <div
              ref={errorSummaryRef}
              tabIndex={-1}
              className="mb-4 rounded-2xl border border-cherry-deep/40 bg-cherry-deep/[0.06] p-4 focus-visible:outline-2 focus-visible:outline-cherry-deep focus-visible:outline-offset-2"
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
            value={values.storeUrl}
            onChange={handleChange}
            required
            aria-invalid={Boolean(errors.storeUrl)}
            aria-describedby={errors.storeUrl ? "demo-store-url-error" : "demo-store-url-helper"}
            autoComplete="url"
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
            rows={5}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? "demo-message-error" : undefined}
            className={`${getFieldClass(Boolean(errors.message))} min-h-[132px] resize-y`}
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

          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[0.75rem] font-semibold leading-5 text-cocoa-soft">
              {demoRequest.privacy}
            </p>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-cherry-deep px-5 py-3 text-[0.9375rem] font-semibold text-white transition-[transform,box-shadow] hover:-translate-y-px hover:shadow-[var(--shadow-hover)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isSubmitting ? "Sending..." : "Request demo"}
              <ArrowRight size={18} aria-hidden />
            </button>
          </div>

          {/* success takes over the panel above; these are the fallback paths */}
          <div aria-live="polite" className="mt-5">
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
