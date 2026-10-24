import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAdd } = vi.hoisted(() => ({ mockAdd: vi.fn() }));

vi.mock("~/components/ui/toast", () => ({
  toast: { add: mockAdd },
}));

import { copyText } from "./clipboard";

describe("copyText", () => {
  beforeEach(() => {
    mockAdd.mockClear();
  });

  it("copies text and shows a success toast", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    await expect(copyText("DLF-123", "Kode pesanan")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("DLF-123");
    expect(mockAdd).toHaveBeenCalledWith({
      title: "Kode pesanan disalin",
      type: "success",
    });
  });

  it("returns false when the clipboard is unavailable", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      configurable: true,
    });

    await expect(copyText("DLF-123", "Kode pesanan")).resolves.toBe(false);
    expect(mockAdd).toHaveBeenCalledWith({
      title: "Gagal menyalin",
      description: "Salin kode pesanan secara manual.",
      type: "error",
    });
  });
});
