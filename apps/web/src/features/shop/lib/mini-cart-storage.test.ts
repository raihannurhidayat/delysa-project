import { describe, it, expect, beforeEach } from "vitest";
import {
  getGuestToken,
  setGuestToken,
  loadCartState,
  saveCartState,
  upsertLine,
} from "./mini-cart-storage";
import type { MiniCartLine } from "~/features/shop/types";

const line = (over: Partial<MiniCartLine> = {}): MiniCartLine => ({
  slug: "mawar-merah",
  name: "Mawar Merah",
  image: "/img/mawar.jpg",
  sizeId: "standard",
  sizeLabel: "Standard",
  wrapId: "standard",
  price: 150000,
  qty: 1,
  kind: "product",
  ...over,
});

describe("guest token", () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = "";
  });

  it("returns null when no token is stored", () => {
    expect(getGuestToken()).toBeNull();
  });

  it("returns the token persisted in localStorage", () => {
    localStorage.setItem("guest_token", "ls-token");
    expect(getGuestToken()).toBe("ls-token");
  });

  it("falls back to the cookie and mirrors it to localStorage", () => {
    document.cookie = "guest_token=cookie-token";
    expect(getGuestToken()).toBe("cookie-token");
    expect(localStorage.getItem("guest_token")).toBe("cookie-token");
  });

  it("setGuestToken writes both localStorage and cookie", () => {
    setGuestToken("custom-guest-token");
    expect(localStorage.getItem("guest_token")).toBe("custom-guest-token");
    expect(document.cookie).toContain("guest_token=custom-guest-token");
    expect(getGuestToken()).toBe("custom-guest-token");
  });
});

describe("cart state persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("round-trips cart state through localStorage", () => {
    saveCartState({ lines: [line()], saved: [], instructions: "titip" });
    const loaded = loadCartState();
    expect(loaded?.lines).toHaveLength(1);
    expect(loaded?.lines[0].slug).toBe("mawar-merah");
    expect(loaded?.instructions).toBe("titip");
  });

  it("returns null for corrupt storage", () => {
    localStorage.setItem("delysa:cart:v2", "{not-json");
    expect(loadCartState()).toBeNull();
  });

  it("migrates v1 line array into v2 state", () => {
    localStorage.setItem("delysa:mini-cart:v1", JSON.stringify([line()]));
    const loaded = loadCartState();
    expect(loaded?.lines).toHaveLength(1);
    expect(loaded?.saved).toEqual([]);
    expect(localStorage.getItem("delysa:cart:v2")).not.toBeNull();
  });
});

describe("upsertLine", () => {
  it("adds a new line when no match", () => {
    expect(upsertLine([], line())).toHaveLength(1);
  });

  it("merges quantity for the same variant and caps at maxQty", () => {
    const merged = upsertLine([line({ qty: 3, maxQty: 5 })], line({ qty: 4 }));
    expect(merged).toHaveLength(1);
    expect(merged[0].qty).toBe(5);
  });

  it("keeps separate lines for different wrap", () => {
    const merged = upsertLine([line()], line({ wrapId: "premium" }));
    expect(merged).toHaveLength(2);
  });
});
