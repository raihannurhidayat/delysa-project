import { createElement, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthUser } from "@delysa/shared";
import { sessionQueryKey } from "~/features/auth/api/session";
import { ApiError } from "~/features/shop/api/http";
import { useLogout } from "./use-logout";

const mocks = vi.hoisted(() => ({
  logout: vi.fn(),
  invalidate: vi.fn(),
}));

vi.mock("~/features/auth/api/auth", () => ({ logout: mocks.logout }));
vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate: mocks.invalidate }),
}));

const USER: AuthUser = {
  id: 1,
  name: "Sari Amelia",
  email: "sari@example.com",
  role: "customer",
};

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  };
}

describe("useLogout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("clears the session cache and invalidates the router on success", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(sessionQueryKey, USER);
    mocks.logout.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useLogout(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.logoutAsync();

    expect(queryClient.getQueryData(sessionQueryKey)).toBeNull();
    expect(mocks.invalidate).toHaveBeenCalled();
  });

  it("clears the session cache when the server already has no session", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(sessionQueryKey, USER);
    mocks.logout.mockRejectedValueOnce(new ApiError(401, "Unauthenticated"));

    const { result } = renderHook(() => useLogout(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(result.current.logoutAsync()).rejects.toBeInstanceOf(ApiError);
    await waitFor(() =>
      expect(queryClient.getQueryData(sessionQueryKey)).toBeNull(),
    );
    expect(mocks.invalidate).toHaveBeenCalled();
  });
});
