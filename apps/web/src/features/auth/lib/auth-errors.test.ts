import { describe, expect, it } from "vitest";
import { ApiError } from "~/features/shop/api/http";
import { authErrorMessage, firstFieldErrors } from "./auth-errors";

describe("authErrorMessage", () => {
  it("maps credential, duplicate, and rate-limit failures", () => {
    expect(
      authErrorMessage(new ApiError(401, "Unauthenticated"), "login"),
    ).toBe("Email atau password salah.");
    expect(authErrorMessage(new ApiError(409, "Conflict"), "register")).toBe(
      "Email sudah terdaftar.",
    );
    expect(authErrorMessage(new ApiError(429, "Too many"), "login")).toBe(
      "Terlalu banyak percobaan. Coba lagi dalam satu menit.",
    );
  });

  it("maps validation and configuration failures", () => {
    expect(authErrorMessage(new ApiError(422, "Invalid"), "register")).toBe(
      "Periksa kembali data yang Anda masukkan.",
    );
    expect(
      authErrorMessage(new ApiError(0, "API belum dikonfigurasi"), "login"),
    ).toBe("API belum dikonfigurasi");
    expect(
      authErrorMessage(new TypeError("Failed to fetch"), "login"),
    ).toContain("Tidak dapat terhubung");
  });
});

describe("firstFieldErrors", () => {
  it("takes the first message per field from a 422 payload", () => {
    const error = new ApiError(422, "Invalid", {
      errors: {
        email: ["Email sudah dipakai.", "Email tidak valid."],
        password: ["Password terlalu pendek."],
      },
    });

    expect(firstFieldErrors(error)).toEqual({
      email: "Email sudah dipakai.",
      password: "Password terlalu pendek.",
    });
  });

  it("returns null for errors without field details", () => {
    expect(firstFieldErrors(new ApiError(401, "Unauthenticated"))).toBeNull();
    expect(firstFieldErrors(new Error("boom"))).toBeNull();
  });
});
