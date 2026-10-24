"use client";

import { Button } from "~/components/ui/button";
import { useDemoAuth } from "~/features/shop/hooks/use-demo-auth";

export function DemoAuthSwitch() {
  const { mode, setMode } = useDemoAuth();

  if (!import.meta.env.DEV) return null;

  return (
    <div
      role="group"
      aria-label="Mode demo akun"
      data-testid="demo-auth-switch"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-1 rounded-full border border-[#E5E7EB] bg-white p-1 shadow-[0_12px_32px_-18px_rgba(17,24,39,0.4)]"
    >
      <Button
        type="button"
        size="sm"
        variant="ghost"
        aria-pressed={mode === "guest"}
        onClick={() => setMode("guest")}
        className={`h-8 rounded-full px-3 text-xs font-semibold ${
          mode === "guest"
            ? "bg-[#111111] text-white hover:bg-[#2A2A2A] hover:text-white"
            : "bg-white text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#111111]"
        }`}
      >
        Anonim
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        aria-pressed={mode === "customer"}
        onClick={() => setMode("customer")}
        className={`h-8 rounded-full px-3 text-xs font-semibold ${
          mode === "customer"
            ? "bg-[#111111] text-white hover:bg-[#2A2A2A] hover:text-white"
            : "bg-white text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#111111]"
        }`}
      >
        Login demo
      </Button>
    </div>
  );
}
