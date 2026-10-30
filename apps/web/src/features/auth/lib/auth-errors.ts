import { ApiError } from "~/features/shop/api/http";

export type AuthAction = "login" | "register" | "logout";

export function authErrorMessage(error: unknown, action: AuthAction): string {
  if (error instanceof ApiError) {
    if (error.status === 0) return error.message;
    if (error.status === 401) return "Email atau password salah.";
    if (error.status === 409) return "Email sudah terdaftar.";
    if (error.status === 419) {
      return "Sesi keamanan kedaluwarsa. Muat ulang halaman lalu coba lagi.";
    }
    if (error.status === 422) {
      return "Periksa kembali data yang Anda masukkan.";
    }
    if (error.status === 429) {
      return "Terlalu banyak percobaan. Coba lagi dalam satu menit.";
    }
    if (error.status >= 500) {
      return "Server sedang bermasalah. Coba lagi beberapa saat lagi.";
    }
    return error.message;
  }

  if (error instanceof TypeError) {
    return "Tidak dapat terhubung ke server. Periksa koneksi dan konfigurasi API.";
  }

  return action === "login"
    ? "Gagal masuk. Coba lagi."
    : action === "register"
      ? "Gagal membuat akun. Coba lagi."
      : "Gagal keluar. Coba lagi.";
}

export function firstFieldErrors(
  error: unknown,
): Record<string, string> | null {
  if (!(error instanceof ApiError) || !error.errors) return null;

  return Object.fromEntries(
    Object.entries(error.errors).map(([field, messages]) => [
      field,
      messages[0] ?? "Nilai tidak valid",
    ]),
  );
}
