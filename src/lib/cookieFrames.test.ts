import { describe, expect, it } from "vitest";

import { FRAMES, framePath } from "./cookieFrames";

describe("framePath", () => {
  it("serves the 760px set to phones", () => {
    expect(framePath(0, true)).toBe("/cookie/760/f_001.webp");
  });

  it("serves the 1600px set to desktop", () => {
    expect(framePath(0, false)).toBe("/cookie/1600/f_001.webp");
  });

  it("pads the frame index to three digits", () => {
    expect(framePath(95, false)).toBe("/cookie/1600/f_096.webp");
    expect(framePath(9, false)).toBe("/cookie/1600/f_010.webp");
  });

  it("covers exactly the frames on disk", () => {
    expect(FRAMES).toBe(96);
  });
});
