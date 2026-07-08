import { describe, expect, it } from "vitest";

import {
  buildDemoRequestPayload,
  validateDemoRequest,
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
