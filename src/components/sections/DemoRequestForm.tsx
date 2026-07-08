import { useState, type ChangeEvent, type FormEvent } from "react";
import { AlertCircle, ArrowRight, CheckCircle } from "lucide-react";
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

const fieldClass =
  "w-full rounded-xl border border-chip/25 bg-milk px-3.5 py-3 text-[14px] font-medium text-cocoa outline-none transition-colors placeholder:text-crumb/70 focus:border-blueberry";
const labelClass = "text-[13px] font-semibold text-cocoa";
const errorClass = "text-[12px] font-medium text-cherry-deep";

function getDemoRequestValues(values: DemoRequestFormValues): DemoRequestValues {
  return {
    name: values.name,
    email: values.email,
    storeUrl: values.storeUrl,
    country: values.country,
    message: values.message,
  };
}

export function DemoRequestForm() {
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
      className="rounded-[24px] border border-chip/15 bg-cream p-5 text-cocoa shadow-[0_20px_54px_rgba(0,0,0,0.34)] md:p-7"
      noValidate
    >
      <div>
        <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-blueberry">
          {demoRequest.replyNote}
        </p>
        <h2 className="mt-2 font-display text-[32px] font-extrabold leading-tight text-cocoa">
          {demoRequest.heading}
        </h2>
        <p className="mt-2 text-[15px] font-medium leading-6 text-cocoa-soft">
          {demoRequest.intro}
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
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
            className={fieldClass}
          />
          {errors.name ? (
            <p id="demo-name-error" className={errorClass}>
              {errors.name}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
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
            className={fieldClass}
          />
          {errors.email ? (
            <p id="demo-email-error" className={errorClass}>
              {errors.email}
            </p>
          ) : null}
        </div>

        <div className="space-y-2 md:col-span-2">
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
            className={fieldClass}
          />
          {errors.storeUrl ? (
            <p id="demo-store-url-error" className={errorClass}>
              {errors.storeUrl}
            </p>
          ) : (
            <p id="demo-store-url-helper" className="text-[12px] font-medium text-cocoa-soft">
              {demoRequest.helper}
            </p>
          )}
        </div>

        <div className="space-y-2">
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
            className={fieldClass}
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

        <div className="space-y-2">
          <label htmlFor="demo-store-size" className={labelClass}>
            Store size
          </label>
          <select
            id="demo-store-size"
            name="storeSize"
            value={values.storeSize}
            onChange={handleChange}
            className={fieldClass}
          >
            <option value="">Optional</option>
            {demoRequest.storeSizes.map((storeSize) => (
              <option key={storeSize} value={storeSize}>
                {storeSize}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2 md:col-span-2">
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
            className={fieldClass}
          />
          {errors.message ? (
            <p id="demo-message-error" className={errorClass}>
              {errors.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[12px] font-medium leading-5 text-cocoa-soft">{demoRequest.privacy}</p>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-cherry-deep px-5 py-3 text-[15px] font-semibold text-white transition-[background,transform,box-shadow] hover:-translate-y-px hover:bg-cherry hover:shadow-[var(--shadow-hover)] disabled:cursor-not-allowed disabled:opacity-60"
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
