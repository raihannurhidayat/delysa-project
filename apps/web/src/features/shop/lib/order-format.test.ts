import { describe, expect, it } from "vitest";
import { formatOrderDate, formatOrderShortDate } from "./order-format";

describe("order formatting", () => {
  it("formats a date in Jakarta time", () => {
    expect(formatOrderDate("2026-10-24T02:15:00.000Z")).toBe(
      "24 Okt 2026, 09:15 WIB",
    );
  });

  it("formats a short date", () => {
    expect(formatOrderShortDate("2026-10-24T02:15:00.000Z")).toBe(
      "24 Okt 2026",
    );
  });

  it("handles invalid input", () => {
    expect(formatOrderDate("")).toBe("Tanggal tidak tersedia");
    expect(formatOrderShortDate("not-a-date")).toBe("Tanggal tidak tersedia");
  });
});
