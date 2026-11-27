import type { ComponentType } from "react";
import { describe, expect, it, vi } from "vitest";
import { Route } from "./index";

vi.mock("@tanstack/react-router", async () => {
  const React = await import("react");

  return {
    createFileRoute: () => (options: { component: ComponentType }) => ({
      options,
    }),
  };
});

type RouteShape = {
  options: {
    component: ComponentType;
    head: () => { meta: { title: string }[] };
  };
};

describe("admin orders index route", () => {
  it("exposes the page component and meta title", () => {
    const route = Route as unknown as RouteShape;

    expect(route.options.component).toBeTypeOf("function");
    expect(route.options.head().meta[0]?.title).toBe(
      "Pesanan — Admin Delysa Florist",
    );
  });
});
