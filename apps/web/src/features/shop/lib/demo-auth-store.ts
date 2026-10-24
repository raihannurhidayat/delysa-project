export type DemoAuthMode = "guest" | "customer";

export const DEMO_AUTH_STORAGE_KEY = "delysa:demo-auth:v1";
export const DEMO_CUSTOMER_NAME = "Sari Amelia";
export const DEMO_AUTH_MODES = ["guest", "customer"] as const;

let currentMode: DemoAuthMode | null = null;
let initialized = false;
const listeners = new Set<() => void>();

function isMode(value: unknown): value is DemoAuthMode {
  return (
    typeof value === "string" &&
    (DEMO_AUTH_MODES as readonly string[]).includes(value)
  );
}

function readStoredMode(): DemoAuthMode {
  if (typeof window === "undefined") return "guest";
  try {
    const value = window.localStorage.getItem(DEMO_AUTH_STORAGE_KEY);
    return isMode(value) ? value : "guest";
  } catch {
    return "guest";
  }
}

function hydrate() {
  if (initialized) return;
  initialized = true;
  currentMode = readStoredMode();
}

function notify() {
  listeners.forEach((listener) => listener());
}

export function getDemoAuthSnapshot(): DemoAuthMode {
  if (!initialized && typeof window !== "undefined") hydrate();
  return currentMode ?? "guest";
}

export function getDemoAuthServerSnapshot(): DemoAuthMode {
  return "guest";
}

export function subscribeDemoAuth(listener: () => void): () => void {
  if (typeof window !== "undefined") hydrate();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setDemoAuthMode(mode: DemoAuthMode): void {
  if (!initialized && typeof window !== "undefined") hydrate();
  currentMode = mode;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(DEMO_AUTH_STORAGE_KEY, mode);
    } catch {
      // ignore quota
    }
  }
  notify();
}

export function toggleDemoAuthMode(): void {
  setDemoAuthMode(getDemoAuthSnapshot() === "customer" ? "guest" : "customer");
}
