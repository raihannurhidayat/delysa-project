/**
 * Konfigurasi API dibaca SEKALI di sini, bukan di komponen.
 * - `VITE_API_URL` mengaktifkan auth dan menjadi basis request nyata.
 * - `VITE_MOCK_STOREFRONT=true` menahan storefront di mock walau auth aktif.
 * Tanpa dependency HTTP — native `fetch` sudah cukup.
 */

const RAW_API_BASE_URL = (
  (import.meta.env.VITE_API_URL as string | undefined) ?? ""
).trim();

export const API_BASE_URL = RAW_API_BASE_URL.replace(/\/$/, "");

export function resolveMockMode(
  apiBaseUrl: string,
  mockStorefrontFlag: string | undefined,
): boolean {
  const explicitMock =
    (mockStorefrontFlag ?? "").trim().toLowerCase() === "true";
  return explicitMock || apiBaseUrl.trim() === "";
}

const MOCK_STOREFRONT = resolveMockMode(
  API_BASE_URL,
  import.meta.env.VITE_MOCK_STOREFRONT as string | undefined,
);

function resolveApiOrigin(baseUrl: string): string {
  if (!baseUrl) return "";
  const fallbackOrigin =
    typeof window === "undefined" ? "http://localhost" : window.location.origin;

  try {
    return new URL(baseUrl, fallbackOrigin).origin;
  } catch {
    return "";
  }
}

export const API_ORIGIN = resolveApiOrigin(API_BASE_URL);

export class ApiError extends Error {
  status: number;
  code?: string;
  errors?: Record<string, string[]>;
  payload?: unknown;

  constructor(
    status: number,
    message: string,
    options: {
      code?: string;
      errors?: Record<string, string[]>;
      payload?: unknown;
    } = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = options.code;
    this.errors = options.errors;
    this.payload = options.payload;
  }
}

/**
 * True bila storefront memakai mock. Default lama dipertahankan:
 * URL kosong = mock; flag eksplisit true = mock meski URL terisi.
 */
export function isMockMode(): boolean {
  return MOCK_STOREFRONT;
}

/** True bila auth punya basis API dan boleh melakukan request nyata. */
export function isAuthConfigured(): boolean {
  return API_BASE_URL !== "";
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const prefix = `${name}=`;
  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  if (!match) return null;

  try {
    return decodeURIComponent(match.slice(prefix.length));
  } catch {
    return match.slice(prefix.length);
  }
}

async function refreshCsrfToken(): Promise<string> {
  const response = await fetch(`${API_ORIGIN}/sanctum/csrf-cookie`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new ApiError(
      response.status,
      "Gagal menyiapkan sesi keamanan. Coba muat ulang halaman.",
    );
  }

  const token = readCookie("XSRF-TOKEN");
  if (!token) {
    throw new ApiError(
      0,
      "Token keamanan tidak ditemukan. Periksa konfigurasi cookie API.",
    );
  }

  return token;
}

async function toApiError(
  response: Response,
  method: string,
  path: string,
): Promise<ApiError> {
  const fallback = `${method} ${path} gagal (${response.status})`;
  const payload = await response.json().catch(() => null);
  const message =
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string"
      ? payload.message
      : fallback;
  const code =
    payload &&
    typeof payload === "object" &&
    "code" in payload &&
    typeof payload.code === "string"
      ? payload.code
      : undefined;
  const errors =
    payload &&
    typeof payload === "object" &&
    "errors" in payload &&
    payload.errors &&
    typeof payload.errors === "object"
      ? (payload.errors as Record<string, string[]>)
      : undefined;

  return new ApiError(response.status, message, {
    code,
    errors,
    payload,
  });
}

async function requestJson<T>(
  method: "GET" | "POST",
  path: string,
  body: unknown,
  signal: AbortSignal | undefined,
  retryOnCsrfFailure: boolean,
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  let payload: BodyInit | undefined;

  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  if (method !== "GET") {
    headers["X-XSRF-TOKEN"] = await refreshCsrfToken();
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: payload,
    credentials: "include",
    signal: signal ?? AbortSignal.timeout(method === "GET" ? 10_000 : 30_000),
  });

  if (response.status === 419 && retryOnCsrfFailure) {
    return requestJson(method, path, body, signal, false);
  }

  if (!response.ok) {
    throw await toApiError(response, method, path);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) return undefined as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError(
      response.status,
      `Respons ${method} ${path} bukan JSON yang valid.`,
      { payload: text },
    );
  }
}

export async function apiFetch<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  return requestJson<T>("GET", path, undefined, signal, false);
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<T> {
  return requestJson<T>("POST", path, body, signal, true);
}

export async function apiUpload<T>(
  path: string,
  formData: FormData,
  signal?: AbortSignal,
): Promise<T> {
  return requestJson<T>("POST", path, formData, signal, true);
}
