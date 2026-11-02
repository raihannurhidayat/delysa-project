import { describe, expect, it } from "vitest";

const PAST = "2026-11-02T04:00:00.000Z";
const NOW = new Date("2026-11-02T06:00:00.000Z");

import {
  formatRelativeAge,
  shortAddress,
  summarizeItems,
} from "./admin-order-format";

describe("formatRelativeAge", () => {
  it("formats minutes and hours relative to now", () => {
    expect(formatRelativeAge(NOW, PAST)).toBe("2 jam lalu");
    expect(
      formatRelativeAge(
        NOW,
        new Date(NOW.getTime() - 18 * 60_000).toISOString(),
      ),
    ).toBe("18 menit lalu");
    expect(formatRelativeAge(NOW, NOW.toISOString())).toBe("baru saja");
  });

  it("formats fractional hours of 2+ with one decimal", () => {
    const value = formatRelativeAge(
      NOW,
      new Date(NOW.getTime() - 3.1 * 3_600_000).toISOString(),
    );
    expect(value).toBe("3.1 jam lalu");
  });

  it("switches to days after 72 hours", () => {
    const value = formatRelativeAge(
      NOW,
      new Date(NOW.getTime() - 3 * 86_400_000).toISOString(),
    );
    expect(value).toBe("3 hari lalu");
  });

  it("falls back for invalid dates", () => {
    expect(formatRelativeAge(NOW, "bukan-tanggal")).toBe("—");
  });
});

describe("summarizeItems", () => {
  it("sums quantities and lists item names", () => {
    expect(
      summarizeItems([
        { name: "Monolith Peach", qty: 2 },
        { name: "Sunflower", qty: 2 },
      ]),
    ).toBe("4 item: Monolith Peach + Sunflower");
  });

  it("caps long names lists with indicator", () => {
    expect(
      summarizeItems([
        { name: "A", qty: 1 },
        { name: "B", qty: 1 },
        { name: "C", qty: 1 },
      ]),
    ).toBe("3 item: A + B + 1 lainnya");
  });

  it("returns singular for a single item", () => {
    expect(summarizeItems([{ name: "Buket Mawar", qty: 1 }])).toBe(
      "1 item: Buket Mawar",
    );
  });
});

describe("shortAddress", () => {
  it("truncates long addresses with ellipsis", () => {
    expect(
      shortAddress("Jl. HZ Mustofa No. 10 Tasikmalaya Jawa Barat", 28),
    ).toBe("Jl. HZ Mustofa No. 10 Tasikm…");
  });

  it("keeps short addresses intact", () => {
    expect(shortAddress("Jl. Melati No. 5", 28)).toBe("Jl. Melati No. 5");
  });
});
