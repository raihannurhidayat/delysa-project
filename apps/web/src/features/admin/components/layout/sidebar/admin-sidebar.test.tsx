import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AuthUser } from "@delysa/shared";
import { SidebarProvider } from "~/components/ui/sidebar";
import { AdminSidebar } from "./admin-sidebar";

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

describe("AdminSidebar", () => {
  it("renders the brand, navigation, user, and mobile close control", () => {
    render(
      <SidebarProvider>
        <AdminSidebar user={ADMIN} />
      </SidebarProvider>,
    );

    expect(screen.getByRole("link", { name: /DELYSA/i })).toHaveAttribute(
      "href",
      "/admin",
    );
    expect(
      screen.getByRole("navigation", { name: "Menu admin" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Sari Amelia")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Tutup menu admin" }),
    ).toBeInTheDocument();
  });
});
