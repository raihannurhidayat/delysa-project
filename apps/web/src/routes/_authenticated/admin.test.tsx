import type { ComponentType } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Route } from "./admin";

vi.mock("@tanstack/react-router", async () => {
  const React = await import("react");

  return {
    createFileRoute: () => (options: { component: ComponentType }) => ({
      options,
    }),
    redirect: vi.fn(),
    Outlet: () =>
      React.createElement("div", null, "Konten child route admin"),
  };
});

type RouteShape = { options: { component: ComponentType } };

describe("admin layout route", () => {
  it("renders the matched child route through Outlet", () => {
    const AdminLayout = (Route as unknown as RouteShape).options.component;

    render(<AdminLayout />);

    expect(screen.getByText("Konten child route admin")).toBeInTheDocument();
  });
});
