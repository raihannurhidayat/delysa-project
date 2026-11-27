import type { ComponentType } from "react";
import { describe, expect, it, vi } from "vitest";
import { Route } from "./tambah";

const mocks = vi.hoisted(() => ({ redirect: vi.fn() }));

vi.mock("@tanstack/react-router", async () => {
  return {
    createFileRoute: () => (options: { component: ComponentType }) => ({
      options,
    }),
    redirect: (options: unknown) => {
      mocks.redirect(options);
      throw new Error("REDIRECT");
    },
    useNavigate: () => vi.fn(),
  };
});

type RouteShape = {
  options: {
    component: ComponentType;
    beforeLoad: (input: { context: { user: { role: string } } }) => void;
    head: () => { meta: { title: string }[] };
  };
};

describe("admin product create route guard", () => {
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

  it("exposes the page component and meta title", () => {
    const route = Route as unknown as RouteShape;

    expect(route.options.component).toBeTypeOf("function");
    expect(route.options.head().meta[0]?.title).toBe(
      "Tambah Produk Baru — Admin Delysa Florist",
    );
  });
});
