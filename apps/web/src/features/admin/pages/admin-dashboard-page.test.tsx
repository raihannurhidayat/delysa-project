import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AuthUser } from "@delysa/shared";
import { AdminDashboardPage } from "./admin-dashboard-page";

vi.mock("@tanstack/react-router", async () => {
  const React = await import("react");

  return {
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

const ADMIN: AuthUser = {
  id: 1,
  name: "Sari Amelia",
  email: "sari@example.com",
  role: "admin",
};

describe("AdminDashboardPage", () => {
  it("greets the admin and keeps the three honest action cards", () => {
    render(<AdminDashboardPage user={ADMIN} />);

    expect(
      screen.getByRole("heading", { name: "Halo, Sari" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Buka storefront/i }),
    ).toHaveAttribute("href", "/");
    expect(screen.getByText("Pengguna")).toBeInTheDocument();
    expect(screen.getByText("Toko")).toBeInTheDocument();
    expect(screen.getByText("Pesanan")).toBeInTheDocument();
    expect(screen.getAllByText("Segera")).toHaveLength(3);
  });
});
