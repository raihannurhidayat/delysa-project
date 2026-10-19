import { describe, it, expect } from "vitest";
import { checkoutFormSchema, type CheckoutFormData } from "./schemas";

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
