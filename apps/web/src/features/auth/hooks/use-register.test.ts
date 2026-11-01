import { createElement, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthUser } from "@delysa/shared";
import { register } from "~/features/auth/api/auth";
import { sessionQueryKey } from "~/features/auth/api/session";
import { toast } from "~/components/ui/toast";
import { useRegister } from "./use-register";

const mocks = vi.hoisted(() => ({
  register: vi.fn(),
  add: vi.fn(),
}));

vi.mock("~/features/auth/api/auth", () => ({ register: mocks.register }));
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

describe("useRegister", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stores the session and shows a success toast on register", async () => {
    const queryClient = new QueryClient();
    mocks.register.mockResolvedValueOnce(USER);

    const { result } = renderHook(() => useRegister(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.registerAsync({
      email: USER.email,
      password: "password123",
      name: USER.name,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // 1st call: onMutate loading toast, 2nd call: onSuccess success toast
    expect(mocks.add).toHaveBeenCalledWith({
      title: "Sedang memproses registrasi",
      type: "loading",
    });
    expect(mocks.add).toHaveBeenCalledWith({
      title: "Registrasi berhasil",
      type: "success",
    });
    expect(queryClient.getQueryData(sessionQueryKey)).toEqual(USER);
  });
});
