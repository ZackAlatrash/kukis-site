import { useState, type CSSProperties, type ChangeEvent, type FormEvent } from "react";
import { AlertCircle, ArrowRight, CheckCircle } from "lucide-react";
import { CookieMascot } from "../ui/CookieMascot";
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

const fieldBaseClass =
  "demo-field w-full rounded-[14px] border px-4 py-3.5 text-[15px] font-semibold text-cocoa shadow-[inset_0_1px_0_rgba(255,255,255,0.62)] outline-none transition-[background,border-color,box-shadow,transform] placeholder:text-crumb/80 focus:-translate-y-px focus:shadow-[0_0_0_4px_rgba(47,111,176,0.12),inset_0_1px_0_rgba(255,255,255,0.72)]";
const labelClass = "text-[13px] font-bold text-cocoa";
const errorClass = "text-[12px] font-semibold text-cherry-deep";

function getFieldClass(hasError: boolean) {
  return `${fieldBaseClass} ${
    hasError
      ? "border-cherry-deep/55 bg-cherry-deep/[0.045] focus:border-cherry-deep focus:shadow-[0_0_0_4px_rgba(200,58,44,0.13),inset_0_1px_0_rgba(255,255,255,0.72)]"
      : "border-chip/20 bg-milk/78 hover:border-chip/34 focus:border-blueberry focus:bg-cream"
  }`;
}

function getFieldStyle(hasError: boolean): CSSProperties | undefined {
  if (!hasError) return undefined;

  return {
    borderColor: "rgba(200, 58, 44, 0.62)",
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

export function DemoRequestForm({ headingId }: { headingId?: string }) {
  const [values, setValues] = useState<DemoRequestFormValues>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof DemoRequestValues, string>>>({});
  const [status, setStatus] = useState<DemoRequestStatus>("idle");
  const [lastAttemptedPayload, setLastAttemptedPayload] = useState<DemoRequestPayload | null>(
    null,
  );

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
          body: JSON.stringify(payload),
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
        <aside className="relative overflow-hidden rounded-[20px] border border-chip/15 bg-milk/96 p-5 shadow-[0_18px_44px_-26px_rgba(0,0,0,0.38)] md:p-6">
          <div
            aria-hidden
            className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-amber/20 blur-3xl"
          />
          <div className="relative">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-blueberry">
              {demoRequest.replyNote}
            </p>
            <h2
              id={headingId}
              className="mt-2 max-w-[9ch] font-display text-[34px] font-extrabold leading-[0.98] tracking-[-0.03em] text-cocoa md:text-[40px]"
            >
              {demoRequest.heading}
            </h2>
            <p className="mt-3 text-[15px] font-medium leading-6 text-cocoa-soft">
              {demoRequest.intro}
            </p>

            <div className="mt-5 flex min-h-[132px] items-end justify-center pt-9 md:mt-7 md:min-h-[210px]">
              <CookieMascot
                bubble="I'll take a look."
                mood="idle"
                className="mx-auto w-[112px] md:w-[164px]"
              />
            </div>

            <div className="mt-6 hidden gap-2 text-[12.5px] font-semibold text-cocoa-soft sm:grid sm:grid-cols-3 lg:grid-cols-1">
              <span className="rounded-full border border-chip/15 bg-cream px-3 py-2">
                Manual reply
              </span>
              <span className="rounded-full border border-chip/15 bg-cream px-3 py-2">
                No calendar spam
              </span>
              <span className="rounded-full border border-chip/15 bg-cream px-3 py-2">
                Store-specific demo
              </span>
            </div>
          </div>
        </aside>

        <div className="rounded-[20px] border border-chip/12 bg-cream/96 p-4 shadow-[0_18px_44px_-26px_rgba(0,0,0,0.38)] md:p-5">
          <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2.5">
          <label htmlFor="demo-name" className={labelClass}>
            Name
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
            Email
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
            Shopify store URL
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
            <p id="demo-store-url-helper" className="text-[12px] font-semibold text-cocoa-soft">
              {demoRequest.helper}
            </p>
          )}
        </div>

        <div className="space-y-2.5">
          <label htmlFor="demo-country" className={labelClass}>
            Country
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
            Message
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

          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[12px] font-semibold leading-5 text-cocoa-soft">
              {demoRequest.privacy}
            </p>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-cherry-deep px-5 py-3 text-[15px] font-semibold text-white transition-[background,transform,box-shadow] hover:-translate-y-px hover:bg-cherry hover:shadow-[var(--shadow-hover)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isSubmitting ? "Sending..." : "Request demo"}
              <ArrowRight size={18} aria-hidden />
            </button>
          </div>

          <div aria-live="polite" className="mt-5">
            {status === "success" ? (
              <StatusPanel
                tone="success"
                icon={<CheckCircle size={20} aria-hidden />}
                title={demoRequest.successTitle}
                body={demoRequest.successBody}
              />
            ) : null}
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
        <p className="text-[14px] font-bold">{title}</p>
        <p className="mt-1 text-[13px] font-medium leading-5 text-cocoa-soft">{body}</p>
        {actionHref && actionLabel ? (
          <a
            href={actionHref}
            className="mt-3 inline-flex items-center justify-center rounded-full bg-cherry-deep px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-cherry"
          >
            {actionLabel}
          </a>
        ) : null}
      </div>
    </div>
  );
}
