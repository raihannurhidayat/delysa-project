import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthUser } from "@delysa/shared";
import { SidebarProvider } from "~/components/ui/sidebar";
import { AdminUserMenu } from "./admin-user-menu";

const flow = vi.hoisted(() => ({
  logout: vi.fn(),
  isPending: false,
  error: null as string | null,
}));

vi.mock("~/features/auth/hooks/use-logout-flow", () => ({
  useLogoutFlow: () => flow,
}));

const ADMIN: AuthUser = {
  id: 1,
  name: "Sari Amelia",
  email: "sari@example.com",
  role: "admin",
};

function renderMenu(user: AuthUser = ADMIN) {
  return render(
    <SidebarProvider>
      <AdminUserMenu user={user} />
    </SidebarProvider>,
  );
}

async function openMenu() {
  fireEvent.click(screen.getByRole("button", { name: /Sari Amelia/i }));
  return screen.findByRole("menuitem", { name: /Keluar/i });
}

describe("AdminUserMenu", () => {
  beforeEach(() => {
    flow.logout.mockReset();
    flow.isPending = false;
    flow.error = null;
  });

  it("shows the admin identity and logs out from the menu", async () => {
    renderMenu();

    expect(screen.getByText("Sari Amelia")).toBeInTheDocument();
    expect(screen.getByText("sari@example.com")).toBeInTheDocument();
    expect(screen.getByText("SA")).toBeInTheDocument();

    const item = await openMenu();
    fireEvent.click(item);
    expect(flow.logout).toHaveBeenCalledTimes(1);
  });

  it("disables logout while pending", async () => {
    flow.isPending = true;
    renderMenu();

    const item = await openMenu();
    expect(item).toHaveTextContent("Keluar...");
    fireEvent.click(item);
    expect(flow.logout).not.toHaveBeenCalled();
  });

  it("renders a logout error as an alert", () => {
    flow.error = "Server sedang bermasalah. Coba lagi beberapa saat lagi.";
    renderMenu();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Server sedang bermasalah.",
    );
  });

  it("uses the first letter for a single-word name", () => {
    renderMenu({ ...ADMIN, name: "Admin" });

    expect(screen.getByText("A")).toBeInTheDocument();
  });
});
