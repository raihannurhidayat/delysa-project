import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AuthUser } from "@delysa/shared";
import { AdminDashboardPage } from "./admin-dashboard-page";

vi.mock("@tanstack/react-router", async () => {
  const React = await import("react");

  return {
    Link: ({
      to,
      params,
      children,
      ...props
    }: {
      to: string;
      params?: Record<string, string>;
      children: React.ReactNode;
    }) => {
      const href = params
        ? Object.entries(params).reduce(
            (acc, [key, value]) => acc.replace(`$${key}`, value),
            to,
          )
        : to;
      return React.createElement("a", { href, ...props }, children);
    },
  };
});

const ADMIN: AuthUser = {
  id: 1,
  name: "Sari Amelia",
  email: "sari@example.com",
  role: "admin",
};

describe("AdminDashboardPage", () => {
  it("greets the admin, links active modules, and shows live summary panels", () => {
    render(<AdminDashboardPage user={ADMIN} />);

    expect(
      screen.getByRole("heading", { name: "Halo, Sari" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Tambah Produk/i }),
    ).toHaveAttribute("href", "/admin/produk/tambah");
    expect(
      screen.getByRole("link", { name: /Kelola Pesanan/i }),
    ).toHaveAttribute("href", "/admin/pesanan");
    expect(
      screen.getByRole("link", { name: /Buka storefront/i }),
    ).toHaveAttribute("href", "/");
    expect(
      screen.getByRole("heading", { name: /Antrean Pesanan Perlu Tindakan/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Peringatan Stok Produk/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Laporan Penjualan/i }),
    ).toHaveAttribute("href", "/admin/laporan");
  });
});
