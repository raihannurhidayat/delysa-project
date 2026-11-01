import { createElement, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthUser } from "@delysa/shared";
import { login } from "~/features/auth/api/auth";
import { sessionQueryKey } from "~/features/auth/api/session";
import { toast } from "~/components/ui/toast";
import { useLogin } from "./use-login";

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  add: vi.fn(),
}));

vi.mock("~/features/auth/api/auth", () => ({ login: mocks.login }));
vi.mock("~/components/ui/toast", () => ({ toast: { add: mocks.add } }));

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

describe("useLogin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stores the session and shows a success toast on login", async () => {
    const queryClient = new QueryClient();
    mocks.login.mockResolvedValueOnce(USER);

    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.loginAsync({
      email: USER.email,
      password: "password123",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // 1st call: onMutate loading toast, 2nd call: onSuccess success toast
    expect(mocks.add).toHaveBeenCalledWith({
      title: "Sedang memproses login",
      type: "loading",
    });
    expect(mocks.add).toHaveBeenCalledWith({
      title: "Login berhasil",
      type: "success",
    });
    expect(queryClient.getQueryData(sessionQueryKey)).toEqual(USER);
  });
});
