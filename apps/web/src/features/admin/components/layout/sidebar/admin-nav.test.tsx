import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SidebarProvider } from "~/components/ui/sidebar";
import { AdminNav } from "./admin-nav";

const mocks = vi.hoisted(() => ({ pathname: "/admin" }));

vi.mock("@tanstack/react-router", async () => {
  const React = await import("react");

  return {
    useLocation: () => mocks.pathname,
    Link: ({
      to,
      children,
      ...props
    }: {
      to: string;
      children: React.ReactNode;
    }) => React.createElement("a", { href: to, ...props }, children),
  };
});

function renderNav() {
  return render(
    <SidebarProvider>
      <AdminNav />
    </SidebarProvider>,
  );
}

describe("AdminNav", () => {
  beforeEach(() => {
    mocks.pathname = "/admin";
  });

  it("marks only the current path active and disables unavailable routes", () => {
    renderNav();

    const dashboard = screen.getByRole("link", { name: "Dashboard" });
    expect(dashboard).toHaveAttribute("href", "/admin");
    expect(dashboard).toHaveAttribute("aria-current", "page");

    const products = screen.getByRole("link", { name: "Produk" });
    expect(products).toHaveAttribute("href", "/admin/produk");
    expect(products).not.toHaveAttribute("aria-current");

    const orders = screen.getByRole("link", { name: "Pesanan" });
    expect(orders).toHaveAttribute("href", "/admin/pesanan");
    expect(orders).not.toHaveAttribute("aria-current");

    expect(screen.getAllByText("Segera")).toHaveLength(2);
  });

  it("marks the orders link active on /admin/pesanan", () => {
    mocks.pathname = "/admin/pesanan";
    renderNav();

    expect(screen.getByRole("link", { name: "Pesanan" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Produk" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("marks the products link active on /admin/produk", () => {
    mocks.pathname = "/admin/produk";
    renderNav();

    expect(screen.getByRole("link", { name: "Produk" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("does not mark the dashboard active on another path", () => {
    mocks.pathname = "/admin/users";
    renderNav();

    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("renders a labelled navigation landmark", () => {
    renderNav();

    expect(
      screen.getByRole("navigation", { name: "Menu admin" }),
    ).toBeInTheDocument();
  });
});
