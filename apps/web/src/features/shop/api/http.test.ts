import { describe, expect, it } from "vitest";
import { resolveMockMode } from "./http";

describe("resolveMockMode", () => {
  it("uses mock when API URL is empty", () => {
    expect(resolveMockMode("", undefined)).toBe(true);
  });

  it("uses live API when URL is set and flag is absent", () => {
    expect(resolveMockMode("http://localhost:8000/api/v1", undefined)).toBe(
      false,
    );
  });

  it("keeps storefront mock when flag is true despite a configured API", () => {
    expect(resolveMockMode("http://localhost:8000/api/v1", "true")).toBe(true);
  });

  it("normalizes flag casing and whitespace", () => {
    expect(resolveMockMode("http://localhost:8000/api/v1", " TRUE ")).toBe(
      true,
    );
  });

  it("does not treat arbitrary flag values as true", () => {
    expect(resolveMockMode("http://localhost:8000/api/v1", "1")).toBe(false);
    expect(resolveMockMode("http://localhost:8000/api/v1", "false")).toBe(
      false,
    );
  });

  it("falls back to mock when URL is empty even if flag is false", () => {
    expect(resolveMockMode("", "false")).toBe(true);
  });
});
