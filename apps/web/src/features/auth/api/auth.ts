import type { AuthUser, LoginInput, RegisterInput } from "@delysa/shared";
import {
  ApiError,
  apiFetch,
  apiPost,
  isAuthConfigured,
} from "~/features/shop/api/http";

export type AuthResponse = {
  user: AuthUser;
};

export const AUTH_API_NOT_CONFIGURED =
  "API autentikasi belum dikonfigurasi. Isi VITE_API_URL di apps/web/.env lalu jalankan ulang dev server.";

function assertApiConfigured(): void {
  if (!isAuthConfigured()) {
    throw new ApiError(0, AUTH_API_NOT_CONFIGURED);
  }
}

export async function fetchCurrentUser(
  signal?: AbortSignal,
): Promise<AuthUser | null> {
  if (!isAuthConfigured()) return null;

  try {
    const response = await apiFetch<AuthResponse>("/auth/me", signal);
    return response.user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}

export async function login(input: LoginInput): Promise<AuthUser> {
  assertApiConfigured();
  const response = await apiPost<AuthResponse>("/auth/login", input);
  return response.user;
}

export async function register(input: RegisterInput): Promise<AuthUser> {
  assertApiConfigured();
  const response = await apiPost<AuthResponse>("/auth/register", input);
  return response.user;
}

export async function logout(): Promise<void> {
  assertApiConfigured();
  await apiPost<void>("/auth/logout", {});
}
