import { describe, expect, it } from "vitest";
import {
  formatFileSize,
  getPaymentProofError,
  PAYMENT_PROOF_MAX_SIZE,
} from "./payment-proof";

function imageFile(
  name = "bukti-transfer.png",
  type = "image/png",
  size = 1024,
): File {
  return new File([new Uint8Array(size)], name, { type });
}

describe("getPaymentProofError", () => {
  it("menerima JPG, PNG, dan WEBP maksimal 5MB", () => {
    expect(getPaymentProofError(1, imageFile())).toBeNull();
    expect(
      getPaymentProofError(1, imageFile("bukti.jpg", "image/jpeg")),
    ).toBeNull();
    expect(
      getPaymentProofError(1, imageFile("bukti.webp", "image/webp")),
    ).toBeNull();
  });

  it("menolak tipe file selain gambar yang didukung", () => {
    expect(
      getPaymentProofError(1, imageFile("bukti.pdf", "application/pdf")),
    ).toBe("Gunakan file JPG, PNG, atau WEBP.");
  });

  it("menolak file lebih dari 5MB", () => {
    expect(
      getPaymentProofError(
        1,
        imageFile("bukti.png", "image/png", PAYMENT_PROOF_MAX_SIZE + 1),
      ),
    ).toBe("Ukuran file maksimal 5MB.");
  });

  it("menolak file kosong", () => {
    expect(
      getPaymentProofError(1, imageFile("bukti.png", "image/png", 0)),
    ).toBe("File bukti pembayaran tidak boleh kosong.");
  });
});

describe("formatFileSize", () => {
  it("menampilkan satuan yang sesuai", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(2048)).toBe("2 KB");
    expect(formatFileSize(1.5 * 1024 * 1024)).toBe("1,5 MB");
  });
});
