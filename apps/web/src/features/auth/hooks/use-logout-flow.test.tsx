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
