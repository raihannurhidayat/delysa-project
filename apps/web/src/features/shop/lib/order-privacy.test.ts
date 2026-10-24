import { describe, expect, it } from "vitest";
import {
  maskOrderAddress,
  maskOrderName,
  maskOrderPhone,
} from "./order-privacy";

describe("order privacy", () => {
  it("masks names", () => {
    expect(maskOrderName("dr. Amelia")).toBe("dr. A***");
    expect(maskOrderName("Sari")).toBe("S***");
    expect(maskOrderName("")).toBe("Pelanggan");
  });

  it("masks phone numbers", () => {
    expect(maskOrderPhone("082116789558")).toBe("0821****558");
    expect(maskOrderPhone("123")).toBe("****");
  });

  it("masks addresses", () => {
    expect(maskOrderAddress("Jl. Sutisna Senjaya No. 12, Tasikmalaya")).toBe(
      "Tasikmalaya, alamat lengkap disembunyikan",
    );
    expect(maskOrderAddress("")).toBe("Alamat disembunyikan");
  });
});
