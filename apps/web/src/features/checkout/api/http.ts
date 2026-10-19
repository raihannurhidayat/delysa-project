import { ApiError, API_BASE_URL } from "~/features/shop/api/http";

export { ApiError };

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
