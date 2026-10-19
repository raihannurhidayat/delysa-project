import "@testing-library/jest-dom";
import { vi } from "vitest";

Object.defineProperty(window, "crypto", {
  value: {
    randomUUID: () => "550e8400-e29b-41d4-a716-446655440000",
  },
});

Object.defineProperty(window, "localStorage", {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

Object.defineProperty(document, "cookie", {
  value: "",
  writable: true,
  configurable: true,
});