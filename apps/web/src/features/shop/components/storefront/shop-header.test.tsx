import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NAV_LINKS, ShopHeader } from "./shop-header";

const useSession = vi.fn();

vi.mock("@tanstack/react-router", async () => {
  const React = await import("react");
  return {
    Link: ({
      to,
      children,
      activeOptions: _activeOptions,
      activeProps: _activeProps,
      inactiveProps: _inactiveProps,
      ...props
    }: {
      to: string;
      children: React.ReactNode;
      activeOptions?: unknown;
      activeProps?: unknown;
      inactiveProps?: unknown;
    }) => React.createElement("a", { href: to, ...props }, children),
    useLocation: ({
      select,
    }: {
      select: (location: { pathname: string }) => string;
    }) => select({ pathname: "/" }),
    useNavigate: () => vi.fn(),
  };
});

vi.mock("~/features/shop/hooks/use-mini-cart", () => ({
  useMiniCart: () => ({ count: 0 }),
}));

vi.mock("~/features/auth/hooks/use-session", () => ({
  useSession: () => useSession(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  useSession.mockReturnValue({ user: null });
});

describe("ShopHeader account entry", () => {
  it("links guests to sign in", () => {
    render(<ShopHeader />);

    expect(screen.getByRole("link", { name: "Masuk ke akun" })).toHaveAttribute(
      "href",
      "/sign-in",
    );
    expect(screen.queryByText("Sari")).not.toBeInTheDocument();
  });

  it("shows the customer name and account link", () => {
    useSession.mockReturnValue({
      user: {
        id: 1,
        name: "Sari Amelia",
        email: "sari@example.com",
        role: "customer",
      },
    });
    render(<ShopHeader />);
    expect(screen.getByText("Sari")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Buka akun" })).toHaveAttribute(
      "href",
      "/akun",
    );
  });

  it("sends store owners to the store dashboard", () => {
    useSession.mockReturnValue({
      user: {
        id: 2,
        name: "Budi Santoso",
        email: "toko@example.com",
        role: "store_owner",
      },
    });
    render(<ShopHeader />);
    expect(screen.getByRole("link", { name: "Buka akun" })).toHaveAttribute(
      "href",
      "/toko",
    );
  });

  it("adds Pesanan Saya to the desktop navigation", () => {
    expect(NAV_LINKS).toContainEqual({
      label: "Pesanan Saya",
      to: "/riwayat-pesanan",
    });
  });
});
