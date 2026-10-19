import { describe, it, expect } from "vitest";
import {
  checkoutFormSchema,
  checkoutSearchSchema,
  alamatStepSchema,
  paymentProofFileSchema,
  type CheckoutFormData,
} from "./schemas";

describe("checkoutFormSchema", () => {
  it("validates full form data", () => {
    const data: CheckoutFormData = {
      step: "alamat",
      recipientName: "Budi",
      recipientPhone: "08123456789",
      shippingAddress: "Jl. Pancasila 123",
      customNote: "Note",
      paymentProof: null,
      confirmed: false,
    };
    const result = checkoutFormSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("rejects invalid phone", () => {
    const result = checkoutFormSchema.safeParse({
      step: "alamat",
      recipientName: "Test",
      recipientPhone: "123",
      shippingAddress: "Alamat lengkap",
      customNote: "",
      paymentProof: null,
      confirmed: false,
    });
    expect(result.success).toBe(false);
  });

  it("validates review step with no data", () => {
    const result = checkoutFormSchema.safeParse({
      step: "review",
      recipientName: "",
      recipientPhone: "",
      shippingAddress: "",
      customNote: "",
      paymentProof: null,
      confirmed: false,
    });
    expect(result.success).toBe(true);
  });

  it("requires confirmed true for ringkasan step", () => {
    const result = checkoutFormSchema.safeParse({
      step: "ringkasan",
      recipientName: "Test",
      recipientPhone: "08123456789",
      shippingAddress: "Alamat lengkap",
      customNote: "",
      paymentProof: null,
      confirmed: false,
    });
    expect(result.success).toBe(false);
  });
});

describe("checkoutSearchSchema", () => {
  it("defaults to review when step is absent", () => {
    expect(checkoutSearchSchema.parse({})).toEqual({ step: "review" });
  });

  it("keeps a valid step", () => {
    expect(checkoutSearchSchema.parse({ step: "bayar" })).toEqual({
      step: "bayar",
    });
  });

  it("falls back to review for invalid step", () => {
    expect(checkoutSearchSchema.parse({ step: "hacked" })).toEqual({
      step: "review",
    });
  });
});

describe("alamatStepSchema", () => {
  it("returns Indonesian messages", () => {
    const result = alamatStepSchema.safeParse({
      recipientName: "A",
      recipientPhone: "123",
      shippingAddress: "pendek",
      customNote: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message);
      expect(messages).toContain("Nama penerima minimal 2 karakter");
      expect(messages).toContain("Nomor HP minimal 9 digit");
      expect(messages).toContain("Alamat minimal 10 karakter");
    }
  });

  it("rejects phone with letters", () => {
    const result = alamatStepSchema.safeParse({
      recipientName: "Budi",
      recipientPhone: "0812abc6789",
      shippingAddress: "Jl. Pancasila No. 123",
      customNote: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("paymentProofFileSchema", () => {
  it("accepts a valid jpeg under 5MB", () => {
    const file = new File(["x"], "bukti.jpg", { type: "image/jpeg" });
    const result = paymentProofFileSchema.safeParse({
      file,
      preview: "blob:mock",
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-image type", () => {
    const file = new File(["x"], "bukti.pdf", { type: "application/pdf" });
    const result = paymentProofFileSchema.safeParse({
      file,
      preview: "blob:mock",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Format file harus JPG, PNG, atau WEBP",
      );
    }
  });

  it("rejects files over 5MB", () => {
    const file = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "besar.png", {
      type: "image/png",
    });
    const result = paymentProofFileSchema.safeParse({
      file,
      preview: "blob:mock",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Ukuran file maksimal 5 MB");
    }
  });
});
