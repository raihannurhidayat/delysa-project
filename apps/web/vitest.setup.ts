import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

Object.defineProperty(window, "crypto", {
  value: {
    randomUUID: () => "550e8400-e29b-41d4-a716-446655440000",
  },
});

class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

Object.defineProperty(window, "localStorage", {
  value: new MemoryStorage(),
  writable: true,
  configurable: true,
});

Object.defineProperty(window, "sessionStorage", {
  value: new MemoryStorage(),
  writable: true,
  configurable: true,
});

Object.defineProperty(URL, "createObjectURL", {
  value: vi.fn(() => "blob:mock-preview"),
  writable: true,
});

Object.defineProperty(URL, "revokeObjectURL", {
  value: vi.fn(),
  writable: true,
});

Object.defineProperty(document, "cookie", {
  value: "",
  writable: true,
  configurable: true,
});
