/**
 * Transport HTTP (dipakai saat `VITE_API_URL` terisi).
 * Basis URL dibaca SEKALI di sini, bukan di komponen.
 * Tanpa dependency HTTP — native `fetch` sudah cukup untuk GET.
 */

export const API_BASE_URL = (
  (import.meta.env.VITE_API_URL as string | undefined) ?? ""
).replace(/\/$/, "");

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** True bila basis URL kosong/absen — seluruh request dilayani mock. */
export function isMockMode(): boolean {
  return API_BASE_URL === "";
}

export async function apiFetch<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    signal: signal ?? AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new ApiError(
      response.status,
      `Request ${path} gagal (${response.status})`,
    );
  }
  return (await response.json()) as T;
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: signal ?? AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    const err = await response
      .json()
      .catch(() => ({ message: "Request failed" }));
    throw new ApiError(
      response.status,
      err.message ?? `POST ${path} failed (${response.status})`,
    );
  }
  return (await response.json()) as T;
}

export async function apiUpload<T>(
  path: string,
  formData: FormData,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    body: formData,
    signal: signal ?? AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    const err = await response
      .json()
      .catch(() => ({ message: "Upload failed" }));
    throw new ApiError(
      response.status,
      err.message ?? `Upload ${path} failed (${response.status})`,
    );
  }
  return (await response.json()) as T;
}
