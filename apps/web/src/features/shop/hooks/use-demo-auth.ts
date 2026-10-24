import { useSyncExternalStore } from "react";
import {
  getDemoAuthServerSnapshot,
  getDemoAuthSnapshot,
  setDemoAuthMode,
  subscribeDemoAuth,
  toggleDemoAuthMode,
} from "~/features/shop/lib/demo-auth-store";

export function useDemoAuth() {
  const mode = useSyncExternalStore(
    subscribeDemoAuth,
    getDemoAuthSnapshot,
    getDemoAuthServerSnapshot,
  );

  return {
    mode,
    isCustomer: mode === "customer",
    setMode: setDemoAuthMode,
    toggle: toggleDemoAuthMode,
  };
}
