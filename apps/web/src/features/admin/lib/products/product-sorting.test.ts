import { describe, expect, it } from "vitest";
import {
  PRODUCT_SORT_OPTIONS,
  sortKeyToState,
  sortStateToKey,
} from "./product-sorting";

describe("product sorting helpers", () => {
  it("maps every option to a stable table sorting state and back", () => {
    for (const option of PRODUCT_SORT_OPTIONS) {
      expect(sortStateToKey(sortKeyToState(option.value))).toBe(option.value);
    }
  });

  it("returns default for empty or unsupported header sorting", () => {
    expect(sortStateToKey([])).toBe("default");
    expect(sortStateToKey([{ id: "status", desc: false }])).toBe("default");
  });
});
