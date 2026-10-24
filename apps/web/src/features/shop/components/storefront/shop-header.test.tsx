import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NAV_LINKS, ShopHeader } from "./shop-header";

const useDemoAuth = vi.fn();

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

vi.mock("~/features/shop/hooks/use-demo-auth", () => ({
  useDemoAuth: () => useDemoAuth(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  useDemoAuth.mockReturnValue({ isCustomer: false });
});

describe("ShopHeader order history entry", () => {
  it("links the account icon to the history page for guests", () => {
    render(<ShopHeader />);

    expect(
      screen.getByRole("link", { name: "Riwayat pesanan" }),
    ).toHaveAttribute("href", "/riwayat-pesanan");
    expect(screen.queryByText("Sari")).not.toBeInTheDocument();
  });

  it("shows the demo customer name next to the account icon", () => {
    useDemoAuth.mockReturnValue({ isCustomer: true });
    render(<ShopHeader />);
    expect(screen.getByText("Sari")).toBeInTheDocument();
  });

  it("adds Pesanan Saya to the desktop navigation", () => {
    expect(NAV_LINKS).toContainEqual({
      label: "Pesanan Saya",
      to: "/riwayat-pesanan",
    });
  });
});
