import { describe, expect, it } from "vitest";

import {
  buildDemoRequestMailto,
  buildDemoRequestPayload,
  validateDemoRequest,
  type DemoRequestPayload,
  type DemoRequestValues,
} from "./demoRequest";

const completeValues: DemoRequestValues = {
  name: "Emma Stone",
  email: "emma@example.com",
  storeUrl: "https://example.myshopify.com",
  country: "Netherlands",
  message: "Please review our consent banner.",
};

describe("validateDemoRequest", () => {
  it("returns no errors for complete values", () => {
    expect(validateDemoRequest(completeValues)).toEqual({});
  });

  it("returns exact messages for empty required fields", () => {
    expect(
      validateDemoRequest({
        name: "",
        email: "",
        storeUrl: "",
        country: "",
        message: "",
      }),
    ).toEqual({
      name: "Enter your name.",
      email: "Enter a work email.",
      storeUrl: "Enter your Shopify store URL.",
      country: "Choose a country.",
      message: "Tell us what we should look at.",
    });
  });

  it("returns an exact message for malformed email", () => {
    expect(validateDemoRequest({ ...completeValues, email: "emma" })).toEqual({
      email: "Enter a valid email address.",
    });
  });

  it("returns an exact message for malformed store URL", () => {
    expect(validateDemoRequest({ ...completeValues, storeUrl: "not a url" })).toEqual({
      storeUrl: "Enter a valid store URL or domain.",
    });
  });
});

describe("buildDemoRequestPayload", () => {
  it("trims name and prefixes a domain-only store URL with https://", () => {
    const payload = buildDemoRequestPayload({
      ...completeValues,
      name: "  Emma Stone  ",
      storeUrl: "example.myshopify.com",
    });

    expect(payload).toMatchObject({
      name: "Emma Stone",
      storeUrl: "https://example.myshopify.com",
      source: "kukis-site",
    });
    expect(new Date(payload.submittedAt).toISOString()).toBe(payload.submittedAt);
  });
});

describe("buildDemoRequestMailto", () => {
  const payload: DemoRequestPayload = {
    ...completeValues,
    submittedAt: "2026-07-08T10:00:00.000Z",
    source: "kukis-site",
  };

  function getMailtoBody(mailto: string): string {
    const query = mailto.split("?")[1];
    const params = new URLSearchParams(query);

    return params.get("body") ?? "";
  }

  it("includes the selected store size when provided", () => {
    const body = getMailtoBody(
      buildDemoRequestMailto("demo@example.com", {
        ...payload,
        storeSize: "EUR 100k-EUR 500k GMV",
      }),
    );

    expect(body).toContain("Store size: EUR 100k-EUR 500k GMV");
  });

  it("includes Not provided when store size is empty", () => {
    const body = getMailtoBody(
      buildDemoRequestMailto("demo@example.com", {
        ...payload,
        storeSize: "",
      }),
    );

    expect(body).toContain("Store size: Not provided");
  });
});
