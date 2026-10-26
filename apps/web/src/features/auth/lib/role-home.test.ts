import { describe, expect, it } from "vitest";
import { roleHome, roleLabel } from "./role-home";

describe("roleHome", () => {
  it("maps each role to its dashboard", () => {
    expect(roleHome("customer")).toBe("/akun");
    expect(roleHome("store_owner")).toBe("/toko");
    expect(roleHome("admin")).toBe("/admin");
  });
});

describe("roleLabel", () => {
  it("provides Indonesian labels", () => {
    expect(roleLabel("customer")).toBe("Pelanggan");
    expect(roleLabel("store_owner")).toBe("Pemilik Toko");
    expect(roleLabel("admin")).toBe("Admin");
  });
});
