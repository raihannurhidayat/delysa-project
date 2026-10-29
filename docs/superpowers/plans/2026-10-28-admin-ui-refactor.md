# Admin Sidebar & Dashboard Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ganti chrome admin dari header/aside generik menjadi shell sidebar khusus admin, pindahkan halaman admin ke feature `admin`, dan pertahankan perilaku auth serta route yang sudah ada.

**Architecture:** `_authenticated/route.tsx` memilih `AdminShell` hanya untuk role `admin`; role lain tetap memakai `AuthenticatedShell`. `AdminShell` menyusun sidebar, topbar, skip link, dan satu `<main>`; `AdminSidebar` menyusun brand, navigasi, dan user menu. Logout diekstrak ke `useLogoutFlow` agar dua shell memakai perilaku yang sama.

**Tech Stack:** TanStack Start/Router 1.170, React 19, Tailwind 4, Base UI/shadcn sidebar, Vitest 5, Testing Library.

**Spec:** `docs/research/fe/admin-ui-refactor.md`

## Global Constraints

- Role tetap `admin`; jangan ubah backend, `packages/shared`, atau kontrak session.
- Hanya dashboard `/admin`; jangan buat route bisnis baru.
- Item sidebar yang belum punya route harus `disabled` + badge `Segera`; jangan memakai `href="#"` atau link mati.
- Light mode saja. Palet Delysa: utama `#FF6B35`, permukaan hangat `#FFF3ED`, teks aktif `#C2410C`, kanvas `#F8F9FA`, ink `#1A1A1A`, border `#E5E7EB`, muted `#6B7280`.
- Hanya satu landmark `<main>`; gunakan `SidebarInset` sebagai `<main>`, bukan `<main>` bersarang.
- Wajib: skip link ke `#admin-main`, `aria-current="page"` untuk item aktif, label nav `Menu admin`, tombol tutup mobile `Tutup menu admin`, target sentuh mobile minimal 44px.
- Gunakan lebar default primitive: sidebar desktop 16rem, sheet mobile 18rem, rail icon 3rem. Jangan override `--sidebar-width`.
- Jangan gunakan `asChild`; komponen Base UI di repo memakai prop `render`.
- Jangan tambah dependency. Jangan tulis komentar kode. Jangan edit `apps/web/src/routeTree.gen.ts`.
- Pertahankan pola test Vitest/Testing Library yang ada. Jangan memakai Playwright untuk plan ini.
- Jangan commit. Checkpoint hanya menjalankan test/build; commit hanya jika user memintanya.
- Semua teks UI memakai bahasa Indonesia dan ejaan persis yang ditentukan task.

## Review Focus

- **Logout gagal:** 401 harus tetap menuju `/sign-in`; 500/network harus menampilkan error inline dan tidak redirect. Test di Task 1 dan Task 3.
- **Nav aktif palsu:** `/admin/users` tidak boleh menandai Dashboard aktif; hanya path persis `/admin`. Test di Task 2.
- **Item belum tersedia:** Produk/Pesanan/Stok/Laporan harus tombol `disabled` dengan badge `Segera`, bukan link. Test di Task 2.
- **Identitas user:** nama panjang dan user tanpa avatar harus memakai inisial serta tetap bisa membuka menu. Test di Task 3.
- **Mobile close:** sheet sidebar harus punya tombol tutup berlabel, bukan mengandalkan close bawaan yang disembunyikan. Test di Task 4.

## File Structure

**Create**
- `apps/web/src/features/auth/hooks/use-logout-flow.ts` — flow logout bersama (clear session, redirect, error).
- `apps/web/src/features/auth/hooks/use-logout-flow.test.tsx`
- `apps/web/src/features/admin/components/layout/sidebar/admin-nav.tsx` — data menu + active/disabled.
- `apps/web/src/features/admin/components/layout/sidebar/admin-nav.test.tsx`
- `apps/web/src/features/admin/components/layout/sidebar/admin-user-menu.tsx` — identitas + logout.
- `apps/web/src/features/admin/components/layout/sidebar/admin-user-menu.test.tsx`
- `apps/web/src/features/admin/components/layout/sidebar/admin-sidebar.tsx` — komposisi sidebar.
- `apps/web/src/features/admin/components/layout/sidebar/admin-sidebar.test.tsx`
- `apps/web/src/features/admin/components/layout/admin-shell.tsx` — shell admin.
- `apps/web/src/features/admin/components/layout/admin-shell.test.tsx`
- `apps/web/src/features/admin/pages/admin-dashboard-page.tsx` — halaman dashboard.
- `apps/web/src/features/admin/pages/admin-dashboard-page.test.tsx`

**Modify**
- `apps/web/src/features/auth/lib/auth-errors.ts:3,29-31`
- `apps/web/src/features/auth/lib/auth-errors.test.ts`
- `apps/web/src/features/dashboard/components/authenticated-shell.tsx:1-44`
- `apps/web/vitest.setup.ts` — tambah polyfill `matchMedia`.
- `apps/web/src/routes/_authenticated/route.tsx:3,19-27`
- `apps/web/src/routes/_authenticated/admin.tsx:3,17-21`

**Delete**
- `apps/web/src/features/dashboard/pages/admin-home-page.tsx`
- `apps/web/src/components/app-sidebar.tsx`
- `apps/web/src/components/nav-main.tsx`
- `apps/web/src/components/nav-user.tsx`
- `apps/web/src/components/team-switcher.tsx`
- `apps/web/src/components/nav-projects.tsx`

---

### Task 1: Shared Logout Flow

**Files:**
- Modify: `apps/web/src/features/auth/lib/auth-errors.ts:3,29-31`
- Test: `apps/web/src/features/auth/lib/auth-errors.test.ts`
- Create: `apps/web/src/features/auth/hooks/use-logout-flow.ts`
- Test: `apps/web/src/features/auth/hooks/use-logout-flow.test.tsx`
- Modify: `apps/web/src/features/dashboard/components/authenticated-shell.tsx:1-44`

**Interfaces:**
- Consumes: `useLogout()` returns `{ logoutAsync, isPending }`; `authErrorMessage(error, action)`; `ApiError`; `useNavigate()` from `@tanstack/react-router`.
- Produces: `useLogoutFlow(): { logout: () => Promise<void>; isPending: boolean; error: string | null }`.

- [x] **Step 1: Write the failing tests**

Add to `auth-errors.test.ts`:

```tsx
it("uses a logout-specific fallback for unknown failures", () => {
  expect(authErrorMessage(new Error("boom"), "logout")).toBe(
    "Gagal keluar. Coba lagi.",
  );
});
```

Create `use-logout-flow.test.tsx`:

```tsx
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "~/features/shop/api/http";
import { useLogoutFlow } from "./use-logout-flow";

const mocks = vi.hoisted(() => ({
  logoutAsync: vi.fn(),
  navigate: vi.fn(),
  isPending: false,
}));

vi.mock("./use-logout", () => ({
  useLogout: () => ({
    logoutAsync: mocks.logoutAsync,
    isPending: mocks.isPending,
  }),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mocks.navigate,
}));

function renderFlow() {
  return renderHook(() => useLogoutFlow());
}

describe("useLogoutFlow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isPending = false;
  });

  it("navigates to sign-in after a successful logout", async () => {
    mocks.logoutAsync.mockResolvedValueOnce(undefined);
    const { result } = renderFlow();

    await act(async () => {
      await result.current.logout();
    });

    expect(mocks.navigate).toHaveBeenCalledWith({
      to: "/sign-in",
      replace: true,
    });
    expect(result.current.error).toBeNull();
  });

  it("lets a 401 finish the logout without showing an error", async () => {
    mocks.logoutAsync.mockRejectedValueOnce(
      new ApiError(401, "Unauthenticated"),
    );
    const { result } = renderFlow();

    await act(async () => {
      await result.current.logout();
    });

    expect(mocks.navigate).toHaveBeenCalledWith({
      to: "/sign-in",
      replace: true,
    });
    expect(result.current.error).toBeNull();
  });

  it("shows an inline error for a server failure", async () => {
    mocks.logoutAsync.mockRejectedValueOnce(new ApiError(500, "Boom"));
    const { result } = renderFlow();

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.error).toBe(
      "Server sedang bermasalah. Coba lagi beberapa saat lagi.",
    );
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});
```

- [x] **Step 2: Run the tests to verify they fail**

Run:

```powershell
pnpm --filter client-web-delysa-florist exec vitest run src/features/auth/lib/auth-errors.test.ts src/features/auth/hooks/use-logout-flow.test.tsx
```

Expected: FAIL because `use-logout-flow.ts` does not exist and `"logout"` is not a valid `AuthAction`.

- [x] **Step 3: Implement `authErrorMessage` logout fallback and `useLogoutFlow`**

In `auth-errors.ts`, change the type to:

```ts
export type AuthAction = "login" | "register" | "logout";
```

Change the final return to:

```ts
return action === "login"
  ? "Gagal masuk. Coba lagi."
  : action === "register"
    ? "Gagal membuat akun. Coba lagi."
    : "Gagal keluar. Coba lagi.";
```

Create `use-logout-flow.ts`:

```ts
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { authErrorMessage } from "~/features/auth/lib/auth-errors";
import { ApiError } from "~/features/shop/api/http";
import { useLogout } from "./use-logout";

export function useLogoutFlow() {
  const navigate = useNavigate();
  const { logoutAsync, isPending } = useLogout();
  const [error, setError] = useState<string | null>(null);

  const logout = async () => {
    setError(null);

    try {
      await logoutAsync();
      void navigate({ to: "/sign-in", replace: true });
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        void navigate({ to: "/sign-in", replace: true });
        return;
      }

      setError(authErrorMessage(cause, "logout"));
    }
  };

  return { logout, isPending, error };
}
```

- [x] **Step 4: Run the tests to verify they pass**

Run the same command. Expected: PASS.

- [x] **Step 5: Refactor `AuthenticatedShell` to use the shared flow**

Remove imports of `useState`, `useNavigate`, `authErrorMessage`, `useLogout`, and `ApiError`. Add:

```tsx
import { useLogoutFlow } from "~/features/auth/hooks/use-logout-flow";
```

Replace the local state and handler with:

```tsx
const { logout: handleLogout, isPending, error: logoutError } = useLogoutFlow();
```

Keep the existing button markup and `onClick={() => void handleLogout()}` calls unchanged.

- [x] **Step 6: Run auth and shell tests**

Run:

```powershell
pnpm --filter client-web-delysa-florist exec vitest run src/features/auth
```

Expected: PASS. Checkpoint; do not commit.

---

### Task 2: Admin Navigation

**Files:**
- Modify: `apps/web/vitest.setup.ts` — append polyfill.
- Create: `apps/web/src/features/admin/components/layout/sidebar/admin-nav.tsx`
- Test: `apps/web/src/features/admin/components/layout/sidebar/admin-nav.test.tsx`

**Interfaces:**
- Consumes: `useLocation({ select: (location) => location.pathname })`; `Link`; `SidebarGroup`, `SidebarGroupLabel`, `SidebarMenu`, `SidebarMenuBadge`, `SidebarMenuButton`, `SidebarMenuItem`.
- Produces: `AdminNav(): JSX.Element`; `ADMIN_NAV_ITEMS`; `AdminNavItem` with `{ title: string; to?: "/admin"; icon: LucideIcon }`.

- [x] **Step 1: Add `matchMedia` to the test setup**

Append to `apps/web/vitest.setup.ts`:

```ts
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

- [x] **Step 2: Write the failing test**

Create `admin-nav.test.tsx`:

```tsx
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

    const products = screen.getByRole("button", { name: "Produk" });
    expect(products).toBeDisabled();
    expect(products).toHaveAttribute("aria-disabled", "true");
    expect(screen.getAllByText("Segera")).toHaveLength(4);
  });

  it("does not mark the dashboard active on another path", () => {
    mocks.pathname = "/admin/users";
    renderNav();

    expect(
      screen.getByRole("link", { name: "Dashboard" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("renders a labelled navigation landmark", () => {
    renderNav();

    expect(
      screen.getByRole("navigation", { name: "Menu admin" }),
    ).toBeInTheDocument();
  });
});
```

- [x] **Step 3: Run the test to verify it fails**

Run:

```powershell
pnpm --filter client-web-delysa-florist exec vitest run src/features/admin/components/layout/sidebar/admin-nav.test.tsx
```

Expected: FAIL because `admin-nav.tsx` does not exist.

- [x] **Step 4: Implement `AdminNav`**

Create `admin-nav.tsx` with this structure:

```tsx
import { Link, useLocation } from "@tanstack/react-router";
import {
  BoxesIcon,
  LayoutDashboardIcon,
  PackageIcon,
  PieChartIcon,
  ShoppingCartIcon,
  type LucideIcon,
} from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar";

export type AdminNavItem = {
  title: string;
  to?: "/admin";
  icon: LucideIcon;
};

export const ADMIN_NAV_ITEMS = [
  { title: "Dashboard", to: "/admin", icon: LayoutDashboardIcon },
  { title: "Produk", icon: PackageIcon },
  { title: "Pesanan", icon: ShoppingCartIcon },
  { title: "Stok", icon: BoxesIcon },
  { title: "Laporan", icon: PieChartIcon },
] satisfies readonly AdminNavItem[];

export function AdminNav() {
  const pathname = useLocation({
    select: (location) => location.pathname,
  });

  return (
    <nav aria-label="Menu admin">
      <SidebarGroup>
        <SidebarGroupLabel>Menu</SidebarGroupLabel>
        <SidebarMenu>
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;

            if (!item.to) {
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    type="button"
                    disabled
                    aria-disabled="true"
                    title={item.title}
                    className="h-11 md:h-9"
                  >
                    <Icon aria-hidden="true" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                  <SidebarMenuBadge>Segera</SidebarMenuBadge>
                </SidebarMenuItem>
              );
            }

            const active = pathname === item.to;

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  render={
                    <Link
                      to={item.to}
                      aria-current={active ? "page" : undefined}
                    />
                  }
                  isActive={active}
                  tooltip={item.title}
                  className="h-11 md:h-9"
                >
                  <Icon aria-hidden="true" />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroup>
    </nav>
  );
}
```

Do not add `href="#"`; unavailable items are buttons.

- [x] **Step 5: Run the test to verify it passes**

Run the same command. Expected: PASS.

- [x] **Step 6: Run the auth suite to catch setup regressions**

Run:

```powershell
pnpm --filter client-web-delysa-florist exec vitest run src/features/auth
```

Expected: PASS. Checkpoint; do not commit.

---

### Task 3: Admin User Menu

**Files:**
- Create: `apps/web/src/features/admin/components/layout/sidebar/admin-user-menu.tsx`
- Test: `apps/web/src/features/admin/components/layout/sidebar/admin-user-menu.test.tsx`

**Interfaces:**
- Consumes: `useLogoutFlow()` from Task 1; `useSidebar()`; `AuthUser`; Avatar, DropdownMenu, SidebarMenu primitives.
- Produces: `AdminUserMenu({ user }: { user: AuthUser }): JSX.Element`.

- [x] **Step 1: Write the failing test**

- [x] **Step 2: Run the test to verify it fails**

Create `admin-user-menu.test.tsx`:

```tsx
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
  fireEvent.click(
    screen.getByRole("button", { name: /Sari Amelia/i }),
  );
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
```

- [x] **Step 2: Run the test to verify it fails**

Run:

```powershell
pnpm --filter client-web-delysa-florist exec vitest run src/features/admin/components/layout/sidebar/admin-user-menu.test.tsx
```

Expected: FAIL because `admin-user-menu.tsx` does not exist.

- [x] **Step 3: Implement `AdminUserMenu`**

Create `admin-user-menu.tsx` with:

```tsx
import type { AuthUser } from "@delysa/shared";
import { ChevronsUpDownIcon, LogOutIcon } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
} from "~/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "~/components/ui/sidebar";
import { useLogoutFlow } from "~/features/auth/hooks/use-logout-flow";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "A";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return `${first}${last}`.toUpperCase();
}

export function AdminUserMenu({ user }: { user: AuthUser }) {
  const { isMobile } = useSidebar();
  const { logout, isPending, error } = useLogoutFlow();
  const initials = getInitials(user.name);

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton
                  size="lg"
                  className="data-popup-open:bg-sidebar-accent"
                />
              }
            >
              <Avatar>
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs text-sidebar-foreground/70">
                  {user.email}
                </span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar>
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user.name}</span>
                    <span className="truncate text-xs text-sidebar-foreground/70">
                      {user.email}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  disabled={isPending}
                  onClick={() => void logout()}
                  className="h-11 md:h-9"
                >
                  <LogOutIcon />
                  {isPending ? "Keluar..." : "Keluar"}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      {error ? (
        <p role="alert" className="px-2 pt-2 text-[11px] text-[#B91C1C]">
          {error}
        </p>
      ) : null}
    </>
  );
}
```

- [x] **Step 4: Run the test to verify it passes**

Run the same command. Expected: PASS. If Base UI opens the menu on a different event, use `fireEvent.pointerDown(trigger)` before `fireEvent.click(trigger)`; do not change the component API.

- [x] **Step 5: Run the sidebar tests**

Run:

```powershell
pnpm --filter client-web-delysa-florist exec vitest run src/features/admin
```

Expected: PASS. Checkpoint; do not commit.

---

### Task 4: Admin Sidebar

**Files:**
- Create: `apps/web/src/features/admin/components/layout/sidebar/admin-sidebar.tsx`
- Test: `apps/web/src/features/admin/components/layout/sidebar/admin-sidebar.test.tsx`

**Interfaces:**
- Consumes: `AdminNav` from Task 2; `AdminUserMenu` from Task 3; `SidebarHeader`, `SidebarContent`, `SidebarFooter`, `SidebarRail`, `useSidebar`.
- Produces: `AdminSidebar({ user }: { user: AuthUser }): JSX.Element`.

- [x] **Step 1: Write the failing test**

Create `admin-sidebar.test.tsx`:

```tsx
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
```

- [x] **Step 2: Run the test to verify it fails**

Run:

```powershell
pnpm --filter client-web-delysa-florist exec vitest run src/features/admin/components/layout/sidebar/admin-sidebar.test.tsx
```

Expected: FAIL because `admin-sidebar.tsx` does not exist.

- [x] **Step 3: Implement `AdminSidebar`**

Create `admin-sidebar.tsx`:

```tsx
import type { AuthUser } from "@delysa/shared";
import { Flower2Icon, XIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "~/components/ui/sidebar";
import { AdminNav } from "./admin-nav";
import { AdminUserMenu } from "./admin-user-menu";

export function AdminSidebar({ user }: { user: AuthUser }) {
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex flex-row items-center gap-2">
        <Link
          to="/admin"
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <Flower2Icon className="size-5" aria-hidden="true" />
          </span>
          <span className="grid min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-extrabold tracking-tight">
              DELYSA
            </span>
            <span className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/60">
              Admin
            </span>
          </span>
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="ml-auto size-11 md:hidden"
          aria-label="Tutup menu admin"
          onClick={() => setOpenMobile(false)}
        >
          <XIcon aria-hidden="true" />
        </Button>
      </SidebarHeader>
      <SidebarContent>
        <AdminNav />
      </SidebarContent>
      <SidebarFooter>
        <AdminUserMenu user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
```

Do not add `"use client"`. Do not use `SidebarSeparator` or an extra `<main>`.

- [x] **Step 4: Run the test to verify it passes**

Run the same command. Expected: PASS.

- [x] **Step 5: Run all admin tests**

Run:

```powershell
pnpm --filter client-web-delysa-florist exec vitest run src/features/admin
```

Expected: PASS. Checkpoint; do not commit.

---

### Task 5: Admin Shell

**Files:**
- Create: `apps/web/src/features/admin/components/layout/admin-shell.tsx`
- Test: `apps/web/src/features/admin/components/layout/admin-shell.test.tsx`

**Interfaces:**
- Consumes: `AdminSidebar` from Task 4; `SidebarProvider`, `SidebarInset`, `SidebarTrigger`; `AuthUser`.
- Produces: `AdminShell({ user, children }: { user: AuthUser; children: ReactNode }): JSX.Element`.

- [x] **Step 1: Write the failing test**

Create `admin-shell.test.tsx`:

```tsx
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
```

- [x] **Step 2: Run the test to verify it fails**

Run:

```powershell
pnpm --filter client-web-delysa-florist exec vitest run src/features/admin/components/layout/admin-shell.test.tsx
```

Expected: FAIL because `admin-shell.tsx` does not exist.

- [x] **Step 3: Implement `AdminShell`**

Create `admin-shell.tsx`:

```tsx
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { AuthUser } from "@delysa/shared";
import { buttonVariants } from "~/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import { AdminSidebar } from "./sidebar/admin-sidebar";

export function AdminShell({
  user,
  children,
}: {
  user: AuthUser;
  children: ReactNode;
}) {
  return (
    <SidebarProvider>
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#C2410C] focus:shadow-lg focus:ring-2 focus:ring-[#FF6B35]"
      >
        Lewati ke konten utama
      </a>
      <AdminSidebar user={user} />
      <SidebarInset id="admin-main" tabIndex={-1} className="bg-[#F8F9FA]">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-[#E5E7EB] bg-white/95 px-3 backdrop-blur sm:px-4">
          <SidebarTrigger
            aria-label="Buka atau tutup menu admin"
            className="size-11 md:size-8"
          />
          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">
              Panel
            </p>
            <p className="truncate text-sm font-bold">Dashboard</p>
          </div>
          <Link
            to="/"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className:
                "ml-auto h-11 rounded-lg text-xs font-semibold sm:h-9",
            })}
          >
            <ArrowLeft size={14} aria-hidden="true" className="mr-1.5" />
            Lihat toko
          </Link>
        </header>
        <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

`SidebarInset` must remain the only `<main>`. Do not wrap the topbar or content in another `<main>`.

- [x] **Step 4: Run the test to verify it passes**

Run the same command. Expected: PASS.

- [x] **Step 5: Run all admin tests**

Run:

```powershell
pnpm --filter client-web-delysa-florist exec vitest run src/features/admin
```

Expected: PASS. Checkpoint; do not commit.

---

### Task 6: Dashboard Page, Route Selection, and Demo Cleanup

**Files:**
- Create: `apps/web/src/features/admin/pages/admin-dashboard-page.tsx`
- Test: `apps/web/src/features/admin/pages/admin-dashboard-page.test.tsx`
- Modify: `apps/web/src/routes/_authenticated/admin.tsx:3,17-21`
- Modify: `apps/web/src/routes/_authenticated/route.tsx:3,19-27`
- Delete: `apps/web/src/features/dashboard/pages/admin-home-page.tsx`
- Delete: `apps/web/src/components/app-sidebar.tsx`
- Delete: `apps/web/src/components/nav-main.tsx`
- Delete: `apps/web/src/components/nav-user.tsx`
- Delete: `apps/web/src/components/team-switcher.tsx`
- Delete: `apps/web/src/components/nav-projects.tsx`

**Interfaces:**
- Consumes: `AdminShell` from Task 5; `AuthUser`; `Link`; `buttonVariants`.
- Produces: `AdminDashboardPage({ user }: { user: AuthUser }): JSX.Element`; `AuthenticatedLayout` memilih `AdminShell` atau `AuthenticatedShell`.

- [x] **Step 1: Write the failing page test**

Create `admin-dashboard-page.test.tsx`:

```tsx
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
```

- [x] **Step 2: Run the test to verify it fails**

Run:

```powershell
pnpm --filter client-web-delysa-florist exec vitest run src/features/admin/pages/admin-dashboard-page.test.tsx
```

Expected: FAIL because `admin-dashboard-page.tsx` does not exist.

- [x] **Step 3: Implement `AdminDashboardPage`**

Create `admin-dashboard-page.tsx` with the existing three actions and this visual treatment:

```tsx
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  ClipboardList,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { AuthUser } from "@delysa/shared";
import { buttonVariants } from "~/components/ui/button";

const ACTIONS = [
  {
    title: "Pengguna",
    description: "Kelola pelanggan, pemilik toko, dan admin.",
    icon: Users,
  },
  {
    title: "Toko",
    description: "Tinjau dan atur profil toko mitra.",
    icon: Building2,
  },
  {
    title: "Pesanan",
    description: "Awasi pesanan dan verifikasi pembayaran.",
    icon: ClipboardList,
  },
] as const;

export function AdminDashboardPage({ user }: { user: AuthUser }) {
  const firstName = user.name.split(" ")[0] ?? user.name;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF3ED] px-3 py-1 text-[11px] font-semibold text-[#C2410C]">
          <ShieldCheck size={13} aria-hidden="true" />
          Admin
        </p>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
          Halo, {firstName}
        </h1>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-[#6B7280]">
          Kelola operasional Delysa Florist dari satu tempat. Menu pengguna,
          toko, dan pesanan akan tersedia bertahap.
        </p>
        <Link
          to="/"
          className={buttonVariants({
            className:
              "mt-4 h-11 rounded-lg bg-[#FF6B35] px-4 text-sm font-semibold text-white hover:bg-[#C2410C] sm:h-10",
          })}
        >
          Buka storefront
          <ArrowRight size={15} aria-hidden="true" className="ml-1.5" />
        </Link>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        {ACTIONS.map((action) => {
          const Icon = action.icon;

          return (
            <div
              key={action.title}
              className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-[#FFF3ED] text-[#FF6B35]">
                <Icon size={17} aria-hidden="true" />
              </span>
              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="text-sm font-bold">{action.title}</p>
                <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[10px] font-semibold text-[#6B7280]">
                  Segera
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[#6B7280]">
                {action.description}
              </p>
            </div>
          );
        })}
      </div>

      <p className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-xs leading-relaxed text-[#6B7280]">
        Akun admin dibuat melalui seeder. Manajemen pengguna berbasis UI belum
        termasuk dalam fase ini.
      </p>
    </div>
  );
}
```

Do not add KPI numbers, fake charts, or links to routes that do not exist.

- [x] **Step 4: Run the page test to verify it passes**

Run the same command. Expected: PASS.

- [x] **Step 5: Wire the admin route and shell selection**

Change `apps/web/src/routes/_authenticated/admin.tsx`:

```tsx
import { createFileRoute, redirect } from "@tanstack/react-router";
import { roleHome } from "~/features/auth/lib/role-home";
import { AdminDashboardPage } from "~/features/admin/pages/admin-dashboard-page";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: ({ context }) => {
    if (context.user.role !== "admin") {
      throw redirect({ to: roleHome(context.user.role) });
    }
  },
  head: () => ({
    meta: [{ title: "Dasbor Admin — Delysa Florist" }],
  }),
  component: AdminRoute,
});

function AdminRoute() {
  const { user } = Route.useRouteContext();

  return <AdminDashboardPage user={user} />;
}
```

Change `apps/web/src/routes/_authenticated/route.tsx`:

```tsx
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AdminShell } from "~/features/admin/components/layout/admin-shell";
import { sessionQueryOptions } from "~/features/auth/api/session";
import { AuthenticatedShell } from "~/features/dashboard/components/authenticated-shell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData(sessionQueryOptions);

    if (!user) {
      throw redirect({ to: "/sign-in" });
    }

    return { user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user } = Route.useRouteContext();

  if (user.role === "admin") {
    return (
      <AdminShell user={user}>
        <Outlet />
      </AdminShell>
    );
  }

  return (
    <AuthenticatedShell user={user}>
      <Outlet />
    </AuthenticatedShell>
  );
}
```

Do not change the `beforeLoad` guard or the non-admin shell behavior.

- [x] **Step 6: Delete the old admin page and demo sidebar files**

Run:

```powershell
Remove-Item -LiteralPath "apps/web/src/features/dashboard/pages/admin-home-page.tsx", "apps/web/src/components/app-sidebar.tsx", "apps/web/src/components/nav-main.tsx", "apps/web/src/components/nav-user.tsx", "apps/web/src/components/team-switcher.tsx", "apps/web/src/components/nav-projects.tsx"
```

- [x] **Step 7: Run the full web test suite**

Run:

```powershell
pnpm --filter client-web-delysa-florist test
```

Expected: PASS for all existing and new tests.

- [x] **Step 8: Run the web build and typecheck**

Run:

```powershell
pnpm --filter client-web-delysa-florist build
```

Expected: PASS; no TypeScript errors. The existing dependency warning `MODULE_LEVEL_DIRECTIVE` is allowed. Checkpoint; do not commit.

---

### Task 7: Final Verification

**Files:** none.

- [x] **Step 1: Run the full test suite again**

Run:

```powershell
pnpm --filter client-web-delysa-florist test
```

Expected: PASS.

- [x] **Step 2: Run the production build**

Run:

```powershell
pnpm --filter client-web-delysa-florist build
```

Expected: PASS with no errors.

- [x] **Step 3: Inspect the diff and ensure generated files are untouched**

Run:

```powershell
git status --short
git diff --stat
```

Expected: only the planned create/modify/delete paths appear; `apps/web/src/routeTree.gen.ts` must not appear as modified.

- [ ] **Step 4: Manual smoke check when an admin session is available**

Run `pnpm --filter client-web-delysa-florist dev`, sign in as admin, and check:

- `/admin` shows the sidebar, topbar, and exactly one main content area; no duplicate header/aside from `AuthenticatedShell`.
- Produk/Pesanan/Stok/Laporan are disabled with `Segera`.
- The mobile sheet has a visible `Tutup menu admin` button.
- The skip link appears on first Tab and moves focus to `#admin-main`.
- Logout from the user menu returns to `/sign-in`.

Do not commit unless the user explicitly asks.
