import type { ComponentType } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Route } from "./$orderId";

const mocks = vi.hoisted(() => ({ redirect: vi.fn() }));

vi.mock("@tanstack/react-router", async () => {
  const React = await import("react");

  return {
    createFileRoute: () => (options: { component: ComponentType }) => ({
      options,
    }),
    redirect: (options: unknown) => {
      mocks.redirect(options);
      throw new Error("REDIRECT");
    },
  };
});

type RouteShape = {
  options: {
    component: ComponentType;
    beforeLoad: (input: { context: { user: { role: string } } }) => void;
  };
};

describe("admin order detail route guard", () => {
  it("lets an admin through the beforeLoad guard", () => {
    const route = Route as unknown as RouteShape;

    expect(() =>
      route.options.beforeLoad({
        context: { user: { role: "admin" } },
      }),
    ).not.toThrow();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("redirects a non-admin to their role home", () => {
    const route = Route as unknown as RouteShape;

    expect(() =>
      route.options.beforeLoad({
        context: { user: { role: "customer" } },
      }),
    ).toThrow();
    expect(mocks.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ to: "/akun" }),
    );
  });
});

describe("admin order detail route component", () => {
  it("exposes the page component and meta title", () => {
    const route = Route as unknown as RouteShape;

    expect(route.options.component).toBeTypeOf("function");

    const head = (
      Route as unknown as {
        options: {
          head: () => { meta: { title: string }[] };
        };
      }
    ).options.head();

    expect(head.meta[0]?.title).toBe("Detail Pesanan — Admin Delysa Florist");
  });
});
