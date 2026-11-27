import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AuthUser } from "@delysa/shared";
import { AdminShell } from "./admin-shell";

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

vi.mock("~/features/auth/hooks/use-logout-flow", () => ({
  useLogoutFlow: () => ({
    logout: vi.fn(),
    isPending: false,
    error: null,
  }),
}));

const ADMIN: AuthUser = {
  id: 1,
  name: "Sari Amelia",
  email: "sari@example.com",
  role: "admin",
};

describe("AdminShell", () => {
  it("renders one main, a skip link, the topbar, and the admin sidebar", () => {
    render(
      <AdminShell user={ADMIN}>
        <p>Konten dashboard</p>
      </AdminShell>,
    );

    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "admin-main");
    expect(
      screen.getByRole("link", { name: /Lewati ke konten utama/i }),
    ).toHaveAttribute("href", "#admin-main");
    expect(
      screen.getByRole("button", { name: "Buka atau tutup menu admin" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Lihat toko/i })).toHaveAttribute(
      "href",
      "/",
    );
    expect(
      screen.getByRole("navigation", { name: "Menu admin" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Konten dashboard")).toBeInTheDocument();
    expect(screen.getByText("Sari Amelia")).toBeInTheDocument();
  });
});
