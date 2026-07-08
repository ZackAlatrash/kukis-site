export type DemoRequestValues = {
  name: string;
  email: string;
  storeUrl: string;
  country: string;
  message: string;
};

export type DemoRequestErrors = Partial<Record<keyof DemoRequestValues, string>>;

export type DemoRequestPayload = DemoRequestValues & {
  submittedAt: string;
  source: "kukis-site";
};

const requiredMessages: Record<keyof DemoRequestValues, string> = {
  name: "Enter your name.",
  email: "Enter a work email.",
  storeUrl: "Enter your Shopify store URL.",
  country: "Choose a country.",
  message: "Tell us what we should look at.",
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeStoreUrl(storeUrl: string): string {
  const trimmed = storeUrl.trim();

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function isValidStoreUrl(storeUrl: string): boolean {
  try {
    const url = new URL(normalizeStoreUrl(storeUrl));

    return Boolean(url.hostname.includes(".") && !/\s/.test(url.hostname));
  } catch {
    return false;
  }
}

export function validateDemoRequest(values: DemoRequestValues): DemoRequestErrors {
  const errors: DemoRequestErrors = {};

  for (const field of Object.keys(requiredMessages) as Array<keyof DemoRequestValues>) {
    if (!values[field].trim()) {
      errors[field] = requiredMessages[field];
    }
  }

  if (!errors.email && !emailPattern.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!errors.storeUrl && !isValidStoreUrl(values.storeUrl)) {
    errors.storeUrl = "Enter a valid store URL or domain.";
  }

  return errors;
}

export function hasDemoRequestErrors(errors: DemoRequestErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function buildDemoRequestPayload(values: DemoRequestValues): DemoRequestPayload {
  return {
    name: values.name.trim(),
    email: values.email.trim(),
    storeUrl: normalizeStoreUrl(values.storeUrl),
    country: values.country.trim(),
    message: values.message.trim(),
    submittedAt: new Date().toISOString(),
    source: "kukis-site",
  };
}

export function buildDemoRequestMailto(email: string, payload: DemoRequestPayload): string {
  const subject = `Kukis demo request from ${payload.name}`;
  const body = [
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    `Store URL: ${payload.storeUrl}`,
    `Country: ${payload.country}`,
    `Submitted at: ${payload.submittedAt}`,
    "",
    payload.message,
  ].join("\n");

  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
