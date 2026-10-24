import { beforeEach, describe, expect, it, vi } from "vitest";

type AuthStore = typeof import("./demo-auth-store");

async function loadStore(): Promise<AuthStore> {
  return import("./demo-auth-store");
}

describe("demo auth store", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it("defaults to guest", async () => {
    const store = await loadStore();
    expect(store.getDemoAuthSnapshot()).toBe("guest");
    expect(store.getDemoAuthServerSnapshot()).toBe("guest");
  });

  it("persists the selected mode", async () => {
    const store = await loadStore();
    store.setDemoAuthMode("customer");
    expect(store.getDemoAuthSnapshot()).toBe("customer");
    expect(localStorage.getItem(store.DEMO_AUTH_STORAGE_KEY)).toBe("customer");
  });

  it("falls back to guest for invalid storage", async () => {
    localStorage.setItem("delysa:demo-auth:v1", "admin");
    const store = await loadStore();
    expect(store.getDemoAuthSnapshot()).toBe("guest");
  });

  it("toggles between modes", async () => {
    const store = await loadStore();
    store.toggleDemoAuthMode();
    expect(store.getDemoAuthSnapshot()).toBe("customer");
    store.toggleDemoAuthMode();
    expect(store.getDemoAuthSnapshot()).toBe("guest");
  });
});
